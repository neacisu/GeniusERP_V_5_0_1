/**
 * Common types shared between client and server
 */

import { User as DbUser } from './schema';

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
 * Service decorator for dependency injection
 * This is used to mark a class as a service that can be injected into other components
 */
export function Service() {
  return function(constructor: any) {
    // This is a class decorator that doesn't modify the class
    // It's used primarily for type checking and dependency injection marking
    return constructor;
  };
}

/**
 * JWT payload structure used in the application
 * Based on the User type but with added roles array
 * Matches auth.service.ts generateToken() payload
 */
export interface JwtPayload {
  id: string;
  username: string;
  role: string;
  roles: string[];
  companyId: string | null;
  email?: string; // Added in auth.service.ts line 78
  iat?: number;
  exp?: number;
}

/**
 * Extended User type that includes the roles array
 * This is needed because the database User type only has a single role field,
 * but the JWT payload needs to include an array of roles for RBAC
 */
export interface AuthUser extends DbUser {
  roles: string[];
}

/**
 * Type declaration to extend the Express Request user property
 * This allows TypeScript to recognize user.role and user.roles in requests
 */
// Removed global Express.User declaration to avoid type conflicts
// Using JwtUserData from auth module instead