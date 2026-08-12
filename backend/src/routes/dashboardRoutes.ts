import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole('ADMIN', 'SALES', 'ACCOUNTS'),
  dashboardController.getStats
);

export default router;
