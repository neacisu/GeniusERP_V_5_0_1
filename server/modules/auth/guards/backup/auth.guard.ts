/**
 * Authentication Guard for Analytics Module
 * 
 * This file contains middleware functions for authentication and authorization.
 */

import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AuthenticatedRequest, AuthOptions, JwtUserData, UserRole } from './auth.types';

// Get JWT secret from environment variables or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'analytics-module-development-secret';

/**
 * Verify JWT Token
 * 
 * Verifies the JWT token and returns the decoded data
 * 
 * @param token JWT token to verify
 * @returns Decoded user data or null if invalid
 */
const verifyToken = (token: string): JwtUserData | null => {
  try {
    return verify(token, JWT_SECRET) as JwtUserData;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Extract JWT Token
 * 
 * Extracts the JWT token from the request
 * 
 * @param req Express request object
 * @returns JWT token or null if not found
 */
const extractToken = (req: AuthenticatedRequest): string | null => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }
  
  if (req.query?.token) {
    return req.query.token as string;
  }
  
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return null;
};

/**
 * Authentication Guard
 * 
 * Middleware to check if the user is authenticated and has the required permissions
 * 
 * @param options Authentication options
 * @returns Express middleware function
 */
export const authGuard = (options: AuthOptions = { required: true }) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    
    if (!token) {
      if (!options.required) {
        return next();
      }
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userData = verifyToken(token);
    
    if (!userData) {
      if (!options.required) {
        return next();
      }
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Check if token is expired
    if (userData.exp && userData.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    // Set user data on request
    req.user = userData;
    
    // Check roles if specified
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const hasAllowedRole = options.allowedRoles.includes(userData.role);
      if (!hasAllowedRole) {
        return res.status(403).json({ 
          message: 'Access denied. Required role: ' + options.allowedRoles.join(', ') 
        });
      }
    }
    
    // Check permissions if specified
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const userPermissions = userData.permissions || [];
      const hasAllPermissions = options.requiredPermissions.every(
        (perm: any) => userPermissions.includes(perm)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          message: 'Access denied. Required permissions: ' + options.requiredPermissions.join(', ') 
        });
      }
    }
    
    // Check company context if specified
    if (options.checkCompany && req.params.companyId && req.params.companyId !== userData.companyId) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access resources within your company.' 
      });
    }
    
    next();
  };
};

/**
 * Optional Auth Guard
 * 
 * Middleware that verifies authentication if a token is present,
 * but allows the request to proceed even without a token.
 * 
 * @returns Express middleware function
 */
export const optionalAuthGuard = () => {
  return authGuard({ required: false });
};

/**
 * Role-Based Auth Guard
 * 
 * Middleware that checks if the user has one of the allowed roles.
 * 
 * @param allowedRoles Array of roles that are allowed to access the resource
 * @returns Express middleware function
 */
export const roleGuard = (allowedRoles: string[]) => {
  return authGuard({ required: true, allowedRoles });
};

/**
 * Permission Guard
 * 
 * Middleware that checks if the user has all the required permissions.
 * 
 * @param requiredPermissions Array of permissions required to access the resource
 * @returns Express middleware function
 */
export const permissionGuard = (requiredPermissions: string[]) => {
  return authGuard({ required: true, requiredPermissions });
};

/**
 * Admin Guard
 * 
 * Middleware that allows only ADMIN and COMPANY_ADMIN roles to access the resource.
 * 
 * @returns Express middleware function
 */
export const adminGuard = () => {
  return roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]);
};

/**
 * Analyst Guard
 * 
 * Middleware that allows only users with the ANALYST role (or admin roles) to access the resource.
 * 
 * @returns Express middleware function
 */
export const analystGuard = () => {
  return roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.ANALYST]);
};

/**
 * Company Context Guard
 * 
 * Middleware that checks if the user belongs to the company specified in the request.
 * 
 * @returns Express middleware function
 */
export const companyContextGuard = () => {
  return authGuard({ required: true, checkCompany: true });
};