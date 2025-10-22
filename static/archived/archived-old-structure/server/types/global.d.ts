/**
 * Global TypeScript Type Declarations for Server
 * 
 * This file ensures TypeScript recognizes global namespace extensions
 * across the entire server application.
 */

import { JwtUserData } from '../../shared/types';
import 'express';
import 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserData;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

export {};
