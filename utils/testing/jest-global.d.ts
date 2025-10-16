/// <reference types="jest" />

// Force Jest types globally for all test files
// This prevents Cypress/Chai types from being used

declare global {
  // Re-export Jest's expect to override any Chai expect
  const expect: typeof import('@jest/globals').expect;
  const describe: typeof import('@jest/globals').describe;
  const it: typeof import('@jest/globals').it;
  const test: typeof import('@jest/globals').test;
  const beforeEach: typeof import('@jest/globals').beforeEach;
  const afterEach: typeof import('@jest/globals').afterEach;
  const beforeAll: typeof import('@jest/globals').beforeAll;
  const afterAll: typeof import('@jest/globals').afterAll;
}

export {};

