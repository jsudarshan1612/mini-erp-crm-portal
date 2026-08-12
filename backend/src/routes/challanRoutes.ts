import { Router } from 'express';
import * as challanController from '../controllers/challanController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const viewRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const;
const manageRoles = ['ADMIN', 'SALES'] as const;

router.get('/', requireAuth, requireRole(...viewRoles), challanController.list);
router.get('/:id', requireAuth, requireRole(...viewRoles), challanController.getById);
router.post('/', requireAuth, requireRole(...manageRoles), challanController.create);
router.put('/:id', requireAuth, requireRole(...manageRoles), challanController.update);
router.post('/:id/confirm', requireAuth, requireRole(...manageRoles), challanController.confirm);
router.post('/:id/cancel', requireAuth, requireRole(...manageRoles), challanController.cancel);

export default router;
