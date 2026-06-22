import { Admin } from '@prisma/client';

export interface IAuthService {
  register(data: any): Promise<{ admin: Omit<Admin, 'password'>; token: string }>;
  login(data: any): Promise<{ admin: Omit<Admin, 'password'>; token: string }>;
  getAdminById(id: string): Promise<Admin | null>;
}
