import { Router } from 'express';
import * as adminController from '../controllers/admin.js';
import { authenticate, requireStaff, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas de admin requieren autenticación y ser staff (admin o recepcionista)
router.use(authenticate);
router.use(requireStaff as any);

router.get('/dashboard', (req, res, next) => adminController.getDashboardStats(req as AuthRequest, res, next));
router.get('/owners', (req, res, next) => adminController.getOwners(req as AuthRequest, res, next));
router.post('/owners', (req, res, next) => adminController.createOwner(req as AuthRequest, res, next));
router.patch('/owners/:id', (req, res, next) => adminController.updateOwner(req as AuthRequest, res, next));
router.get('/reservations', (req, res, next) => adminController.getAllReservations(req as AuthRequest, res, next));
router.get('/reservations/pending', (req, res, next) => adminController.getPendingReservations(req as AuthRequest, res, next));
router.get('/guests', (req, res, next) => adminController.getAllGuests(req as AuthRequest, res, next));
router.delete('/guests/:id', (req, res, next) => adminController.deleteGuest(req as AuthRequest, res, next));

export default router;
