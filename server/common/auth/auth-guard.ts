/**
 * Authentication Guard
 * 
 * This module provides middleware functions for securing API endpoints,
 * verifying authentication tokens, and enforcing role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../logger';

// Enhanced Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

// JWT interface for token payload
interface JwtPayload {
  id: string;
  companyId: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Create a logger for authentication operations
const logger = new Logger('AuthGuard');

/**
 * Authentication guard middleware
 * 
 * This middleware verifies the JWT token in the request header
 * and attaches the decoded user information to the request object.
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next function to continue the request chain
 */
export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Authentication failed - No authorization header provided');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Extract the token (Bearer token format)
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      logger.warn('Authentication failed - Invalid token format');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = tokenParts[1];
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      throw new Error('JWT_SECRET environment variable is required for authentication');
    }
    
    // Decode and verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      companyId: decoded.companyId,
      email: decoded.email,
      roles: decoded.roles || []
    };
    
    logger.debug('User authenticated successfully', { userId: decoded.id, email: decoded.email });
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Authentication failed - Token expired');
      return res.status(401).json({ message: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Authentication failed - Invalid token', { error: error.message });
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    logger.error('Authentication error', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Role-based authorization guard middleware
 * 
 * This middleware checks if the authenticated user has the required roles
 * to access a protected resource.
 * 
 * @param requiredRoles Array of role names required for access
 * @returns Middleware function for Express
 */
export const roleGuard = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn('Role check failed - User not authenticated');
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { roles } = req.user;
      
      // Check if user has admin role (universal access)
      if (roles.includes('admin')) {
        logger.debug('Admin role detected, granting access');
        return next();
      }
      
      // Check if user has at least one of the required roles
      const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
      
      if (!hasRequiredRole) {
        logger.warn('Authorization failed - Missing required roles', { 
          userId: req.user.id, 
          userRoles: roles, 
          requiredRoles 
        });
        return res.status(403).json({ 
          message: 'Access forbidden',
          details: 'You do not have the required permissions'
        });
      }
      
      logger.debug('Role verification successful', { 
        userId: req.user.id, 
        userRoles: roles, 
        requiredRoles 
      });
      
      next();
    } catch (error) {
      logger.error('Role check error', error);
      return res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

/**
 * Company access guard middleware
 * 
 * This middleware ensures that users can only access data from their own company
 * by comparing the companyId in the URL parameters with the user's companyId.
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next function to continue the request chain
 */
export const companyGuard = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      logger.warn('Company check failed - User not authenticated');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get company ID from URL parameters or query string
    const urlCompanyId = req.params.companyId || req.query.companyId as string;
    
    // If no company ID is specified in the URL, continue
    if (!urlCompanyId) {
      return next();
    }
    
    const { companyId, roles } = req.user;
    
    // Allow admin roles to access any company data
    if (roles.includes('admin') || roles.includes('system_admin')) {
      logger.debug('Admin role detected, granting cross-company access');
      return next();
    }
    
    // For regular users, ensure they can only access their own company data
    if (urlCompanyId !== companyId) {
      logger.warn('Company access check failed - Cross-company access attempt', { 
        userId: req.user.id, 
        userCompanyId: companyId, 
        attemptedCompanyId: urlCompanyId 
      });
      
      return res.status(403).json({ 
        message: 'Access forbidden',
        details: 'You can only access data from your own company'
      });
    }
    
    logger.debug('Company access check successful', { 
      userId: req.user.id, 
      companyId 
    });
    
    next();
  } catch (error) {
    logger.error('Company check error', error);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

/**
 * Ownership guard middleware for resource-level protection
 * 
 * This middleware verifies that a user can only access resources they own
 * or that belong to their company, depending on permissions.
 * 
 * @param resourceIdParam The URL parameter name for the resource ID
 * @param resourceOwnerKey The key in the resource object that identifies the owner
 * @param fetchResourceFn Function to fetch the resource from the database
 * @returns Middleware function for Express
 */
export const ownershipGuard = (
  resourceIdParam: string,
  resourceOwnerKey: string,
  fetchResourceFn: (id: string) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn('Ownership check failed - User not authenticated');
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        logger.warn('Ownership check failed - No resource ID provided', { 
          parameter: resourceIdParam 
        });
        return res.status(400).json({ message: 'Resource ID is required' });
      }
      
      const { id: userId, companyId, roles } = req.user;
      
      // Admin or other privileged roles can access any resource
      if (roles.includes('admin') || roles.includes('manager')) {
        logger.debug('Admin/Manager role detected, bypassing ownership check');
        return next();
      }
      
      // Fetch the resource
      const resource = await fetchResourceFn(resourceId);
      
      if (!resource) {
        logger.warn('Ownership check failed - Resource not found', { 
          resourceId, 
          resourceType: resourceIdParam 
        });
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      // Check resource company ID first
      if (resource.companyId && resource.companyId !== companyId) {
        logger.warn('Ownership check failed - Resource belongs to different company', { 
          userId, 
          userCompanyId: companyId, 
          resourceCompanyId: resource.companyId 
        });
        return res.status(403).json({ message: 'Access forbidden' });
      }
      
      // Then check resource ownership if needed
      if (resource[resourceOwnerKey] && resource[resourceOwnerKey] !== userId) {
        // Check if user has role with company-wide access
        if (!roles.includes('company_admin') && !roles.includes('department_admin')) {
          logger.warn('Ownership check failed - User is not resource owner', { 
            userId, 
            resourceOwner: resource[resourceOwnerKey] 
          });
          return res.status(403).json({ message: 'Access forbidden' });
        }
      }
      
      logger.debug('Ownership check successful', { 
        userId, 
        resourceId 
      });
      
      next();
    } catch (error) {
      logger.error('Ownership check error', error);
      return res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

// Export all guards as a unified module
export const AuthGuard = {
  authGuard,
  roleGuard,
  companyGuard,
  ownershipGuard
};