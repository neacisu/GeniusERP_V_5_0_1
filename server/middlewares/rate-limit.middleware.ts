/**
 * Rate Limiting Middleware
 * 
 * Implementare completă de rate limiting pentru protecția împotriva atacurilor brute force
 * și DDoS conform OWASP ASVS 2.2.3
 * 
 * Folosește Redis pentru stocare distribuită în producție, sau memory store în development.
 */

import rateLimit from 'express-rate-limit';
import type { Options } from 'express-rate-limit';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('rate-limit');

// Verifică dacă Redis este disponibil
const hasRedis = !!process.env.REDIS_URL;

// Configurare store - Redis în producție, memory în development
let store: any;

if (hasRedis && process.env.NODE_ENV === 'production') {
  try {
    // Doar dacă Redis este disponibil, importăm și configurăm
    const RedisStore = require('rate-limit-redis');
    const { createClient } = require('redis');
    
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD
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
  if (process.env.NODE_ENV === 'production') {
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
} as Options);

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
} as Options);

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
} as Options);

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
} as Options);

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
} as Options);

logger.info('✓ Rate limiting middleware initialized');

