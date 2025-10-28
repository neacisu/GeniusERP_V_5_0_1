/**
 * Global Authentication Middleware
 * 
 * Aplică automat autentificare pe TOATE endpoint-urile API
 * cu excepția celor din whitelist
 */

import { Request, Response, NextFunction } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('GlobalAuth');

// Whitelist - endpoint-uri PUBLICE care NU necesită autentificare
const PUBLIC_ENDPOINTS = [
  // Auth endpoints
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/csrf-token',
  
  // Health checks
  '/api/health',
  '/api/metrics',
  
  // Public integrations
  '/api/integrations/webhooks/shopify',
  '/api/integrations/webhooks/stripe',
  
  // COR (Romanian Occupation Classification) - public data
  '/api/hr/cor',
  
  // Static assets
  '/templates',
  '/tserrors',
];

// Endpoint patterns care sunt publice (regex)
const PUBLIC_PATTERNS = [
  /^\/api\/integrations\/webhooks\/.+/, // All webhooks
  /^\/api\/hr\/cor.*/, // COR endpoints
];

/**
 * Verifică dacă un path este în whitelist
 */
function isPublicEndpoint(path: string): boolean {
  // Exact match
  if (PUBLIC_ENDPOINTS.includes(path)) {
    return true;
  }
  
  // Pattern match
  return PUBLIC_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Global Authentication Middleware
 * Aplică automat pe toate rutele /api/* cu excepția whitelist-ului
 */
export function globalAuthMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;
    
    // Skip non-API routes
    if (!path.startsWith('/api')) {
      return next();
    }
    
    // Check whitelist
    if (isPublicEndpoint(path)) {
      logger.debug(`Public endpoint accessed: ${path}`);
      return next();
    }
    
    // Apply authentication for all other API routes
    logger.debug(`Protected endpoint accessed: ${path} - checking auth`);
    return AuthGuard.protect(JwtAuthMode.REQUIRED)(req, res, next);
  };
}

/**
 * Adaugă un endpoint la whitelist (pentru module care se inițializează dinamic)
 */
export function addPublicEndpoint(path: string) {
  if (!PUBLIC_ENDPOINTS.includes(path)) {
    PUBLIC_ENDPOINTS.push(path);
    logger.info(`Added public endpoint: ${path}`);
  }
}

/**
 * Adaugă un pattern la whitelist
 */
export function addPublicPattern(pattern: RegExp) {
  if (!PUBLIC_PATTERNS.includes(pattern)) {
    PUBLIC_PATTERNS.push(pattern);
    logger.info(`Added public pattern: ${pattern}`);
  }
}

