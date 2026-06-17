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

  logout = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out' });
  };
}
