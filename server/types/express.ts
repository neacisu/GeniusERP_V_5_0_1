/**
 * Types for Express extended with authentication data
 * 
 * CANONICAL DEFINITION for AuthenticatedRequest
 * All Express Request extensions are defined in ./global.d.ts
 * This file provides convenient re-exports and the AuthenticatedRequest interface
 */
import { Request } from 'express';
import { JwtUserData } from '../../shared/types';

// Re-export for convenience
export type { JwtUserData, JwtPayload } from '../../shared/types';

/**
 * AuthenticatedRequest interface
 * Extends Express Request with authenticated user data
 * The global Express.Request interface is extended in ./global.d.ts
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}

// Global extensions are declared in ./global.d.ts to ensure proper TypeScript recognition