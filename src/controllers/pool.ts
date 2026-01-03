import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthRequest } from '../middlewares/auth.js';

const addGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  documentNumber: z.string().optional(),
  guestType: z.enum(['RESIDENT', 'FRIEND', 'TENANT', 'AIRBNB']),
});

const registerAccessSchema = z.object({
  personType: z.enum(['owner', 'guest']),
  personId: z.string().min(1),
  estimatedHours: z.number().min(1).max(12),
});

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

    // Verificar capacidad
    const config = await prisma.poolConfig.findFirst();
    const maxCapacity = config?.maxCapacity || 25;

    const activeCount = await prisma.poolAccess.count({
      where: { status: 'ACTIVE' },
    });

    if (activeCount >= maxCapacity) {
      throw new AppError('La piscina está llena. Capacidad máxima alcanzada.', 400);
    }

    let personName = '';
    let guestType = null;
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
      // Obtener datos del invitado
      const guest = await prisma.poolGuest.findUnique({
        where: { id: data.personId },
      });

      if (!guest) {
        throw new AppError('Invitado no encontrado', 404);
      }

      if (guest.registeredById !== req.user.id) {
        throw new AppError('No tienes permiso para registrar este invitado', 403);
      }

      personName = `${guest.firstName} ${guest.lastName}`;
      guestType = guest.guestType;
      guestId = guest.id;
    }

    const entryTime = new Date();
    const expectedExitTime = new Date(entryTime.getTime() + data.estimatedHours * 60 * 60 * 1000);

    const access = await prisma.poolAccess.create({
      data: {
        personType: data.personType,
        personName,
        departmentCode: req.user.departmentCode,
        guestType,
        entryTime,
        estimatedHours: data.estimatedHours,
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

    const config = await prisma.poolConfig.findFirst();
    const maxCapacity = config?.maxCapacity || 25;

    const activeAccesses = await prisma.poolAccess.findMany({
      where: { status: 'ACTIVE' },
    });

    const currentOccupancy = activeAccesses.length;
    const owners = activeAccesses.filter(a => a.personType === 'owner').length;
    const guests = activeAccesses.filter(a => a.personType === 'guest').length;

    res.json({
      currentOccupancy,
      maxCapacity,
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
