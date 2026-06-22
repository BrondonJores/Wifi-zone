import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.use(requireAuth);

router.get('/dashboard', requirePermission('stats:read'), dashboardController.getStats);
router.get('/audit-logs', requirePermission('logs:view'), dashboardController.getAuditLogs);

export default router;
