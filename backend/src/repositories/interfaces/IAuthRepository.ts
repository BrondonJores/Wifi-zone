import { Admin } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<Admin | null>;
  create(data: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<Admin>;
}
