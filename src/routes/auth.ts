import { Router } from 'express';
import * as authController from '../controllers/auth.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';

const router = Router();

// Owner/resident auth
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/register-owner', authController.registerOwner);
router.get('/owner/:departmentCode', authController.getOwner);
router.get('/me', authenticate, (req, res, next) => authController.me(req as AuthRequest, res, next));

// Staff auth (admin/receptionist)
router.post('/staff/login', authController.staffLogin);
router.get('/staff/me', authenticate, (req, res, next) => authController.staffMe(req as AuthRequest, res, next));

export default router;
