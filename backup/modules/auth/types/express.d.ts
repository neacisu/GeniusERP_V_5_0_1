/**
 * Express augmentation to add user property to Request
 */

import { JwtPayload } from '@shared/types';

declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
}