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
      // KILL SWITCH CHECK
      const maintenanceSetting = await prisma.systemSetting.findUnique({
        where: { key: 'PAYMENTS_INITIATE_DISABLED' }
      });
      if (maintenanceSetting?.value === 'true') {
        return res.status(503).json({
          success: false,
          error: 'Les paiements sont temporairement suspendus pour maintenance.'
        });
      }

      const { routerId, tariffId, phoneNumber, returnUrl } = req.body;

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
      
      // On attache la référence au returnUrl pour que la page de login sache ce qu'elle attend
      const finalReturnUrl = returnUrl ? `${returnUrl}?ref=${paymentRef}` : process.env.BACKEND_URL || '';

      // Demande l'URL de paiement à Monetbil
      const paymentUrl = await this.paymentService.initiatePayment(
        tariff.price,
        phoneNumber,
        paymentRef,
        notifyUrl,
        finalReturnUrl
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
    // Audit payload (avant même le parsing Zod complet pour avoir la trace pure)
    const rawPayload = JSON.stringify(req.body);
    const signature = req.headers['monetbil-signature'] as string || '';
    
    // KILL SWITCH CHECK
    const maintenanceSetting = await prisma.systemSetting.findUnique({
      where: { key: 'WEBHOOK_DISABLED' }
    });
    if (maintenanceSetting?.value === 'true') {
      // On répond 200 pour que Monetbil ne retry pas en boucle si on est en coupure réseau délibérée
      // Ou 503 si on veut qu'ils retry. On choisit 503 pour ne pas perdre la transaction plus tard.
      return res.status(503).json({ error: 'Webhook processing is temporarily disabled' });
    }

    let signatureValid = false;
    let errorMessage: string | null = null;

    try {
      const payload = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

      // 1. Verify HMAC Signature
      signatureValid = this.paymentService.verifyWebhookSignature(payload, signature);
      
      if (!signatureValid) {
        errorMessage = 'Invalid signature';
        logger.warn(`Signature Monetbil invalide ! Tentative de fraude de l'IP: ${ipAddress}`);
        // Log Audit avant de rejeter
        await prisma.webhookAuditLog.create({
          data: {
            paymentRef: payload.payment_ref || null,
            status: payload.status || 'UNKNOWN',
            amount: payload.amount ? Number(payload.amount) : null,
            ipAddress,
            rawPayload: JSON.stringify(payload),
            signatureValid: false,
            errorMessage
          }
        });
        return res.status(401).send('Invalid signature');
      }

      // 2. Validate Zod Payload a déjà été fait par le middleware router.post(..., validateRequest(...)) !
      const { payment_ref, status, amount, currency, transaction_id } = payload;

      // 10. Log Audit (Valid Signature)
      await prisma.webhookAuditLog.create({
        data: {
          paymentRef: payment_ref,
          status,
          amount: Number(amount),
          ipAddress,
          rawPayload: JSON.stringify(payload),
          signatureValid: true
        }
      });

      if (status !== 'success') {
        // Mettre à jour en FAILED/CANCELLED
        await prisma.transaction.updateMany({
          where: { paymentRef: payment_ref, status: 'PENDING' },
          data: { status: status.toUpperCase() }
        });
        return res.status(200).send('OK - Status noted');
      }

      // 3. & 4. & 5. & 6. DB Lock Transaction + Idempotency + Status Check
      const result = await prisma.$transaction(async (tx) => {
        const dbTx = await tx.transaction.findUnique({
          where: { paymentRef: payment_ref },
          include: { router: true }
        });

        if (!dbTx) throw new Error('Transaction not found');

        // Check Anti-Replay / Idempotency
        if (dbTx.status === 'SUCCESS' || dbTx.status === 'PROCESSING') {
          return { handled: true, reason: 'Already processed or processing' };
        }
        
        // 4. Check monetbilTxId UNIQUE
        const existingExternalId = await tx.transaction.findFirst({
          where: { monetbilTxId: transaction_id }
        });
        if (existingExternalId && existingExternalId.id !== dbTx.id) {
           throw new Error('Duplicate monetbilTxId detected');
        }

        // 7. Verify EXACT Amount Match
        if (Number(amount) !== dbTx.amount) {
          throw new Error(`Amount mismatch. Expected ${dbTx.amount}, got ${amount}`);
        }
        if (currency !== 'XAF') {
          throw new Error(`Invalid currency. Expected XAF, got ${currency}`);
        }

        // 6. Set PROCESSING (Lock logic)
        const lockedTx = await tx.transaction.update({
          where: { id: dbTx.id },
          data: { 
            status: 'PROCESSING',
            monetbilTxId: transaction_id 
          }
        });

        return { handled: false, lockedTx };
      });

      if (result.handled) {
        return res.status(200).send('OK');
      }

      // --- EXÉCUTION HORS TRANSACTION DB (Pour ne pas bloquer DB pendant MikroTik API) ---
      // On recharge la transaction avec la relation router (pour obtenir IP, port, etc.)
      const lockedTx = await prisma.transaction.findUnique({
        where: { id: result.lockedTx!.id },
        include: { router: true }
      });

      // 8. Generate Voucher
      if (!lockedTx) {
        throw new Error('Transaction lost after lock - DB inconsistency');
      }

      const tariff = await prisma.tariff.findFirst({
        where: { price: lockedTx.amount, routerId: lockedTx.routerId }
      });

      if (!tariff) {
        await prisma.transaction.update({ where: { id: lockedTx.id }, data: { status: 'FAILED' } });
        throw new Error('Tariff not found for this amount');
      }

      const voucherCode = generateVoucherCode(6);

      // Injection dans le MikroTik
      await this.routerService.createVoucher(lockedTx.router, tariff.profileName, voucherCode);

      // 9. Set SUCCESS
      await prisma.$transaction(async (tx) => {
        await tx.voucher.create({
          data: {
            tariffId: tariff.id,
            transactionId: lockedTx.id,
            code: voucherCode
          }
        });
        await tx.transaction.update({
          where: { id: lockedTx.id },
          data: { status: 'SUCCESS' }
        });
      });

      logger.info(`✅ Paiement sécurisé validé et ticket ${voucherCode} généré pour ${lockedTx.phoneNumber}`);
      return res.status(200).send('OK');

    } catch (error: any) {
      logger.error(`Erreur Webhook: ${error.message}`);
      
      // Auto-recovery pour un crash inattendu pendant PROCESSING
      if (errorMessage === null && signatureValid) {
         try {
           const { payment_ref } = req.body;
           if (payment_ref) {
              await prisma.transaction.updateMany({
                 where: { paymentRef: payment_ref, status: 'PROCESSING' },
                 data: { status: 'PENDING' } 
              });
           }
         } catch (e) {}
      }
      
      res.status(500).send('Webhook processing failed');
    }
  };

  /**
   * Appelé par le portail captif pour vérifier le statut du paiement
   * et récupérer le code du voucher
   */
  checkStatus = async (req: Request, res: Response) => {
    try {
      const { ref } = req.params;
      
      const transaction = await prisma.transaction.findUnique({
        where: { paymentRef: ref },
        include: { voucher: true }
      });

      if (!transaction) {
        return res.status(404).json({ success: false, error: 'Transaction introuvable' });
      }

      if (transaction.status === 'SUCCESS' && transaction.voucher) {
        return res.json({ 
          success: true, 
          status: 'SUCCESS', 
          voucherCode: transaction.voucher.code 
        });
      }

      return res.json({ success: true, status: transaction.status });
    } catch (error: any) {
      logger.error(`Erreur Check Status: ${error.message}`);
      res.status(500).json({ success: false, error: 'Check status failed' });
    }
  };
}
