/**
 * Express augmentation to add user property to Request
 */

import { JwtPayload } from '@geniuserp/shared';

declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
}