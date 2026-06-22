import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const router = Router();
const transactionController = new TransactionController();

// Remarque: payment.routes.ts gère déjà /api/payments pour les webhooks
// Ici on gère l'historique global pour le Dashboard
router.get('/', transactionController.getAll);

export default router;
