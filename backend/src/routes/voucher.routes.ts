import { Router } from 'express';
import { VoucherController } from '../controllers/VoucherController';

const router = Router();
const voucherController = new VoucherController();

router.get('/', voucherController.getAll);
router.get('/status/:status', voucherController.getByStatus);
router.post('/batch', voucherController.generateBatch);
router.delete('/:id', voucherController.delete);

export default router;
