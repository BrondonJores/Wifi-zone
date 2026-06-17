import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { IPaymentService } from '../services/interfaces/IPaymentService';
import { IRouterService } from '../services/interfaces/IRouterService';
import { generateVoucherCode } from '../utils/voucherGenerator';
import { logger } from '../utils/logger';

export class PaymentController {
  private paymentService: IPaymentService;
  private routerService: IRouterService;

  constructor(paymentService: IPaymentService, routerService: IRouterService) {
    this.paymentService = paymentService;
    this.routerService = routerService;
  }

  /**
   * Appelé par le portail captif pour initier un achat
   */
  initiate = async (req: Request, res: Response) => {
    try {
      const { routerId, tariffId, phoneNumber } = req.body;

      // Vérifier le tarif et le routeur
      const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
      const router = await prisma.router.findUnique({ where: { id: routerId } });

      if (!tariff || !router) {
        return res.status(404).json({ success: false, error: 'Tariff or Router not found' });
      }

      const paymentRef = uuidv4(); // Référence unique pour cette transaction

      // Enregistre la transaction en PENDING
      await prisma.transaction.create({
        data: {
          paymentRef,
          routerId: router.id,
          amount: tariff.price,
          phoneNumber,
          status: 'PENDING'
        }
      });

      // Url de notre webhook où Monetbil va répondre
      const notifyUrl = `${process.env.BACKEND_URL}/api/payments/webhook/monetbil`;

      // Demande l'URL de paiement à Monetbil
      const paymentUrl = await this.paymentService.initiatePayment(
        tariff.price,
        phoneNumber,
        paymentRef,
        notifyUrl
      );

      return res.status(200).json({ success: true, paymentUrl });
    } catch (error: any) {
      logger.error(`Erreur Initiate Payment: ${error.message}`);
      res.status(500).json({ success: false, error: 'Payment initialization failed' });
    }
  };

  /**
   * Appelé EN ARRIÈRE-PLAN par les serveurs de Monetbil (Webhook)
   */
  webhook = async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const signature = req.headers['x-monetbil-signature'] as string;

      // 1. Sécurité : Vérifier la signature cryptographique
      if (!this.paymentService.verifyWebhookSignature(payload, signature)) {
        logger.warn(`Signature Monetbil invalide ! Tentative de fraude potentielle.`);
        return res.status(401).send('Invalid signature');
      }

      const paymentRef = payload.payment_ref;
      const status = payload.status; // 'success', 'cancelled', 'failed'

      // 2. Trouver la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { paymentRef },
        include: { router: true }
      });

      if (!transaction) return res.status(404).send('Transaction not found');

      // 3. Mettre à jour le statut
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: status.toUpperCase() }
      });

      // 4. Si paiement réussi, créer le ticket dans le routeur !
      if (status === 'success') {
        const tariff = await prisma.tariff.findFirst({
          where: { price: transaction.amount, routerId: transaction.routerId }
        });

        if (tariff) {
          const voucherCode = generateVoucherCode(6); // Code PIN à 6 chiffres

          // Injection dans le MikroTik via notre RouterService
          await this.routerService.createVoucher(transaction.router, tariff.profileName, voucherCode);

          // Enregistrement du voucher généré en base de données
          await prisma.voucher.create({
            data: {
              tariffId: tariff.id,
              transactionId: transaction.id,
              code: voucherCode
            }
          });

          logger.info(`✅ Paiement validé et ticket ${voucherCode} généré pour ${transaction.phoneNumber}`);
        }
      }

      // Monetbil attend juste un 200 OK pour arrêter de relancer
      return res.status(200).send('OK');
    } catch (error: any) {
      logger.error(`Erreur Webhook: ${error.message}`);
      res.status(500).send('Webhook processing failed');
    }
  };
}
