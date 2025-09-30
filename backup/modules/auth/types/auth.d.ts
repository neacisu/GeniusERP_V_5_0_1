/**
 * Express augmentation to add proper user property to Request
 * This overrides all other declarations in the application for Request.user
 */

import { ExtendedJwtPayload } from '../guards/auth.guard';

declare global {
  namespace Express {
    // This will override the existing User interface
    interface User extends ExtendedJwtPayload {}
  }
}

// No exports needed - this is a declaration file