import { Router } from 'express';
import * as poolController from '../controllers/pool.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Invitados
router.get('/guests', (req, res, next) => poolController.getGuests(req as AuthRequest, res, next));
router.post('/guests', (req, res, next) => poolController.addGuest(req as AuthRequest, res, next));
router.delete('/guests/:id', (req, res, next) => poolController.removeGuest(req as AuthRequest, res, next));

// Accesos
router.get('/accesses', (req, res, next) => poolController.getAccesses(req as AuthRequest, res, next));
router.get('/accesses/active', (req, res, next) => poolController.getActiveAccesses(req as AuthRequest, res, next));
router.post('/accesses', (req, res, next) => poolController.registerAccess(req as AuthRequest, res, next));
router.patch('/accesses/:id/exit', (req, res, next) => poolController.markExit(req as AuthRequest, res, next));

// Estadísticas
router.get('/stats', (req, res, next) => poolController.getStats(req as AuthRequest, res, next));

export default router;
