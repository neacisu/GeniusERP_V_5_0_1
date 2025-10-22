/**
 * ID Generation Utility
 * 
 * This utility provides a consistent way to generate unique IDs across the application.
 * It uses UUID v4 for ID generation.
 */

import { randomUUID } from 'crypto';

/**
 * Generate a unique ID using UUID v4
 * @returns A UUID v4 string
 */
export function createId(): string {
  return randomUUID();
}