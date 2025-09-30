/**
 * Roles Decorator
 * 
 * A custom decorator for Express route handlers that require specific user roles.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors/app-error';

/**
 * Role-based access control decorator
 * 
 * @param roles Array of roles allowed to access the route
 * @returns Middleware function that checks if the user has the required role
 */
export function Roles(roles: string[]) {
  return function(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
    }
    
    const userRole = req.user.role;
    
    if (!userRole || !roles.includes(userRole)) {
      return next(new AppError('FORBIDDEN', 'Nu aveți permisiuni suficiente pentru această acțiune', 403));
    }
    
    next();
  };
}

/**
 * Middleware to check if the user is an admin
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('UNAUTHORIZED', 'Trebuie să fiți autentificat pentru a accesa această resursă', 401));
  }
  
  if (req.user.role !== 'admin') {
    return next(new AppError('FORBIDDEN', 'Această acțiune este permisă doar pentru administratori', 403));
  }
  
  next();
}