/**
 * Types for Express extended with authentication data
 * RE-EXPORT from shared/types.ts for consistency
 */
import { Request } from 'express';
import { JwtUserData } from '../../shared/types';

// Re-export for convenience
export type { JwtUserData, JwtPayload } from '../../shared/types';

export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}