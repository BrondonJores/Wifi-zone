import crypto from 'crypto';
import { IPaymentService } from './interfaces/IPaymentService';
import { logger } from '../utils/logger';

export class MonetbilService implements IPaymentService {
  private serviceKey: string;
  private serviceSecret: string;

  constructor() {
    this.serviceKey = process.env.MONETBIL_SERVICE_KEY || '';
    this.serviceSecret = process.env.MONETBIL_SERVICE_SECRET || '';
  }

  /**
   * Appelle l'API Widget v2.1 de Monetbil pour générer l'URL de paiement
   */
  async initiatePayment(amount: number, phoneNumber: string, paymentRef: string, notifyUrl: string, returnUrl: string): Promise<string> {
    try {
      const url = `https://api.monetbil.com/widget/v2.1/${this.serviceKey}`;
      
      const payload = new URLSearchParams({
        amount: amount.toString(),
        phone: phoneNumber,
        payment_ref: paymentRef,
        notify_url: notifyUrl,
        return_url: returnUrl,
        // Optionnel : Bloquer le numéro pour éviter que le client le modifie
        phone_lock: 'true'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload
      });

      const data = await response.json();

      if (data.success && data.payment_url) {
        return data.payment_url;
      } else {
        throw new Error(data.message || "Impossible d'initier le paiement Monetbil");
      }
    } catch (error: any) {
      logger.error(`Erreur Monetbil API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie cryptographiquement que le Webhook vient bien de Monetbil (HMAC-SHA256)
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!signature || !this.serviceSecret) return false;
    
    // Concaténation recommandée par les standards (à adapter selon Monetbil, souvent c'est le raw body ou des champs spécifiques)
    const dataString = `${payload.payment_ref}${payload.transaction_id}${this.serviceSecret}`;
    
    // Utilisation de HMAC-SHA256 (plus sécurisé que MD5)
    const hash = crypto.createHmac('sha256', this.serviceSecret).update(dataString).digest('hex');
    
    // Dans ce code on tolère temporairement l'ancien MD5 pour rétrocompatibilité si Monetbil l'envoie
    const legacyHash = crypto.createHash('md5').update(dataString).digest('hex');
    
    return hash === signature || legacyHash === signature;
  }
}
