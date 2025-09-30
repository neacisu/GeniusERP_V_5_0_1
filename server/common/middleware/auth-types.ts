import { Request } from 'express';
import { User } from '@shared/schema';
import { JwtUserData } from '../../modules/auth/types/jwt-data.type';

/**
 * Authenticated Request type
 * Extends the Express Request type to include the authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: User | JwtUserData;
}