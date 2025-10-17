/**
 * Auth Guard Middleware
 * 
 * Provides middleware functions for verifying user authentication and authorization.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../logger';
import { JwtUserData } from '../../../shared/types';

// Import JWT_SECRET from auth service for consistency
import { JWT_SECRET } from '../../modules/auth/services/auth.service';

// Create logger for AuthGuard
const logger = new Logger('AuthGuard');

export class AuthGuard {
  /**
   * Middleware that requires authentication
   * Will reject requests without a valid JWT token
   */
  static requireAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = AuthGuard.getTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        next();
      } catch (error) {
        logger.error('Invalid token', error);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Middleware that optionally authenticates the user
   * Will continue processing even without a valid token
   */
  static optionalAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = AuthGuard.getTokenFromRequest(req);
      
      if (!token) {
        return next();
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        next();
      } catch (error) {
        logger.debug('Invalid optional token', error);
        next();
      }
    };
  }
  
  /**
   * Middleware that requires specific role(s)
   * @param roles String or array of allowed roles
   */
  static requireRoles(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      // First ensure the user is authenticated
      AuthGuard.requireAuth()(req, res, () => {
        // Check user role (user should be defined due to requireAuth)
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        
        const userRole = (req.user as JwtUserData).role;
        const userRoles = (req.user as any).roles || [userRole];
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        // Check if any user role is in the allowed roles
        const hasAllowedRole = userRoles.some((role: any) => allowedRoles.includes(role));
        if (hasAllowedRole) {
          return next();
        }
        
        // User is authenticated but doesn't have the required role
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      });
    };
  }
  
  /**
   * Middleware that requires access to a specific company
   */
  static requireCompanyAccess(paramName: string = 'companyId') {
    return (req: Request, res: Response, next: NextFunction) => {
      // First ensure the user is authenticated
      AuthGuard.requireAuth()(req, res, () => {
        // Check user company access (user should be defined due to requireAuth)
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        
        const userCompanyId = req.user.companyId;
        const targetCompanyId = req.params[paramName] || req.body[paramName];
        
        // Special case for admin role - they can access any company
        const userRoles = (req.user as any).roles || [(req.user as JwtUserData).role];
        if (userRoles.includes('admin')) {
          return next();
        }
        
        // If no company specified in request, or if user belongs to that company
        if (!targetCompanyId || userCompanyId === targetCompanyId) {
          return next();
        }
        
        // User is authenticated but doesn't have access to the specified company
        return res.status(403).json({ success: false, message: 'Access denied to the requested company' });
      });
    };
  }
  
  /**
   * Extract JWT token from request
   * Looks for the token in Authorization header (Bearer token)
   */
  private static getTokenFromRequest(req: Request): string | null {
    if (!req.headers.authorization) {
      return null;
    }
    
    const authHeader = req.headers.authorization;
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract the token part
    const token = authHeader.split(' ')[1];
    return token || null;
  }
}