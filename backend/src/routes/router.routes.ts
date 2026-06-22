import { Router } from 'express';
import { RouterController } from '../controllers/RouterController';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { adminActionLimiter } from '../middlewares/rateLimiter';

const router = Router();
const routerController = new RouterController();

router.use(requireAuth);

router.get('/', requirePermission('router:read'), routerController.getAll);
router.post('/', adminActionLimiter, requirePermission('router:create'), routerController.create);
router.put('/:id', adminActionLimiter, requirePermission('router:update'), routerController.update);
router.delete('/:id', adminActionLimiter, requirePermission('router:delete'), routerController.delete);

export default router;
