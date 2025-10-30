/**
 * Set Metadata Utility
 * 
 * This utility function mimics NestJS's SetMetadata decorator factory.
 * It creates a decorator function that attaches metadata to a class method.
 * Used for role-based access control with the @Roles() decorator.
 */

import { Reflector } from '../reflector/reflector';

// Create a global reflector instance for metadata storage
const reflector = new Reflector();

/**
 * Set metadata for a class method
 * @param key Metadata key
 * @param value Metadata value
 * @returns Decorator function
 */
export function SetMetadata(key: string, value: any): any {
  return function(target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) {
    reflector.set(key, value, target.constructor || target);
    return descriptor;
  };
}