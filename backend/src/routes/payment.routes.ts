import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { MonetbilService } from '../services/MonetbilService';
import { RouterService } from '../services/RouterService';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';
import { webhookLimiter, apiLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Assemblage SOLID
const monetbilService = new MonetbilService();
const routerService = new RouterService();
const paymentController = new PaymentController(monetbilService, routerService);

// Schéma de validation pour l'initiation de paiement
const initiatePaymentSchema = z.object({
  body: z.object({
    routerId: z.string().uuid(),
    tariffId: z.string().uuid(),
    phoneNumber: z.string().min(9)
  })
});

// Schéma de validation strict pour le Webhook Monetbil
const monetbilWebhookSchema = z.object({
  body: z.object({
    payment_ref: z.string().min(1),
    status: z.enum(['success', 'failed', 'cancelled', 'pending']),
    amount: z.number().or(z.string().transform(Number)),
    currency: z.string().toUpperCase(),
    transaction_id: z.string().min(1),
  }).passthrough() // Laisse passer les autres champs (ex: phone, sign) mais garantit l'existence de ces 5 clés
});

// Routes
router.post('/initiate', apiLimiter, validateRequest(initiatePaymentSchema), paymentController.initiate);

// La route webhook ne doit PAS utiliser `validateRequest` car la structure vient de Monetbil
// La vérification de la signature dans le contrôleur s'assure de l'intégrité de la requête,
// mais Zod s'assure que le format (amounts, ids) est propre avant même de chercher en BDD.
router.post('/webhook/monetbil', webhookLimiter, validateRequest(monetbilWebhookSchema), paymentController.webhook);
router.get('/status/:ref', apiLimiter, paymentController.checkStatus);

export default router;
