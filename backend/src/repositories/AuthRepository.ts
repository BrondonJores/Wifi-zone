import { Admin, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { IAuthRepository } from './interfaces/IAuthRepository';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    return prisma.admin.findUnique({ where: { email } });
  }

  async create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return prisma.admin.create({ data });
  }
}
