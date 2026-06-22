import { Admin, Prisma } from '@prisma/client';

export interface IAuthRepository {
  findByEmail(email: string): Promise<Admin | null>;
  create(data: Prisma.AdminCreateInput): Promise<Admin>;
}
