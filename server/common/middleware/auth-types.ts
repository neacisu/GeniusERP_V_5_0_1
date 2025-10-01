import { Request } from 'express';
import { JwtUserData } from '../../modules/auth/types/jwt-data.type';

/**
 * Authenticated Request type
 * Extends the Express Request type to include the authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}