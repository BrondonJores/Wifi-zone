import { Router } from 'express';
import { TariffController } from '../controllers/TariffController';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { adminActionLimiter } from '../middlewares/rateLimiter';

const router = Router();
const tariffController = new TariffController();

router.use(requireAuth);

router.get('/', requirePermission('tariff:read'), tariffController.getAll);
router.post('/', adminActionLimiter, requirePermission('tariff:create'), tariffController.create);
router.put('/:id', adminActionLimiter, requirePermission('tariff:update'), tariffController.update);
router.delete('/:id', adminActionLimiter, requirePermission('tariff:delete'), tariffController.delete);

export default router;
