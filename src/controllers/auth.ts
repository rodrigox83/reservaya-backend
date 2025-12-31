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
});

const registerOwnerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
  departmentCode: z.string().min(1),
});

function getDepartmentCode(tower: string, floor: string, apartment: string): string {
  return `${floor}0${apartment}${tower}`;
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { tower, floor, apartment } = loginSchema.parse(req.body);
    const departmentCode = getDepartmentCode(tower, floor, apartment);

    // Buscar si existe un propietario para este departamento
    const owner = await prisma.owner.findUnique({
      where: { departmentCode },
    });

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
          ownerId: owner?.id,
        },
        include: { owner: true },
      });
    }

    // Si no hay propietario registrado, indicar que necesita registro
    if (!owner) {
      res.json({
        needsRegistration: true,
        departmentCode,
        user: {
          id: user.id,
          tower: user.tower,
          floor: user.floor,
          apartment: user.apartment,
          departmentCode,
        },
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, departmentCode },
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
        owner: {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
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

    // Verificar si ya existe un propietario con este email o departamento
    const existingOwner = await prisma.owner.findFirst({
      where: {
        OR: [
          { email: data.email },
          { departmentCode: data.departmentCode },
        ],
      },
    });

    if (existingOwner) {
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
      owner: user.owner ? {
        id: user.owner.id,
        firstName: user.owner.firstName,
        lastName: user.owner.lastName,
        email: user.owner.email,
        phone: user.owner.phone,
        departmentCode: user.owner.departmentCode,
      } : undefined,
    });
  } catch (error) {
    next(error);
  }
}
