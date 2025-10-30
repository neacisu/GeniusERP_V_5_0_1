/**
 * Roles Decorator
 * 
 * This decorator allows for declarative role-based access control on endpoints.
 * It attaches role metadata to a controller method that can be read by the RolesGuard.
 * 
 * Usage:
 * @Roles('admin', 'manager')
 * methodName() { ... }
 * 
 * It must be used in conjunction with RolesGuard to function properly.
 */

import { SetMetadata } from "./set-metadata";
import { Request, Response } from 'express';

/**
 * Roles decorator for role-based access control
 * @param roles String array of allowed roles for an endpoint
 * @returns Decorator that attaches roles metadata to the method
 */
export function Roles(...roles: string[]): any {
  return (
    target: any,
    key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<
      (req: Request, res: Response) => Promise<any> | any
    >
  ) => {
    return SetMetadata("roles", roles)(target, key, descriptor);
  };
}