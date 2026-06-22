import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { AuthRepository } from '../repositories/AuthRepository';
import { validateRequest } from '../middlewares/validateRequest';
import { requireAuth, requireAuthOrBootstrap } from '../middlewares/auth.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { adminAuthLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Assemblage des dépendances (Dependency Injection)
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Routes
router.post('/register', requireAuthOrBootstrap, validateRequest(registerSchema), authController.register);
router.post('/login', adminAuthLimiter, validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Routes 2FA
router.post('/2fa/generate', requireAuth, authController.generate2fa);
router.post('/2fa/verify', requireAuth, authController.verify2fa);

export default router;
