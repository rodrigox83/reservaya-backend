import { Router } from 'express';
import * as reservationsController from '../controllers/reservations.js';
import { authenticate, requireStaffRole, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', reservationsController.getAll);
router.get('/user/:userId', (req, res, next) => reservationsController.getByUser(req as AuthRequest, res, next));
router.get('/grill/:grillId', reservationsController.getByGrill);
router.post('/', (req, res, next) => reservationsController.create(req as AuthRequest, res, next));
router.patch('/:id', (req, res, next) => reservationsController.update(req as AuthRequest, res, next));
router.delete('/:id', (req, res, next) => reservationsController.cancel(req as AuthRequest, res, next));

// Solo ADMIN de staff puede aprobar o rechazar reservaciones
router.patch('/:id/approve', requireStaffRole('ADMIN') as any, reservationsController.approve);
router.patch('/:id/reject', requireStaffRole('ADMIN') as any, reservationsController.reject);

export default router;
