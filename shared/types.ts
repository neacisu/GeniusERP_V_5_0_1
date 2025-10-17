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
 * CANONICAL DEFINITION - This is the single source of truth for JWT user data
 * Used across the entire application (client, server, all modules)
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
  fullName?: string; // Added in auth.service.ts line 79 - combines firstName + lastName
  firstName?: string; // Optional first name
  lastName?: string; // Optional last name
  permissions?: string[]; // Optional permissions array for fine-grained access control
  franchiseId?: string | null; // Optional franchise ID
  company_id?: string | null; // For backward compatibility with snake_case
  userId?: string; // For compatibility with AI services
  iat?: number;
  exp?: number;
}

/**
 * JWT User Data - Alias for JwtPayload
 * CANONICAL TYPE - Use this type everywhere instead of creating new definitions
 * This ensures type consistency across the entire application
 */
export type JwtUserData = JwtPayload;

/**
 * Extended User type that includes the roles array
 * This is needed because the database User type only has a single role field,
 * but the JWT payload needs to include an array of roles for RBAC
 */
export interface AuthUser extends DbUser {
  roles: string[];
}