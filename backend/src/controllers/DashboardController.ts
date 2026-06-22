import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class DashboardController {
  getStats = async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 1. Revenus d'aujourd'hui (Transactions SUCCESS)
      const todayTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: today },
          status: 'SUCCESS'
        }
      });
      const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.amount, 0);

      // 2. Tickets actifs
      const activeTicketsCount = await prisma.voucher.count({
        where: { status: 'ACTIVE' }
      });

      // 3. Routeurs actifs
      const routersCount = await prisma.router.count();

      // 4. Derniers tickets (4 derniers)
      const recentTickets = await prisma.voucher.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { tariff: true }
      });

      // 5. Évolution des ventes (7 derniers jours)
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: 'SUCCESS'
        }
      });

      // Grouper par jour (Lun, Mar, Mer...)
      const salesMap = new Map<string, number>();
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        salesMap.set(days[d.getDay()], 0);
      }

      recentTransactions.forEach(t => {
        const dayStr = days[t.createdAt.getDay()];
        if (salesMap.has(dayStr)) {
          salesMap.set(dayStr, salesMap.get(dayStr)! + t.amount);
        }
      });

      const salesData = Array.from(salesMap.entries()).map(([name, revenus]) => ({
        name,
        revenus
      }));

      res.json({
        success: true,
        stats: {
          todayRevenue,
          activeTicketsCount,
          connectedUsers: activeTicketsCount,
          routersCount,
          salesData,
          recentTickets
        }
      });
    } catch (error: any) {
      console.error("Dashboard error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const logs = await prisma.webhookAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200
      });
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
