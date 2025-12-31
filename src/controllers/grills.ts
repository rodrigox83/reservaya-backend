import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';

export async function getAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const grills = await prisma.grill.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(grills);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const grill = await prisma.grill.findUnique({
      where: { id },
    });

    if (!grill) {
      throw new AppError('Parrilla no encontrada', 404);
    }

    res.json(grill);
  } catch (error) {
    next(error);
  }
}

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      throw new AppError('Fecha requerida', 400);
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        grillId: id,
        date: new Date(date),
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    res.json({ available: !reservation });
  } catch (error) {
    next(error);
  }
}
