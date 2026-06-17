import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { MonetbilService } from '../services/MonetbilService';
import { RouterService } from '../services/RouterService';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validateRequest';

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

// Routes
router.post('/initiate', validateRequest(initiatePaymentSchema), paymentController.initiate);

// La route webhook ne doit PAS utiliser `validateRequest` car la structure vient de Monetbil
// La vérification de la signature dans le contrôleur s'assure de l'intégrité de la requête
router.post('/webhook/monetbil', paymentController.webhook);

export default router;
