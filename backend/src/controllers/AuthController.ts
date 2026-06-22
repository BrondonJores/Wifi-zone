import { Request, Response } from 'express';
import { IAuthService } from '../services/interfaces/IAuthService';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  register = async (req: Request, res: Response) => {
    try {
      const { admin, token } = await this.authService.register(req.body);
      
      // Sécurité : Stockage du token dans un cookie HttpOnly (Inaccessible via JavaScript/XSS)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 jour
      });

      logger.info(`Nouvel admin inscrit : ${admin.email}`);
      res.status(201).json({ success: true, admin });
    } catch (error: any) {
      logger.error(`Erreur Register: ${error.message}`);
      res.status(400).json({ success: false, error: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { admin, token } = await this.authService.login(req.body);
      
      // Sécurité : Stockage du token HttpOnly
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      logger.info(`Admin connecté : ${admin.email}`);
      res.status(200).json({ success: true, admin });
    } catch (error: any) {
      logger.warn(`Tentative de connexion échouée pour : ${req.body?.email}`);
      res.status(401).json({ success: false, error: error.message });
    }
  };

  logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Déconnecté avec succès' });
  };

  generate2fa = async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).admin?.id;
      if (!adminId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      // Import otplib & qrcode dynamically since they might not be installed yet during TS compilation if user hasn't run npm install
      const otplib = require('otplib');
      const QRCode = require('qrcode');

      const admin = await this.authService.getAdminById(adminId);
      if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });

      const secret = otplib.authenticator.generateSecret();
      const otpauthUrl = otplib.authenticator.keyuri(admin.email, 'TicketWiFi_Admin', secret);
      const qrCodeImage = await QRCode.toDataURL(otpauthUrl);

      // Save the secret temporarily or permanently but disabled
      const { prisma } = await import('../lib/prisma');
      await prisma.admin.update({
        where: { id: adminId },
        data: { twoFactorSecret: secret, isTwoFactorEnabled: false }
      });

      res.json({ success: true, qrCodeImage, secret });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  verify2fa = async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).admin?.id;
      const { token } = req.body;
      if (!adminId || !token) return res.status(400).json({ success: false, error: 'Missing token' });

      const otplib = require('otplib');
      const { prisma } = await import('../lib/prisma');
      const admin = await prisma.admin.findUnique({ where: { id: adminId } });

      if (!admin || !admin.twoFactorSecret) {
        return res.status(400).json({ success: false, error: '2FA not initialized' });
      }

      const isValid = otplib.authenticator.check(token, admin.twoFactorSecret);
      if (!isValid) return res.status(400).json({ success: false, error: 'Invalid 2FA token' });

      // Generate recovery codes
      const crypto = require('crypto');
      const recoveryCodes = Array.from({ length: 6 }, () => crypto.randomBytes(4).toString('hex'));

      await prisma.admin.update({
        where: { id: adminId },
        data: { isTwoFactorEnabled: true, recoveryCodes }
      });

      res.json({ success: true, message: '2FA Enabled', recoveryCodes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
