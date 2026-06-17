import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// Format de log personnalisé
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Création du Logger (Minutieux sur la sécurité / audit)
export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Affiche dans la console (coloré)
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    // Enregistre les erreurs dans un fichier séparé pour l'audit de sécurité
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Enregistre toutes les informations pour la traçabilité
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
