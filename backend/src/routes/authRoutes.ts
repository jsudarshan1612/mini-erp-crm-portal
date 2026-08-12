import { Router } from 'express';
import * as authController from '../controllers/authController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/register', requireAuth, requireRole('ADMIN'), authController.register);
router.get('/me', requireAuth, authController.me);
router.get('/users', requireAuth, requireRole('ADMIN'), authController.listUsers);

export default router;
