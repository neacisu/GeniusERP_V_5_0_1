/**
 * Types for Express extended with authentication data
 */
import { Request } from 'express';

export interface JwtUserData {
  id: string;
  username: string;
  email?: string;
  role: string;
  roles: string[];
  companyId: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
  iat?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}