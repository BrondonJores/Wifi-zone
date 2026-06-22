import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateVoucherCode } from '../utils/voucherGenerator';
import { logger } from '../utils/logger';

export class VoucherController {
  getAll = async (req: Request, res: Response) => {
    try {
      const vouchers = await prisma.voucher.findMany({
        include: {
          tariff: { include: { router: true } },
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      res.json({ success: true, vouchers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  generateBatch = async (req: Request, res: Response) => {
    try {
      const { tariffId, quantity } = req.body;
      const count = Math.min(parseInt(quantity) || 1, 200); // Max 200 à la fois

      // Vérifier que le tarif existe
      const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
      if (!tariff) return res.status(404).json({ success: false, error: 'Forfait introuvable' });

      const vouchersData = [];
      for (let i = 0; i < count; i++) {
        vouchersData.push({
          tariffId,
          code: generateVoucherCode(6),
          status: 'UNUSED',
        });
      }

      const result = await prisma.voucher.createMany({ data: vouchersData });

      logger.info(`✅ ${count} tickets générés pour le forfait: ${tariff.name}`);
      res.status(201).json({
        success: true,
        message: `${result.count} tickets générés avec succès pour "${tariff.name}"`,
        count: result.count,
      });
    } catch (error: any) {
      logger.error(`Erreur génération tickets: ${error.message}`);
      res.status(400).json({ success: false, error: error.message });
    }
  };

  getByStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.params;
      const vouchers = await prisma.voucher.findMany({
        where: { status: status.toUpperCase() as any },
        include: { tariff: true, transaction: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, vouchers, count: vouchers.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.voucher.delete({ where: { id } });
      res.json({ success: true, message: 'Ticket supprimé' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
