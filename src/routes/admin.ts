import { Router } from 'express';
import * as adminController from '../controllers/admin.js';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(authenticate);
router.use(requireAdmin as any);

router.get('/dashboard', (req, res, next) => adminController.getDashboardStats(req as AuthRequest, res, next));
router.get('/owners', (req, res, next) => adminController.getOwners(req as AuthRequest, res, next));
router.get('/reservations', (req, res, next) => adminController.getAllReservations(req as AuthRequest, res, next));
router.get('/reservations/pending', (req, res, next) => adminController.getPendingReservations(req as AuthRequest, res, next));

export default router;
