/**
 * Authentication Utilities
 * 
 * Helper functions for authentication-related operations.
 */

import { Request } from 'express';
import { AppError } from '../errors/app-error';

/**
 * Get the user ID from the request
 * 
 * @param req Express request object
 * @returns User ID string
 * @throws AppError if user is not authenticated
 */
export function getUserId(req: Request): string {
  if (!req.user || !req.user.id) {
    throw new AppError('UNAUTHORIZED', 'Utilizator neautentificat', 401);
  }

  return req.user.id;
}