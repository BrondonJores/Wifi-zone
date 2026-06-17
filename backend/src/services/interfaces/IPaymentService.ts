export interface IPaymentService {
  initiatePayment(amount: number, phoneNumber: string, paymentRef: string, notifyUrl: string): Promise<string>;
  verifyWebhookSignature(payload: any, signature: string): boolean;
}
