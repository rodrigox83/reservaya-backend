import { Router } from 'express';
import * as guestsController from '../controllers/guests.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/check', guestsController.checkGuest);
router.post('/register', guestsController.registerGuest);
router.get('/:documentType/:documentNumber', guestsController.getGuestByDocument);

export default router;
