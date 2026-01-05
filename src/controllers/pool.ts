import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { GuestType } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthRequest } from '../middlewares/auth.js';

const addGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentNumber: z.string().optional(),
  guestType: z.string().transform(val => val.toUpperCase()).pipe(
    z.enum(['RESIDENT', 'FRIEND', 'TENANT', 'AIRBNB'])
  ),
});

const registerAccessSchema = z.object({
  personType: z.enum(['owner', 'guest']),
  personId: z.string().min(1),
  estimatedHours: z.number().optional(),
});

// Función para limpiar accesos vencidos (marcar como COMPLETED)
export async function cleanupExpiredAccesses() {
  const config = await prisma.poolConfig.findFirst();
  const maxHours = config?.maxHoursPerVisit || 2;

  const expirationTime = new Date(Date.now() - maxHours * 60 * 60 * 1000);

  const result = await prisma.poolAccess.updateMany({
    where: {
      status: 'ACTIVE',
      entryTime: {
        lte: expirationTime,
      },
    },
    data: {
      status: 'COMPLETED',
      actualExitTime: new Date(),
    },
  });

  if (result.count > 0) {
    console.log(`[Pool Cleanup] ${result.count} accesos vencidos marcados como completados`);
  }

  return result.count;
}

// Obtener invitados del usuario actual
export async function getGuests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const guests = await prisma.poolGuest.findMany({
      where: { registeredById: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(guests);
  } catch (error) {
    next(error);
  }
}

// Agregar invitado
export async function addGuest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (!req.user.departmentCode) {
      throw new AppError('Usuario sin código de departamento', 400);
    }

    const data = addGuestSchema.parse(req.body);

    const guest = await prisma.poolGuest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        documentNumber: data.documentNumber,
        guestType: data.guestType,
        departmentCode: req.user.departmentCode,
        registeredById: req.user.id,
      },
    });

    res.status(201).json(guest);
  } catch (error) {
    next(error);
  }
}

// Eliminar invitado
export async function removeGuest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const { id } = req.params;

    const guest = await prisma.poolGuest.findUnique({
      where: { id },
    });

    if (!guest) {
      throw new AppError('Invitado no encontrado', 404);
    }

    if (guest.registeredById !== req.user.id) {
      throw new AppError('No tienes permiso para eliminar este invitado', 403);
    }

    await prisma.poolGuest.delete({
      where: { id },
    });

    res.json({ message: 'Invitado eliminado' });
  } catch (error) {
    next(error);
  }
}

// Obtener accesos activos
export async function getActiveAccesses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    // Limpiar accesos vencidos antes de consultar
    await cleanupExpiredAccesses();

    const accesses = await prisma.poolAccess.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { entryTime: 'desc' },
      include: {
        owner: {
          include: { owner: true }
        },
        guest: true,
      },
    });

    res.json(accesses);
  } catch (error) {
    next(error);
  }
}

// Obtener historial de accesos del usuario
export async function getAccesses(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const accesses = await prisma.poolAccess.findMany({
      where: { departmentCode: req.user.departmentCode },
      orderBy: { entryTime: 'desc' },
      take: 50,
    });

    res.json(accesses);
  } catch (error) {
    next(error);
  }
}

// Registrar acceso a la piscina
export async function registerAccess(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    if (!req.user.departmentCode) {
      throw new AppError('Usuario sin código de departamento', 400);
    }

    const data = registerAccessSchema.parse(req.body);

    // Limpiar accesos vencidos antes de verificar capacidad
    await cleanupExpiredAccesses();

    // Verificar capacidad
    const config = await prisma.poolConfig.findFirst();
    const maxCapacity = config?.maxCapacity || 25;
    const maxHoursPerVisit = config?.maxHoursPerVisit || 2;

    // Usar las horas estimadas del request si se proporcionan
    const estimatedHours = data.estimatedHours || maxHoursPerVisit;

    const activeCount = await prisma.poolAccess.count({
      where: { status: 'ACTIVE' },
    });

    if (activeCount >= maxCapacity) {
      throw new AppError('La piscina está llena. Capacidad máxima alcanzada.', 400);
    }

    let personName = '';
    let guestType: GuestType | null = null;
    let ownerId = null;
    let guestId = null;

    if (data.personType === 'owner') {
      // Obtener datos del usuario/propietario
      const user = await prisma.user.findUnique({
        where: { id: data.personId },
        include: { owner: true },
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      personName = user.owner
        ? `${user.owner.firstName} ${user.owner.lastName}`
        : `Depto ${user.tower}-${user.floor}${user.apartment}`;
      ownerId = user.id;
    } else {
      // Si es un guest logueado registrándose a sí mismo
      if (req.user.isGuest && data.personId === req.user.id) {
        const guest = await prisma.guest.findUnique({
          where: { id: data.personId },
        });

        if (!guest) {
          throw new AppError('Huésped no encontrado', 404);
        }

        personName = `${guest.firstName} ${guest.lastName}`;
        guestType = guest.guestType;
        // No tenemos guestId de PoolGuest, usamos null
        guestId = null;
      } else {
        // Obtener datos del invitado (PoolGuest)
        const poolGuest = await prisma.poolGuest.findUnique({
          where: { id: data.personId },
        });

        if (!poolGuest) {
          throw new AppError('Invitado no encontrado', 404);
        }

        // Si el usuario es un guest logueado, verificar que el PoolGuest fue registrado por él
        if (req.user.isGuest) {
          if (poolGuest.registeredById !== req.user.id) {
            throw new AppError('No tienes permiso para registrar este invitado', 403);
          }
        } else {
          // Si es un usuario normal (propietario), verificar que el PoolGuest fue registrado por él
          if (poolGuest.registeredById !== req.user.id) {
            throw new AppError('No tienes permiso para registrar este invitado', 403);
          }
        }

        personName = `${poolGuest.firstName} ${poolGuest.lastName}`;
        guestType = poolGuest.guestType;
        guestId = poolGuest.id;
      }
    }

    const entryTime = new Date();
    const expectedExitTime = new Date(entryTime.getTime() + estimatedHours * 60 * 60 * 1000);

    const access = await prisma.poolAccess.create({
      data: {
        personType: data.personType,
        personName,
        departmentCode: req.user.departmentCode,
        guestType,
        entryTime,
        estimatedHours,
        expectedExitTime,
        ownerId,
        guestId,
      },
    });

    res.status(201).json(access);
  } catch (error) {
    next(error);
  }
}

// Marcar salida
export async function markExit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const { id } = req.params;

    const access = await prisma.poolAccess.findUnique({
      where: { id },
    });

    if (!access) {
      throw new AppError('Acceso no encontrado', 404);
    }

    // Solo el propietario del departamento o un admin puede marcar la salida
    if (access.departmentCode !== req.user.departmentCode && req.user.role !== 'ADMIN') {
      throw new AppError('No tienes permiso para marcar esta salida', 403);
    }

    const updated = await prisma.poolAccess.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualExitTime: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas de la piscina
export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    // Limpiar accesos vencidos antes de consultar estadísticas
    await cleanupExpiredAccesses();

    const config = await prisma.poolConfig.findFirst();
    const maxCapacity = config?.maxCapacity || 25;
    const maxHoursPerVisit = config?.maxHoursPerVisit || 2;

    const activeAccesses = await prisma.poolAccess.findMany({
      where: { status: 'ACTIVE' },
    });

    const currentOccupancy = activeAccesses.length;
    const owners = activeAccesses.filter(a => a.personType === 'owner').length;
    const guests = activeAccesses.filter(a => a.personType === 'guest').length;

    res.json({
      currentOccupancy,
      maxCapacity,
      maxHoursPerVisit,
      availableSpots: maxCapacity - currentOccupancy,
      owners,
      guests,
      isOpen: config?.isActive ?? true,
      openingTime: config?.openingTime || '08:00',
      closingTime: config?.closingTime || '22:00',
    });
  } catch (error) {
    next(error);
  }
}
