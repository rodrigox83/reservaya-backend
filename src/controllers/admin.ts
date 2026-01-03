import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../middlewares/auth.js';

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
    const [
      totalOwners,
      totalReservations,
      pendingReservations,
      approvedReservations,
      rejectedReservations,
      totalGrills,
    ] = await Promise.all([
      prisma.owner.count(),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count({ where: { status: 'APPROVED' } }),
      prisma.reservation.count({ where: { status: 'REJECTED' } }),
      prisma.grill.count(),
    ]);

    res.json({
      totalOwners,
      totalReservations,
      pendingReservations,
      approvedReservations,
      rejectedReservations,
      totalGrills,
    });
  } catch (error) {
    next(error);
  }
}
