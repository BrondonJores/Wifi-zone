import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extension de l'interface Request d'Express pour injecter l'ID de l'admin et ses permissions
declare global {
  namespace Express {
    interface Request {
      admin?: { 
        id: string;
        permissions: string[];
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Non autorisé: Token manquant. Veuillez vous connecter.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as { id: string };

    // Fetch the admin from DB to guarantee instant revocation of permissions
    const { prisma } = await import('../lib/prisma');
    const adminUser = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, permissions: true }
    });

    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Compte administrateur introuvable ou supprimé.' });
    }

    req.admin = { 
      id: adminUser.id,
      permissions: adminUser.permissions 
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Non autorisé: Token invalide ou expiré.' });
  }
};

/**
 * Middleware RBAC: Vérifie si l'admin possède une permission spécifique (ou s'il a 'all')
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Non autorisé' });
    }

    // Le SUPER_ADMIN peut avoir la permission "*" ou "all" qui lui donne tous les droits
    const hasPermission = req.admin.permissions.includes(requiredPermission) || 
                          req.admin.permissions.includes('*');

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        error: `Accès refusé. Permission requise : ${requiredPermission}` 
      });
    }

    next();
  };
};

export const requireAuthOrBootstrap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if any admin exists (Bootstrap mode)
    const { prisma } = await import('../lib/prisma');
    const adminCount = await prisma.admin.count();
    
    if (adminCount === 0) {
      // Base vide, on autorise la création du premier admin
      return next();
    }
  } catch (err) {
    console.error(err);
  }

  // S'il y a déjà un admin, on bascule sur la vérification JWT classique
  return requireAuth(req, res, next);
};
