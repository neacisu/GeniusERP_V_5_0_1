/**
 * Authentication Types
 * 
 * Common types and interfaces for the authentication module.
 */

import { Request } from 'express';

/**
 * Authentication modes for the JWT authentication
 */
export enum JwtAuthMode {
  REQUIRED = 'required',
  OPTIONAL = 'optional'
}

/**
 * User roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user',
  ACCOUNTANT = 'accountant',
  FINANCE_MANAGER = 'finance_manager',
  SALES_AGENT = 'sales_agent',
  HR_MANAGER = 'hr_manager',
  INVENTORY_MANAGER = 'inventory_manager',
  DOCUMENT_MANAGER = 'document_manager'
}

/**
 * JWT token payload structure
 * RE-EXPORT from shared/types.ts for consistency
 */
import type { JwtUserData as JwtUserDataType, JwtPayload as JwtPayloadType } from '../../../shared/types';
export type JwtUserData = JwtUserDataType;
export type JwtPayload = JwtPayloadType;

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}

/**
 * Login request data
 */
export interface LoginRequestData {
  username: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponseData {
  user: {
    id: string;
    username: string;
    role: string;
    roles: string[];
    companyId: string;
    franchiseId?: string;
    email?: string;
    fullName?: string;
  };
  token: string;
  refreshToken: string;
}

/**
 * Token refresh request data
 */
export interface RefreshTokenRequestData {
  refreshToken: string;
}

/**
 * Token refresh response data
 */
export interface RefreshTokenResponseData {
  token: string;
  refreshToken: string;
}

/**
 * Registration request data
 */
export interface RegisterRequestData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  companyId: string;
  role: UserRole;
}