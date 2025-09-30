/**
 * Common types shared between client and server
 */

import { User as DbUser } from './schema';

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
 */
export interface JwtPayload {
  id: string;
  username: string;
  role: string;
  roles: string[];
  companyId: string | null;
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
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: string;
      roles: string[];
      companyId: string | null;
    }
  }
}