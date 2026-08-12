import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const readRoles = ['ADMIN', 'SALES', 'ACCOUNTS'] as const;
const writeRoles = ['ADMIN', 'SALES'] as const;

router.get('/', requireAuth, requireRole(...readRoles), customerController.list);
router.get('/:id', requireAuth, requireRole(...readRoles), customerController.getById);
router.post('/', requireAuth, requireRole(...writeRoles), customerController.create);
router.put('/:id', requireAuth, requireRole(...writeRoles), customerController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'SALES'), customerController.remove);
router.post('/:id/followups', requireAuth, requireRole(...writeRoles), customerController.addFollowUp);
router.get('/:id/followups', requireAuth, requireRole(...readRoles), customerController.getFollowUps);

export default router;
