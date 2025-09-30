/**
 * Roles Guard
 * 
 * Guard that checks if the current user has the roles required to access a route.
 * Works in conjunction with the @Roles() decorator to implement RBAC (Role-Based Access Control).
 * 
 * The guard reads the role metadata attached by the @Roles decorator and compares it
 * with the roles in the user's JWT token.
 */

import { Request, Response, NextFunction } from 'express';
import { Reflector } from '../reflector/reflector';
import { Logger } from '../logger';

// Create logger for RolesGuard
const logger = new Logger('RolesGuard');

export class RolesGuard {
  constructor(private reflector: Reflector) {}

  /**
   * Check if the user has the required roles to access the route
   * @param req Express Request object
   * @param res Express Response object
   * @param next Express NextFunction
   */
  canActivate(req: Request, res: Response, next: NextFunction) {
    // Get the required roles from the route handler
    const requiredRoles = this.reflector.get('roles', req.route?.path) as string[];
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return next();
    }
    
    // Check if the user exists on the request (set by AuthGuard)
    if (!req.user) {
      logger.warn(`Access denied: No user found in request`);
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Get user roles from the request user object
    const userRole = (req.user as any).role;
    const userRoles = (req.user as any).roles || [userRole];
    
    // Check if the user has at least one of the required roles
    const hasRequiredRole = requiredRoles.some((role: string) => userRoles.includes(role));
    
    if (hasRequiredRole) {
      return next();
    }
    
    // User doesn't have the required roles
    logger.warn(`Access denied: User ${(req.user as any).username} with roles [${userRoles.join(', ')}] does not have required roles [${requiredRoles.join(', ')}]`);
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  /**
   * Create middleware function that can be used in Express routes
   */
  createMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.canActivate(req, res, next);
    };
  }
}