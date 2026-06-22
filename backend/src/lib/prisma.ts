import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL || 'postgresql://saas_user:MotDePasseTresForte123!@127.0.0.1:5432/wifi_ticket_saas';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient().$extends({
  query: {
    webhookAuditLog: {
      async update({ model, operation, args, query }) {
        throw new Error('❌ Immutable Log Violation: Updates are strictly forbidden on WebhookAuditLog');
      },
      async updateMany({ model, operation, args, query }) {
        throw new Error('❌ Immutable Log Violation: Updates are strictly forbidden on WebhookAuditLog');
      },
      async delete({ model, operation, args, query }) {
        throw new Error('❌ Immutable Log Violation: Deletes are strictly forbidden on WebhookAuditLog');
      },
      async deleteMany({ model, operation, args, query }) {
        throw new Error('❌ Immutable Log Violation: Deletes are strictly forbidden on WebhookAuditLog');
      }
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as any;
}
