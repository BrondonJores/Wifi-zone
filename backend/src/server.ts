import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// SECURITY MIDDLEWARES
// ==========================================

// 1. Helmet: Secure HTTP headers
app.use(helmet());

// 2. CORS: Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default port
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Allow cookies (for JWT HttpOnly)
}));

// 3. Rate Limiting: Prevent Brute-Force & DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// 4. Body Parser (Limit payload size to avoid DoS)
app.use(express.json({ limit: '10kb' }));

// ==========================================
// ROUTES
// ==========================================

import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'SaaS Backend is running securely.' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ==========================================
// SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`[Server]:  Secure Express API running on http://localhost:${PORT}`);
});
