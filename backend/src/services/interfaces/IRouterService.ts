import { Router } from '@prisma/client';

export interface IRouterService {
  connect(router: Router): Promise<any>; // Renvoie l'instance de connexion RouterOS
  getProfiles(router: Router): Promise<any[]>;
  createVoucher(router: Router, profileName: string, voucherCode: string): Promise<boolean>;
  deleteVoucher(router: Router, voucherCode: string): Promise<boolean>;
}
