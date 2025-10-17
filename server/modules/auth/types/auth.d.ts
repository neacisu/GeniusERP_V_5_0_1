/**
 * Express augmentation to add proper user property to Request
 * This overrides all other declarations in the application for Request.user
 */

import { UnifiedJwtPayload } from '../guards/auth.guard';

declare global {
  namespace Express {
    // This will override the existing User interface
    // Use UnifiedJwtPayload which includes all necessary properties
    interface User extends UnifiedJwtPayload {}
  }
}

// No exports needed - this is a declaration file