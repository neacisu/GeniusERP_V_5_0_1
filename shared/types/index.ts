/**
 * Shared type definitions used across the application
 */

/**
 * User Role enum
 * Defines the roles a user can have in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant',
  EMPLOYEE = 'employee',
  USER = 'user'
}

/**
 * JWT Payload interface
 * This defines the structure of the JWT payload used for authentication
 */
export interface JwtPayload {
  id: string;
  username: string;
  email?: string;
  role?: string;
  roles?: string[];
  companyId?: string;
  userId?: string; // Added for compatibility with existing code
  iat?: number;
  exp?: number;
}