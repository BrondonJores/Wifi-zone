import rateLimit from 'express-rate-limit';

// Limiter stricte pour la tentative de connexion Admin (Brute force protection)
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite à 5 requêtes par windowMs
  message: { success: false, error: 'Trop de tentatives de connexion, veuillez réessayer après 15 minutes.' },
  standardHeaders: true, // Renvoie les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Limiter moyen pour les actions de mutation admin (POST/PUT/DELETE)
export const adminActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limite à 60 requêtes par minute
  message: { success: false, error: 'Trop de requêtes. Veuillez ralentir.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter pour les Webhooks (Modéré, avec fallback si whitelist contournée)
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limite assez haute pour Monetbil, mais protège contre un flood pur
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter public général
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
