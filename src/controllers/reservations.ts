import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthRequest } from '../middlewares/auth.js';

const createReservationSchema = z.object({
  grillId: z.string().uuid(),
  date: z.string().datetime(),
});

export async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { user: true, grill: true },
      orderBy: { date: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function getByUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId) {
      throw new AppError('No autorizado', 403);
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: { grill: true },
      orderBy: { date: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function getByGrill(req: Request, res: Response, next: NextFunction) {
  try {
    const { grillId } = req.params;

    const reservations = await prisma.reservation.findMany({
      where: { grillId },
      include: { user: true },
      orderBy: { date: 'desc' },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError('No autenticado', 401);
    }

    const { grillId, date } = createReservationSchema.parse(req.body);

    const existing = await prisma.reservation.findFirst({
      where: {
        grillId,
        date: new Date(date),
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      throw new AppError('La parrilla ya está reservada para esta fecha', 400);
    }

    const reservation = await prisma.reservation.create({
      data: {
        grillId,
        date: new Date(date),
        userId: req.user.id,
      },
      include: { grill: true },
    });

    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== req.user?.id) {
      throw new AppError('No autorizado', 403);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: req.body,
      include: { grill: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reservation.userId !== req.user?.id) {
      throw new AppError('No autorizado', 403);
    }

    await prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Reserva cancelada' });
  } catch (error) {
    next(error);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: { grill: true },
    });

    res.json(reservation);
  } catch (error) {
    next(error);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { grill: true },
    });

    res.json(reservation);
  } catch (error) {
    next(error);
  }
}
