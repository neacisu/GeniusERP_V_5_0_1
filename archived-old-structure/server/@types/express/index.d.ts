 
import * as express from 'express';
import { JwtUserData } from '../../../shared/types';

declare global {
  namespace Express {
    // Override the Request interface explicitly
    interface Request {
      // Use canonical JwtUserData from shared/types.ts
      user?: JwtUserData; 
    }
    
    // Define User interface to match JwtUserData format
    interface User extends JwtUserData {}
  }
}