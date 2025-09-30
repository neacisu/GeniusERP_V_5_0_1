/* eslint-disable @typescript-eslint/no-explicit-any */
import * as express from 'express';
import { JwtPayload } from '../../../shared/types';

declare global {
  namespace Express {
    // Override the Request interface explicitly
    interface Request {
      // Use JwtPayload interface for the user property
      // This replaces any existing user property definition
      user?: JwtPayload; 
    }
    
    // Define User interface to match JwtPayload format
    interface User extends JwtPayload {}
  }
}