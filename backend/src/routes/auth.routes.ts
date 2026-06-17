import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { AuthRepository } from '../repositories/AuthRepository';
import { validateRequest } from '../middlewares/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// Assemblage des dépendances (Dependency Injection)
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

// Routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);

export default router;
