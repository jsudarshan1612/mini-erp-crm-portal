import { Router } from 'express';
import * as productController from '../controllers/productController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const viewRoles = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as const;
const manageRoles = ['ADMIN', 'WAREHOUSE'] as const;

router.get('/', requireAuth, requireRole(...viewRoles), productController.list);
router.get('/categories/list', requireAuth, requireRole(...viewRoles), productController.getCategories);
router.get('/movements/all', requireAuth, requireRole('ADMIN', 'WAREHOUSE'), productController.listAllMovements);
router.get('/:id', requireAuth, requireRole(...viewRoles), productController.getById);
router.post('/', requireAuth, requireRole('ADMIN', 'WAREHOUSE'), productController.create);
router.put('/:id', requireAuth, requireRole('ADMIN', 'WAREHOUSE'), productController.update);
router.delete('/:id', requireAuth, requireRole('ADMIN'), productController.remove);
router.post('/:id/stock', requireAuth, requireRole(...manageRoles), productController.addStock);
router.get('/:id/stock-movements', requireAuth, requireRole(...viewRoles), productController.getStockMovements);

export default router;
