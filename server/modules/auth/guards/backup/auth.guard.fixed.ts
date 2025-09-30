/**
 * Auth Guard
 * 
 * This guard is used to protect routes with JWT authentication and 
 * role-based access control.
 * 
 * It supports two modes of authentication:
 * 1. Required - The user must be authenticated to access the route
 * 2. Optional - The user can be authenticated, but it's not required
 * 
 * It also supports role-based access control, where the user must have
 * the specified roles to access the route.
 * 
 * IMPORTANT: This implementation supports both static methods (for backward compatibility)
 * and instance methods (for new code). The static methods are simply wrappers around
 * the corresponding instance methods.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Service } from '../../../../shared/types';
import { JwtAuthMode } from '../constants/auth-mode.enum';
import { JWT_SECRET } from '../services/auth.service';

export interface JwtUserData {
  id: string;
  username: string;
  role: string;
  companyId: string;
  userId?: string; // Added for compatibility with AI services
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}

@Service()
export class AuthGuard {
  /**
   * Static method to protect a route with JWT authentication
   * This is kept for backward compatibility with existing code
   * 
   * @param mode Authentication mode (required or optional)
   * @returns Express middleware
   */
  static protect(mode: JwtAuthMode = JwtAuthMode.REQUIRED) {
    // Use the instance methods of the default exported instance
    const instance = new AuthGuard();
    return mode === JwtAuthMode.OPTIONAL 
      ? instance.optional()
      : instance.require();
  }
  
  /**
   * Static method to require specific roles to access the route
   * This is kept for backward compatibility with existing code
   * 
   * @param allowedRoles Array of allowed roles
   * @returns Express middleware
   */
  static roleGuard(allowedRoles: string[]) {
    // Use the instance methods of the default exported instance
    const instance = new AuthGuard();
    return instance.requireRoles(allowedRoles);
  }
  
  /**
   * Static method to require access to specific company
   * This is kept for backward compatibility with existing code
   * 
   * @param companyIdParam Name of the parameter containing company ID
   * @returns Express middleware
   */
  static companyGuard(companyIdParam: string) {
    // Use the instance methods of the default exported instance
    const instance = new AuthGuard();
    return instance.requireCompanyAccess(companyIdParam);
  }
  
  /**
   * Require authentication to access the route
   * Alias for the require() method for better readability
   * 
   * @returns Express middleware
   */
  requireAuth() {
    return this.require();
  }
  
  /**
   * Require authentication to access the route
   * 
   * @returns Express middleware
   */
  require() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Make authentication optional for the route
   * Alias for the optional() method for better readability
   * 
   * @returns Express middleware
   */
  optionalAuth() {
    return this.optional();
  }
  
  /**
   * Make authentication optional for the route
   * 
   * @returns Express middleware
   */
  optional() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        next();
        return;
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
      } catch (error) {
        // Invalid token, but authentication is optional
      }
      
      next();
    };
  }
  
  /**
   * Require specific roles to access the route
   * 
   * @param allowedRoles Array of allowed roles
   * @returns Express middleware
   */
  requireRoles(allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        // Check if user has any of the allowed roles
        const userRole = decoded.role;
        if (allowedRoles.includes(userRole)) {
          next();
        } else {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Require access to specific company to access the route
   * 
   * @param companyIdParam Name of the parameter containing company ID
   * @returns Express middleware
   */
  requireCompanyAccess(companyIdParam: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        const companyId = req.params[companyIdParam];
        
        // ADMIN role can access any company
        if (decoded.role === 'ADMIN') {
          next();
          return;
        }
        
        // Check if user has access to the specified company
        if (decoded.companyId === companyId) {
          next();
        } else {
          return res.status(403).json({ error: 'Insufficient permissions to access this company' });
        }
      } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Extract token from request
   * 
   * @param req Express request
   * @returns JWT token or null
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}

// Export default instance
export default new AuthGuard();