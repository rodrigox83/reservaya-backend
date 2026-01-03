import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthRequest } from '../middlewares/auth.js';

const loginSchema = z.object({
  tower: z.string().min(1),
  floor: z.string().min(1),
  apartment: z.string().min(1),
  dni: z.string().min(8),
});

const registerOwnerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().min(8),
  email: z.string().email(),
  phone: z.string().min(9),
  departmentCode: z.string().min(1),
});

function getDepartmentCode(tower: string, floor: string, apartment: string): string {
  return `${floor}0${apartment}${tower}`;
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ');
      res.status(400).json({ error: `Datos inválidos: ${errors}` });
      return;
    }
    const { tower, floor, apartment, dni } = parseResult.data;
    const departmentCode = getDepartmentCode(tower, floor, apartment);

    // Buscar si existe un propietario para este departamento
    const owner = await prisma.owner.findUnique({
      where: { departmentCode },
    });

    // Si no hay propietario registrado, indicar que necesita registro
    if (!owner) {
      res.json({
        needsRegistration: true,
        departmentCode,
      });
      return;
    }

    // Validar DNI
    if (owner.dni !== dni) {
      throw new AppError('DNI incorrecto', 401);
    }

    // Buscar o crear el usuario
    let user = await prisma.user.findUnique({
      where: { tower_floor_apartment: { tower, floor, apartment } },
      include: { owner: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          tower,
          floor,
          apartment,
          ownerId: owner.id,
        },
        include: { owner: true },
      });
    }

    const token = jwt.sign(
      { id: user.id, departmentCode, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      needsRegistration: false,
      user: {
        id: user.id,
        tower: user.tower,
        floor: user.floor,
        apartment: user.apartment,
        departmentCode,
        role: user.role,
        owner: {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          dni: owner.dni,
          email: owner.email,
          phone: owner.phone,
          departmentCode: owner.departmentCode,
        },
      },
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerOwnerSchema.parse(req.body);

    // Verificar si ya existe un propietario con este DNI, email o departamento
    const existingOwner = await prisma.owner.findFirst({
      where: {
        OR: [
          { dni: data.dni },
          { email: data.email },
          { departmentCode: data.departmentCode },
        ],
      },
    });

    if (existingOwner) {
      if (existingOwner.dni === data.dni) {
        throw new AppError('Ya existe un propietario con este DNI', 400);
      }
      if (existingOwner.email === data.email) {
        throw new AppError('Ya existe un propietario con este email', 400);
      }
      throw new AppError('Ya existe un propietario para este departamento', 400);
    }

    // Crear el propietario
    const owner = await prisma.owner.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dni: data.dni,
        email: data.email,
        phone: data.phone,
        departmentCode: data.departmentCode,
      },
    });

    // Actualizar el usuario si existe para vincularlo con el propietario
    const [tower, rest] = [data.departmentCode.slice(-1), data.departmentCode.slice(0, -1)];
    const floor = rest.slice(0, -2);
    const apartment = rest.slice(-1);

    await prisma.user.updateMany({
      where: { tower, floor, apartment },
      data: { ownerId: owner.id },
    });

    res.status(201).json({
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      dni: owner.dni,
      email: owner.email,
      phone: owner.phone,
      departmentCode: owner.departmentCode,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const { departmentCode } = req.params;

    const owner = await prisma.owner.findUnique({
      where: { departmentCode },
    });

    if (!owner) {
      res.json(null);
      return;
    }

    res.json({
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      dni: owner.dni,
      email: owner.email,
      phone: owner.phone,
      departmentCode: owner.departmentCode,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Sesión cerrada' });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { owner: true },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const departmentCode = getDepartmentCode(user.tower, user.floor, user.apartment);

    res.json({
      id: user.id,
      tower: user.tower,
      floor: user.floor,
      apartment: user.apartment,
      departmentCode,
      role: user.role,
      owner: user.owner ? {
        id: user.owner.id,
        firstName: user.owner.firstName,
        lastName: user.owner.lastName,
        dni: user.owner.dni,
        email: user.owner.email,
        phone: user.owner.phone,
        departmentCode: user.owner.departmentCode,
      } : undefined,
    });
  } catch (error) {
    next(error);
  }
}
