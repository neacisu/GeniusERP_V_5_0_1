/**
 * Type definitions pentru variabile globale în teste
 */

import type { Express } from 'express';

/**
 * Mock Database Type - Interface pentru mock database în teste
 * Permite orice metodă și proprietate pentru flexibilitate în testing
 */
export interface MockDatabase {
  query?: (...args: unknown[]) => Promise<unknown>;
  execute?: (...args: unknown[]) => Promise<unknown>;
  transaction?: (...args: unknown[]) => Promise<unknown>;
  [key: string]: unknown;
}

declare global {
  var testApp: Express;
  
  namespace NodeJS {
    interface Global {
      testApp: Express;
    }
  }
}

export {};

