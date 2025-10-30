/**
 * Global type declarations for server-side code
 */

import type postgres from 'postgres';

declare global {
  var pool: ReturnType<typeof postgres> | undefined;
}

export {};
