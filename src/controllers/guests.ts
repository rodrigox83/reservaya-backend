import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';

const registerGuestSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  documentType: z.enum(['DNI', 'PASSPORT', 'CE', 'OTHER']).default('DNI'),
  documentNumber: z.string().min(6, 'El número de documento debe tener al menos 6 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(9, 'El teléfono debe tener al menos 9 dígitos').optional().or(z.literal('')),
  departmentCode: z.string().min(1, 'El departamento es requerido'),
  guestType: z.enum(['AIRBNB', 'FRIEND', 'TENANT']).default('AIRBNB'),
});

const checkGuestSchema = z.object({
  documentType: z.enum(['DNI', 'PASSPORT', 'CE', 'OTHER']),
  documentNumber: z.string().min(6),
});

// Verificar si un invitado ya está registrado
export async function checkGuest(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentType, documentNumber } = req.query;

    if (!documentType || !documentNumber) {
      throw new AppError('Tipo y número de documento son requeridos', 400);
    }

    const guest = await prisma.guest.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: documentType as 'DNI' | 'PASSPORT' | 'CE' | 'OTHER',
          documentNumber: documentNumber as string,
        },
      },
    });

    res.json({ exists: !!guest, guest });
  } catch (error) {
    next(error);
  }
}

// Registrar nuevo invitado
export async function registerGuest(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = registerGuestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => e.message).join(', ');
      throw new AppError(`Datos inválidos: ${errors}`, 400);
    }

    const data = parseResult.data;

    // Verificar si el departamento tiene propietario registrado
    const owner = await prisma.owner.findUnique({
      where: { departmentCode: data.departmentCode },
    });

    if (!owner) {
      throw new AppError('El departamento indicado no tiene propietario registrado', 400);
    }

    // Verificar si ya existe un invitado con este documento
    const existingGuest = await prisma.guest.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: data.documentType,
          documentNumber: data.documentNumber,
        },
      },
    });

    if (existingGuest) {
      // Si existe pero es para otro departamento, actualizar
      if (existingGuest.departmentCode !== data.departmentCode) {
        const updatedGuest = await prisma.guest.update({
          where: { id: existingGuest.id },
          data: {
            departmentCode: data.departmentCode,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || null,
            phone: data.phone || null,
            guestType: data.guestType,
          },
        });
        return res.json({
          message: 'Invitado actualizado exitosamente',
          guest: updatedGuest,
          isNew: false,
        });
      }

      // Si ya existe para el mismo departamento
      return res.json({
        message: 'Ya estás registrado para este departamento',
        guest: existingGuest,
        isNew: false,
      });
    }

    // Crear nuevo invitado
    const guest = await prisma.guest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        email: data.email || null,
        phone: data.phone || null,
        departmentCode: data.departmentCode,
        guestType: data.guestType,
      },
    });

    res.status(201).json({
      message: 'Registro exitoso',
      guest,
      isNew: true,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener invitado por documento
export async function getGuestByDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentType, documentNumber } = req.params;

    const guest = await prisma.guest.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: documentType as any,
          documentNumber,
        },
      },
    });

    if (!guest) {
      return res.json(null);
    }

    res.json(guest);
  } catch (error) {
    next(error);
  }
}
