import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class RouterController {
  // Get all routers for the logged-in admin
  getAll = async (req: Request, res: Response) => {
    try {
      // Pour l'instant on bypass l'auth middleware stricte et on prend tous les routeurs
      // En prod, req.adminId devrait être utilisé
      const routers = await prisma.router.findMany({
        include: { _count: { select: { transactions: true } } }
      });
      res.json({ success: true, routers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { name, ipAddress, apiPort, apiUser, apiPassword } = req.body;
      const adminId = req.admin?.id;
      
      if (!adminId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Admin ID missing' });
      }

      const router = await prisma.router.create({
        data: {
          name,
          ipAddress,
          apiPort: apiPort || 8728,
          apiUser,
          apiPassword: apiPassword || '',
          adminId // Dynamically use the logged-in admin's ID
        }
      });
      res.status(201).json({ success: true, router });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.router.delete({ where: { id } });
      res.json({ success: true, message: 'Routeur supprimé avec succès' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, ipAddress, apiPort, apiUser, apiPassword } = req.body;
      const data: any = { name, ipAddress, apiUser };
      if (apiPort) data.apiPort = Number(apiPort);
      if (apiPassword) data.apiPassword = apiPassword; // Only update password if provided
      const router = await prisma.router.update({ where: { id }, data });
      res.json({ success: true, router });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
