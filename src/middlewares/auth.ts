import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    departmentCode?: string;
    role: string;
    isStaff?: boolean;
    isGuest?: boolean;
    guestType?: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token no proporcionado', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      departmentCode?: string;
      role: string;
      isStaff?: boolean;
      isGuest?: boolean;
      guestType?: string;
    };
    req.user = decoded;
    next();
  } catch {
    throw new AppError('Token inválido', 401);
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError('No autenticado', 401);
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('Acceso denegado. Se requiere rol de administrador.', 403);
  }

  next();
}

// Middleware para requerir que sea staff (admin o recepcionista)
export function requireStaff(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user || !req.user.isStaff) {
    throw new AppError('Acceso denegado. Se requiere ser personal autorizado.', 403);
  }

  next();
}

// Middleware para requerir rol específico de staff
export function requireStaffRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isStaff) {
      throw new AppError('Acceso denegado. Se requiere ser personal autorizado.', 403);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`Acceso denegado. Se requiere rol: ${roles.join(' o ')}`, 403);
    }

    next();
  };
}
