export interface IPaymentService {
  initiatePayment(amount: number, phoneNumber: string, paymentRef: string, notifyUrl: string, returnUrl: string): Promise<string>;
  verifyWebhookSignature(payload: any, signature: string): boolean;
}
