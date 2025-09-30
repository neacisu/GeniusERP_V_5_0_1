/**
 * Auth Guard - CANONICAL IMPLEMENTATION
 * 
 * This is the official, centralized authentication guard for the entire application.
 * All authentication and authorization functionality should be implemented here.
 * 
 * It supports multiple authentication modes:
 * 1. Required - The user must be authenticated to access the route
 * 2. Optional - The user can be authenticated, but it's not required
 * 
 * It also supports:
 * - Role-based access control
 * - Company-based access control
 * - Permission-based checks
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
import { Logger } from '../../../common/logger';

// Create logger for AuthGuard
const logger = new Logger('AuthGuard');

// We'll use our UnifiedJwtPayload interface instead of importing conflicting JwtPayload types
// Import the JWT_SECRET from auth.service for consistency

/**
 * Unified JWT payload with additional features
 * We have two different JwtPayload interfaces (shared/types.ts and shared/types/index.ts)
 * This creates a unified interface that supports both formats
 */
export interface UnifiedJwtPayload {
  id: string;
  username: string;
  email?: string;
  role?: string;  // Optional in one format, required in another
  roles?: string[]; // Optional in one format, required in another
  companyId?: string | null; // Optional in one format, required in another
  userId?: string; // Added for compatibility with AI services
  permissions?: string[]; // Optional permissions array for fine-grained access control
  franchiseId?: string | null;
  iat?: number;
  exp?: number;
}

// Type alias for Request for better readability in our code
export type AuthenticatedRequest = Request;

// Type alias for consistency with existing code
export type JwtUserData = UnifiedJwtPayload;

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
   * Static method to require specific permissions to access the route
   * This is kept for backward compatibility with existing code
   * 
   * @param requiredPermissions String or array of required permissions
   * @returns Express middleware
   */
  static permissionGuard(requiredPermissions: string | string[]) {
    // Use the instance methods of the default exported instance
    const instance = new AuthGuard();
    return instance.requirePermissions(requiredPermissions);
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
        
        // Asigură compatibilitate între snake_case și camelCase pentru company_id/companyId
        if (decoded.companyId && !decoded.company_id) {
          // Adaugăm și company_id pentru compatibilitate cu cod mai vechi
          (decoded as any).company_id = decoded.companyId;
        } else if (decoded.company_id && !decoded.companyId) {
          // Adaugăm și companyId pentru compatibilitate cu cod mai nou
          decoded.companyId = decoded.company_id as string;
        }
        
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
        
        // Asigură compatibilitate între snake_case și camelCase pentru company_id/companyId
        if (decoded.companyId && !decoded.company_id) {
          // Adaugăm și company_id pentru compatibilitate cu cod mai vechi
          (decoded as any).company_id = decoded.companyId;
        } else if (decoded.company_id && !decoded.companyId) {
          // Adaugăm și companyId pentru compatibilitate cu cod mai nou
          decoded.companyId = decoded.company_id as string;
        }
        
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
   * @param allowedRoles String or array of allowed roles
   * @returns Express middleware
   */
  requireRoles(allowedRoles: string | string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        // Normalize inputs
        const userRoles = decoded.roles || [decoded.role];
        const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        // Check if user has admin role (universal access)
        if (userRoles.includes('admin') || userRoles.includes('ADMIN')) {
          logger.debug('Admin role detected, granting access');
          return next();
        }
        
        // Check if user has any of the allowed roles
        const hasAllowedRole = userRoles.some(role => 
          requiredRoles.includes(role) || 
          requiredRoles.includes(role.toLowerCase()) || 
          requiredRoles.includes(role.toUpperCase())
        );
        
        if (hasAllowedRole) {
          logger.debug('Role verification successful', { 
            userId: decoded.id, 
            userRoles, 
            requiredRoles 
          });
          next();
        } else {
          logger.warn('Authorization failed - Missing required roles', { 
            userId: decoded.id, 
            userRoles, 
            requiredRoles 
          });
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      } catch (error) {
        logger.error('Role check error', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Require access to specific company to access the route
   * 
   * @param companyIdParam Name of the parameter containing company ID (defaults to 'companyId')
   * @returns Express middleware
   */
  requireCompanyAccess(companyIdParam: string = 'companyId') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        // Get company ID from URL parameters, query or body
        const targetCompanyId = req.params[companyIdParam] || 
                                req.query[companyIdParam] as string || 
                                (req.body ? req.body[companyIdParam] : null);
        
        // If no company specified in request, continue
        if (!targetCompanyId) {
          logger.debug('No company ID specified in request, allowing access');
          return next();
        }
        
        // Get user roles (normalized)
        const userRoles = decoded.roles || [decoded.role];
        
        // Admin roles can access any company
        if (userRoles.some(role => 
            ['admin', 'ADMIN', 'system_admin', 'SYSTEM_ADMIN'].includes(role))) {
          logger.debug('Admin role detected, granting cross-company access');
          return next();
        }
        
        // Check if user has access to the specified company
        if (decoded.companyId === targetCompanyId) {
          logger.debug('Company access check successful', { 
            userId: decoded.id, 
            companyId: decoded.companyId 
          });
          next();
        } else {
          logger.warn('Company access check failed - Cross-company access attempt', { 
            userId: decoded.id, 
            userCompanyId: decoded.companyId, 
            attemptedCompanyId: targetCompanyId 
          });
          return res.status(403).json({ 
            error: 'Insufficient permissions to access this company' 
          });
        }
      } catch (error) {
        logger.error('Company check error', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
  
  /**
   * Extract token from request
   * Looks for token in Authorization header, query params, or cookies
   * 
   * @param req Express request
   * @returns JWT token or null
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check query parameter (token=xyz)
    if (req.query && req.query.token) {
      return req.query.token as string;
    }
    
    // Check cookies if available
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    
    return null;
  }
  
  /**
   * Require specific permissions to access the route
   * 
   * @param requiredPermissions String or array of required permissions
   * @returns Express middleware
   */
  requirePermissions(requiredPermissions: string | string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      try {
        // Always use the imported JWT_SECRET for consistency
        const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
        req.user = decoded;
        
        // Normalize inputs
        const userPermissions = decoded.permissions || [];
        const permissions = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];
        
        // Check if user has admin role (universal access)
        const userRoles = decoded.roles || [decoded.role];
        if (userRoles.some(role => ['admin', 'ADMIN'].includes(role))) {
          logger.debug('Admin role detected, granting access regardless of permissions');
          return next();
        }
        
        // Check if user has all required permissions
        const hasAllPermissions = permissions.every(
          perm => userPermissions.includes(perm)
        );
        
        if (hasAllPermissions) {
          logger.debug('Permission check successful', { 
            userId: decoded.id, 
            requiredPermissions: permissions 
          });
          next();
        } else {
          logger.warn('Permission check failed', { 
            userId: decoded.id, 
            userPermissions,
            requiredPermissions: permissions
          });
          return res.status(403).json({ 
            error: 'Insufficient permissions' 
          });
        }
      } catch (error) {
        logger.error('Permission check error', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    };
  }
}

// Export default instance
export default new AuthGuard();