import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.service';
import { JwtPayload } from '@geniuserp/shared';

/**
 * Middleware to verify JWT token and attach user payload to request
 */
export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    console.warn('[AuthMiddleware] Missing token');
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || JWT_SECRET;
    
    console.log('[AuthMiddleware] Verifying token using JWT_SECRET');
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Attach the payload to the request
    req.user = payload;
    console.log('[AuthMiddleware] Token validated:', payload);
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Invalid token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Middleware to restrict access to admin users only
 * Must be used after authGuard
 */
export function adminGuard(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Check if user has admin role
  if (req.user.role !== 'admin' && !req.user.roles?.includes('admin')) {
    console.warn('[AdminGuard] Access denied for user:', req.user.username);
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log('[AdminGuard] Admin access granted for user:', req.user.username);
  next();
}

/**
 * Factory function to create a role-based guard
 * @param roles Array of allowed roles
 */
export function roleGuard(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has any of the required roles
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
    const hasRole = userRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      console.warn('[RoleGuard] Access denied for user:', req.user.username);
      return res.status(403).json({ 
        message: 'Insufficient permissions', 
        requiredRoles: roles,
        userRoles: [...new Set([req.user.role, ...(req.user.roles || [])])]
      });
    }
    
    console.log('[RoleGuard] Access granted for user:', req.user.username);
    next();
  };
}

/**
 * Optional authentication middleware that populates req.user if token is valid,
 * but doesn't return an error if no token or invalid token is provided
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || JWT_SECRET;
    
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = payload;
  } catch (error) {
    // Ignore token validation errors in optional auth
  }
  
  next();
}