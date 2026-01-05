import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

const updateOwnerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dni: z.string().min(8).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(9).optional(),
});

const createOwnerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos'),
  tower: z.string().min(1, 'La torre es requerida'),
  floor: z.string().min(1, 'El piso es requerido'),
  apartment: z.string().min(1, 'El departamento es requerido'),
});

export async function getOwners(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const owners = await prisma.owner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            tower: true,
            floor: true,
            apartment: true,
          },
        },
      },
    });

    res.json(owners);
  } catch (error) {
    next(error);
  }
}

export async function getPendingReservations(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          include: {
            owner: true,
          },
        },
        grill: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function getAllReservations(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: {
          include: {
            owner: true,
          },
        },
        grill: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOwners,
      totalReservations,
      pendingReservations,
      approvedReservations,
      rejectedReservations,
      totalGrills,
      totalGuests,
      todayPoolAccesses,
      activePoolAccesses,
    ] = await Promise.all([
      prisma.owner.count(),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count({ where: { status: 'APPROVED' } }),
      prisma.reservation.count({ where: { status: 'REJECTED' } }),
      prisma.grill.count(),
      prisma.guest.count(),
      prisma.poolAccess.count({
        where: {
          entryTime: { gte: today },
        },
      }),
      prisma.poolAccess.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    res.json({
      totalOwners,
      totalReservations,
      pendingReservations,
      approvedReservations,
      rejectedReservations,
      totalGrills,
      totalGuests,
      todayPoolAccesses,
      activePoolAccesses,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const parseResult = updateOwnerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ');
      throw new AppError(`Datos inválidos: ${errors}`, 400);
    }

    const data = parseResult.data;

    // Verificar que el propietario existe
    const existingOwner = await prisma.owner.findUnique({
      where: { id },
    });

    if (!existingOwner) {
      throw new AppError('Propietario no encontrado', 404);
    }

    // Verificar unicidad de DNI si se está actualizando
    if (data.dni && data.dni !== existingOwner.dni) {
      const dniExists = await prisma.owner.findFirst({
        where: { dni: data.dni, id: { not: id } },
      });
      if (dniExists) {
        throw new AppError('Ya existe un propietario con este DNI', 400);
      }
    }

    // Verificar unicidad de email si se está actualizando
    if (data.email && data.email !== existingOwner.email) {
      const emailExists = await prisma.owner.findFirst({
        where: { email: data.email, id: { not: id } },
      });
      if (emailExists) {
        throw new AppError('Ya existe un propietario con este email', 400);
      }
    }

    const updatedOwner = await prisma.owner.update({
      where: { id },
      data,
    });

    res.json(updatedOwner);
  } catch (error) {
    next(error);
  }
}

export async function getAllGuests(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const guests = await prisma.guest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(guests);
  } catch (error) {
    next(error);
  }
}

export async function deleteGuest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { id },
    });

    if (!guest) {
      throw new AppError('Invitado no encontrado', 404);
    }

    await prisma.guest.delete({
      where: { id },
    });

    res.json({ message: 'Invitado eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

// Pool Configuration
const updatePoolConfigSchema = z.object({
  maxCapacity: z.number().min(1).max(100).optional(),
  maxHoursPerVisit: z.number().min(1).max(12).optional(),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive: z.boolean().optional(),
});

export async function getPoolConfig(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let config = await prisma.poolConfig.findFirst();

    // Si no existe configuración, crear una por defecto
    if (!config) {
      config = await prisma.poolConfig.create({
        data: {
          maxCapacity: 10,
          maxHoursPerVisit: 2,
          openingTime: '08:00',
          closingTime: '22:00',
          isActive: true,
        },
      });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
}

export async function updatePoolConfig(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = updatePoolConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ');
      throw new AppError(`Datos inválidos: ${errors}`, 400);
    }

    const data = parseResult.data;

    // Obtener o crear configuración
    let config = await prisma.poolConfig.findFirst();

    if (!config) {
      config = await prisma.poolConfig.create({
        data: {
          maxCapacity: data.maxCapacity ?? 10,
          maxHoursPerVisit: data.maxHoursPerVisit ?? 2,
          openingTime: data.openingTime ?? '08:00',
          closingTime: data.closingTime ?? '22:00',
          isActive: data.isActive ?? true,
        },
      });
    } else {
      config = await prisma.poolConfig.update({
        where: { id: config.id },
        data,
      });
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
}

export async function createOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createOwnerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ');
      throw new AppError(`Datos inválidos: ${errors}`, 400);
    }

    const { firstName, lastName, dni, email, phone, tower, floor, apartment } = parseResult.data;

    // Generar departmentCode: formato "pisoXapartamentoXtorre" ej: "101A"
    const departmentCode = `${floor}0${apartment}${tower}`;

    // Verificar si ya existe un propietario con este DNI
    const dniExists = await prisma.owner.findFirst({
      where: { dni },
    });
    if (dniExists) {
      throw new AppError('Ya existe un propietario con este DNI', 400);
    }

    // Verificar si ya existe un propietario con este email
    const emailExists = await prisma.owner.findFirst({
      where: { email },
    });
    if (emailExists) {
      throw new AppError('Ya existe un propietario con este email', 400);
    }

    // Verificar si ya existe un propietario para este departamento
    const departmentExists = await prisma.owner.findUnique({
      where: { departmentCode },
    });
    if (departmentExists) {
      throw new AppError('Ya existe un propietario registrado para este departamento', 400);
    }

    // Crear el propietario
    const owner = await prisma.owner.create({
      data: {
        firstName,
        lastName,
        dni,
        email,
        phone,
        departmentCode,
      },
    });

    // Vincular con usuario existente si existe
    await prisma.user.updateMany({
      where: { tower, floor, apartment },
      data: { ownerId: owner.id },
    });

    res.status(201).json(owner);
  } catch (error) {
    next(error);
  }
}
