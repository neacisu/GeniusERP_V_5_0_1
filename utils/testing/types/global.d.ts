/**
 * Type definitions pentru variabile globale în teste
 */

import type { Express } from 'express';

// Mock Database Type - folosim any pentru flexibilitate în teste
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MockDatabase = any;

declare global {
  var testApp: Express;
  
  namespace NodeJS {
    interface Global {
      testApp: Express;
    }
  }
}

export {};

