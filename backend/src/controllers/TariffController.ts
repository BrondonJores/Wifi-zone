import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class TariffController {
  getAll = async (req: Request, res: Response) => {
    try {
      const tariffs = await prisma.tariff.findMany({
        include: { router: true, _count: { select: { vouchers: true } } }
      });
      res.json({ success: true, tariffs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, price, duration, profileName, routerId } = req.body;
      const tariff = await prisma.tariff.create({
        data: { name, price, duration, profileName, routerId }
      });
      res.status(201).json({ success: true, tariff });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, price, duration, profileName } = req.body;
      const tariff = await prisma.tariff.update({
        where: { id },
        data: { name, price: Number(price), duration: Number(duration), profileName }
      });
      res.json({ success: true, tariff });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Vérifier si des vouchers actifs sont liés à ce forfait
      const activeVouchers = await prisma.voucher.count({
        where: { tariffId: id, status: 'ACTIVE' }
      });
      if (activeVouchers > 0) {
        return res.status(409).json({
          success: false,
          error: `Impossible de supprimer : ${activeVouchers} ticket(s) actif(s) sont encore liés à ce forfait.`
        });
      }
      await prisma.tariff.delete({ where: { id } });
      res.json({ success: true, message: 'Forfait supprimé avec succès' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
