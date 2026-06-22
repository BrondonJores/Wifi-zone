import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class TransactionController {
  getAll = async (req: Request, res: Response) => {
    try {
      const transactions = await prisma.transaction.findMany({
        include: { router: true, voucher: { include: { tariff: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
