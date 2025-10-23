/**
 * Express Request augmentation for TypeScript
 * 
 * This file extends the Express Request interface to include the `user` property
 * that is populated by the authentication middleware (AuthGuard).
 * 
 * This type declaration is accessible to ALL libs because it's in the shared module.
 */

import { JwtPayload } from '../types';

declare global {
  namespace Express {
    /**
     * Extend Express Request interface to include authenticated user data
     * The user property is set by AuthGuard middleware after JWT token validation
     */
    interface Request {
      user?: JwtPayload;
    }
    
    /**
     * Define User interface to match JwtPayload for compatibility
     */
    interface User extends JwtPayload {}
  }
}

export {};
