import { JwtUserData } from '../../auth/src/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserData;
    }
  }
}