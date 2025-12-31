import { Router } from 'express';
import * as grillsController from '../controllers/grills.js';

const router = Router();

router.get('/', grillsController.getAll);
router.get('/:id', grillsController.getById);
router.get('/:id/availability', grillsController.getAvailability);

export default router;
