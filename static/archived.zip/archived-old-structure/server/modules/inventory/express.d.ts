import { JwtUserData } from '../auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserData;
    }
  }
}