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
 * UNIFIED with shared/types.ts - roles is ALWAYS array (auth.service.ts line 73)
 */
export interface JwtPayload {
  id: string;
  username: string;
  role: string; // Primary role - always present (auth.service.ts line 72)
  roles: string[]; // Always array - never undefined (auth.service.ts line 73)
  companyId: string | null;
  email?: string; // Optional
  userId?: string; // Alias for id - compatibility
  iat?: number;
  exp?: number;
}