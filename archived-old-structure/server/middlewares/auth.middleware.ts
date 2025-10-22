/**
 * Authentication Middleware
 * 
 * Middleware to protect routes that require authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/app-error';

/**
 * Authentication Middleware Class
 * Used for routes that require authentication
 */
export class AuthMiddleware {
  /**
   * Middleware that verifies if the user is authenticated
   */
  authenticate() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
      }
      next();
    };
  }

  /**
   * Middleware that verifies if the user is authenticated and has the required role
   * @param allowedRoles List of allowed roles
   */
  authorize(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
      }

      const userRole = req.user.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return next(new AppError('FORBIDDEN', 'Nu aveți permisiuni suficiente pentru această acțiune', 403));
      }
      
      next();
    };
  }

  /**
   * Middleware that verifies if the user has company access
   */
  requireCompanyAccess() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
      }
      
      if (!req.user.companyId) {
        return next(new AppError('FORBIDDEN', 'Nu aveți acces la o companie', 403));
      }
      
      next();
    };
  }
}

/**
 * Middleware that verifies if the user is authenticated
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
  }
  
  next();
}

/**
 * Middleware that verifies if the user is authenticated and has company access
 * 
 * @param req Express request
 * @param res Express response
 * @param next Next function
 */
export function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
  }
  
  if (!req.user.companyId) {
    return next(new AppError('FORBIDDEN', 'Nu aveți acces la o companie', 403));
  }
  
  next();
}