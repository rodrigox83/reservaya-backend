import { Router } from 'express';
import * as authController from '../controllers/auth.js';
import { authenticate, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/register-owner', authController.registerOwner);
router.get('/owner/:departmentCode', authController.getOwner);
router.get('/me', authenticate, (req, res, next) => authController.me(req as AuthRequest, res, next));

export default router;
