 
import * as express from 'express';
import { UnifiedJwtPayload } from '../../modules/auth/guards/auth.guard';

declare global {
  namespace Express {
    // Override the Request interface explicitly
    interface Request {
      // Use UnifiedJwtPayload interface for the user property
      // This includes all properties from both JwtPayload formats
      user?: UnifiedJwtPayload; 
    }
    
    // Define User interface to match UnifiedJwtPayload format
    interface User extends UnifiedJwtPayload {}
  }
}