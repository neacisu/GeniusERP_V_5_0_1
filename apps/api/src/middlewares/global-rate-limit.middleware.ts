/**
 * Global Rate Limiting Middleware
 * 
 * Aplică automat rate limiting pe TOATE endpoint-urile API
 * cu configurări diferite pe categorii
 */

import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('GlobalRateLimit');

// Redis store setup - folosește același store din rate-limit.middleware.ts
// Pentru a evita duplicarea conexiunii Redis, folosim memory store
// Rate limiting specific (auth, accounting) folosește deja Redis
const store: any = undefined; // Memory store implicit (same as existing implementation)

/**
 * Global API Rate Limiter
 * Aplică 100 requests / minut pe TOATE endpoint-urile
 */
export const globalApiRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000, // 1 minut
  max: 100,
  message: {
    error: 'Prea multe cereri. Vă rugăm încercați din nou mai târziu.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Skip pentru anumite endpoint-uri dacă au deja rate limiting specific
  skip: (req: Request) => {
    const path = req.path;
    
    // Skip dacă endpoint-ul are deja rate limiting specific
    const specificRateLimitPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/accounting/sales-journal',
      '/api/accounting/purchase-journal',
    ];
    
    return specificRateLimitPaths.some(p => path.startsWith(p));
  },
  handler: (req, res) => {
    logger.warn(`Global API rate limit exceeded`, {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Prea multe cereri',
      message: 'Ați depășit limita de cereri permise. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60
    });
  }
});

/**
 * Rate Limiter pentru operațiuni de citire
 * 200 requests / minut (mai permisiv)
 */
export const globalReadRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000,
  max: 200,
  skip: (req: Request) => req.method !== 'GET',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate Limiter pentru operațiuni de scriere
 * 50 requests / minut (mai restrictiv)
 */
export const globalWriteRateLimiter = rateLimit({
  store,
  windowMs: 1 * 60 * 1000,
  max: 50,
  skip: (req: Request) => req.method === 'GET',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Write rate limit exceeded`, {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Prea multe operațiuni de scriere',
      message: 'Ați depășit limita de operațiuni. Vă rugăm încercați din nou în 1 minut.',
      retryAfter: 60
    });
  }
});

