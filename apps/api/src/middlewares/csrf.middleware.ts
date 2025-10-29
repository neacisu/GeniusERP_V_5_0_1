/**
 * CSRF Protection Middleware
 * 
 * Implementare custom CSRF protection (csurf este deprecated)
 * Folosește token-uri generate cu crypto și validate per sesiune
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('csrf');

// Store pentru token-uri CSRF (în producție ar trebui folosit Redis)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Configurare
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 oră
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generează un token CSRF random
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Curăță token-urile expirate periodic
 */
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    logger.debug(`Cleaned up ${expiredCount} expired CSRF tokens`);
  }
}, 15 * 60 * 1000); // Curăță la fiecare 15 minute

/**
 * Middleware pentru generarea și atașarea token-ului CSRF
 * Trebuie apelat ÎNAINTE de rutele care necesită protecție
 */
export function csrfSetup() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generează token nou pentru fiecare request
    const token = generateCsrfToken();
    const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;
    
    // Creează un identificator unic per user/sesiune
    // Folosim session ID dacă există, altfel IP + User-Agent
    const sessionId = (req.session as any)?.id || 
                     `${req.ip}-${req.get('user-agent')}`;
    
    // Stochează token-ul
    csrfTokens.set(sessionId, { token, expiresAt });
    
    // Atașează token-ul la request pentru acces în rute
    (req as any).csrfToken = () => token;
    
    // Setează cookie-ul CSRF (httpOnly: false pentru access JavaScript)
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Trebuie să fie false pentru a putea fi citit de frontend
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY
    });
    
    next();
  };
}

/**
 * Middleware pentru verificarea token-ului CSRF
 * Aplicat pe rute POST/PUT/DELETE/PATCH
 */
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF pentru metode safe (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip CSRF pentru anumite rute (login, register)
    // Acestea au alte mecanisme de protecție (rate limiting)
    const skipRoutes = ['/api/auth/login', '/api/auth/register'];
    if (skipRoutes.some(route => req.path === route)) {
      return next();
    }
    
    // Extrage token-ul din header sau cookie
    const tokenFromHeader = req.get(CSRF_HEADER_NAME);
    const tokenFromCookie = req.cookies?.[CSRF_COOKIE_NAME];
    const submittedToken = tokenFromHeader || tokenFromCookie;
    
    if (!submittedToken) {
      logger.warn('CSRF token missing', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF protection requires a valid token'
      });
    }
    
    // Verifică token-ul față de cel stocat
    const sessionId = (req.session as any)?.id || 
                     `${req.ip}-${req.get('user-agent')}`;
    
    const storedToken = csrfTokens.get(sessionId);
    
    if (!storedToken) {
      logger.warn('CSRF token not found in store', {
        path: req.path,
        method: req.method,
        sessionId
      });
      
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'Token not found or expired. Please refresh and try again.'
      });
    }
    
    // Verifică expirarea
    if (storedToken.expiresAt < Date.now()) {
      csrfTokens.delete(sessionId);
      
      logger.warn('CSRF token expired', {
        path: req.path,
        method: req.method,
        sessionId
      });
      
      return res.status(403).json({
        error: 'CSRF token expired',
        message: 'Token expired. Please refresh and try again.'
      });
    }
    
    // Verifică că token-ul se potrivește (constant-time comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(submittedToken),
      Buffer.from(storedToken.token)
    );
    
    if (!isValid) {
      logger.warn('CSRF token mismatch', {
        path: req.path,
        method: req.method,
        sessionId
      });
      
      return res.status(403).json({
        error: 'CSRF token invalid',
        message: 'Token validation failed'
      });
    }
    
    // Token valid - permite request-ul
    logger.debug('CSRF token validated successfully', {
      path: req.path,
      method: req.method
    });
    
    next();
  };
}

/**
 * Route handler pentru obținerea unui token CSRF
 * Expune un endpoint GET /api/auth/csrf-token
 */
export function csrfTokenRoute(req: Request, res: Response) {
  const token = (req as any).csrfToken?.();
  
  if (!token) {
    return res.status(500).json({
      error: 'CSRF token generation failed',
      message: 'Please ensure csrfSetup middleware is configured'
    });
  }
  
  res.json({
    csrfToken: token,
    expiresIn: CSRF_TOKEN_EXPIRY / 1000 // seconds
  });
}

/**
 * Cleanup function pentru testing sau shutdown
 */
export function clearCsrfTokens() {
  csrfTokens.clear();
  logger.info('CSRF tokens cleared');
}

