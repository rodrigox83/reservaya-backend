import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    apartment: string;
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
      apartment: string;
    };
    req.user = decoded;
    next();
  } catch {
    throw new AppError('Token inválido', 401);
  }
}
