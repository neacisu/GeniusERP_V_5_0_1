/**
 * Rate Limiting Middleware
 * 
 * Implementare completă de rate limiting pentru protecția împotriva atacurilor brute force
 * și DDoS conform OWASP ASVS 2.2.3
 * 
 * Folosește Redis pentru stocare distribuită în producție, sau memory store în development.
 */

import rateLimit from 'express-rate-limit';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('rate-limit');

// Verifică dacă Redis este disponibil
const hasRedis = !!process.env['REDIS_URL'];

// Configurare store - Redis în producție, memory în development
let store: any;

if (hasRedis && process.env['NODE_ENV'] === 'production') {
  try {
    // Doar dacă Redis este disponibil, importăm și configurăm
    const RedisStore = require('rate-limit-redis');
    const { createClient } = require('redis');
    
    const redisClient = createClient({
      url: process.env['REDIS_URL'],
      password: process.env['REDIS_PASSWORD']
    });
    
    redisClient.connect().catch((err: Error) => {
      logger.error('Redis connection failed for rate limiting:', err);
      logger.warn('Falling back to memory store for rate limiting');
    });
    
    redisClient.on('error', (err: Error) => {
      logger.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('✓ Redis connected for rate limiting');
    });
    
    store = new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    });
    
    logger.info('✓ Rate limiting using Redis store');
  } catch (error) {
    logger.error('Failed to initialize Redis for rate limiting:', error);
    logger.warn('Falling back to memory store');
    store = undefined; // Will use default memory store
  }
} else {
  if (process.env['NODE_ENV'] === 'production') {
    logger.warn('⚠ Redis not configured - using memory store for rate limiting (not recommended for production)');
  } else {
    logger.info('✓ Rate limiting using memory store (development mode)');
  }
}

/**
 * Rate limiter pentru autentificare (login/register)
 * 5 încercări per 15 minute per IP
 */
export const authRateLimiter = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 5, // 5 requests per window
  message: {
    error: 'Prea multe încercări de autentificare. Vă rugăm încercați din nou în 15 minute.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Prea multe încercări de autentificare',
      message: 'Ați depășit limita de încercări. Vă rugăm încercați din nou în 15 minute.',
      retryAfter: 15 * 60 // seconds
    });
  }
});

/**
 * Rate limiter global pentru API
 * 100 requests per minut per IP
 */
export const apiRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 100, // 100 requests per window
  message: {
    error: 'Prea multe cereri. Vă rugăm încercați din nou mai târziu.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe cereri',
      message: 'Ați depășit limita de cereri permise. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60 // seconds
    });
  }
});

/**
 * Rate limiter pentru operațiuni costisitoare (export, rapoarte, etc.)
 * 10 requests per minut per IP
 */
export const heavyOperationRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 10, // 10 requests per window
  message: {
    error: 'Prea multe cereri pentru operațiuni costisitoare. Vă rugăm încercați din nou mai târziu.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Heavy operation rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe cereri pentru operațiuni costisitoare',
      message: 'Ați depășit limita de cereri pentru această operațiune. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60 // seconds
    });
  }
});

/**
 * Rate limiter moderat pentru operațiuni standard
 * 30 requests per minut per IP
 */
export const moderateRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 30, // 30 requests per window
  message: {
    error: 'Prea multe cereri. Vă rugăm încercați din nou mai târziu.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Moderate rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe cereri',
      message: 'Ați depășit limita de cereri permise. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru crearea de conținut
 * Previne spam-ul de creare (ex: facturi, produse, etc.)
 * 20 requests per minut per IP
 */
export const createResourceRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 20, // 20 requests per window
  message: {
    error: 'Prea multe cereri de creare. Vă rugăm încercați din nou mai târziu.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Nu contează cererile reușite
  handler: (req, res) => {
    logger.warn(`Create resource rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe cereri de creare',
      message: 'Ați depășit limita de creări permise. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60
    });
  }
});

/**
 * ============================================================================
 * ACCOUNTING MODULE RATE LIMITERS
 * ============================================================================
 */

/**
 * Rate limiter pentru creare facturi
 * 20 facturi per minut per utilizator
 */
export const invoiceCreateRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 20,
  message: {
    error: 'Prea multe facturi create. Vă rugăm încercați din nou mai târziu.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Invoice creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Prea multe facturi create',
      message: 'Ați depășit limita de creări de facturi. Pentru bulk operations, folosiți endpoint-ul dedicat.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru operațiuni grele de contabilitate
 * (generare jurnale, reconcilieri, etc.)
 * 5 requests per minut per utilizator
 */
export const accountingHeavyRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 5,
  message: {
    error: 'Prea multe operațiuni grele de contabilitate solicitate.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Accounting heavy operation rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe operațiuni grele',
      message: 'Ați depășit limita pentru operațiuni complexe de contabilitate. Acestea rulează asincron, verificați status-ul job-urilor existente.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru export-uri (Excel, PDF)
 * 3 export-uri per minut per utilizator
 */
export const exportRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 3,
  message: {
    error: 'Prea multe exporturi solicitate.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Export rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe exporturi solicitate',
      message: 'Ați depășit limita de exporturi. Vă rugăm așteptați finalizarea export-urilor curente.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru închideri fiscale (FOARTE RESTRICTIV)
 * 2 închideri per 10 minute per companie
 * Operațiune critică care nu trebuie să fie abuzată
 */
export const fiscalClosureRateLimiter = rateLimit({
  store,
  windowMs: 10 * 60 * 1000, // 10 minute
  max: 2,
  message: {
    error: 'Prea multe închideri fiscale solicitate.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(`Fiscal closure rate limit exceeded for IP: ${req.ip} - CRITICAL`);
    res.status(429).json({
      error: 'Prea multe închideri fiscale',
      message: 'Ați depășit limita de închideri fiscale. Aceasta este o operațiune critică care trebuie executată cu atenție.',
      retryAfter: 10 * 60
    });
  }
});

/**
 * Rate limiter pentru operațiuni de înregistrare plăți
 * 30 plăți per minut per utilizator
 */
export const paymentRecordRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 30,
  message: {
    error: 'Prea multe plăți înregistrate.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Payment record rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Prea multe plăți înregistrate',
      message: 'Ați depășit limita de înregistrări de plăți. Pentru bulk operations, folosiți endpoint-ul dedicat.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru reconcilieri
 * 10 reconcilieri per minut per utilizator
 */
export const reconciliationRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 10,
  message: {
    error: 'Prea multe reconcilieri solicitate.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Reconciliation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Prea multe reconcilieri',
      message: 'Ați depășit limita de reconcilieri. Aceste operațiuni rulează asincron.',
      retryAfter: 60
    });
  }
});

/**
 * Rate limiter pentru citire date accounting (GET requests)
 * Mai permisiv decât crearea de conținut
 * 50 requests per minut per utilizator
 */
export const accountingReadRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 50,
  message: {
    error: 'Prea multe cereri de citire date.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Accounting read rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Prea multe cereri',
      message: 'Ați depășit limita de cereri. Datele sunt cached, reîncercați în câteva secunde.',
      retryAfter: 60
    });
  }
});

logger.info('✓ Rate limiting middleware initialized');

