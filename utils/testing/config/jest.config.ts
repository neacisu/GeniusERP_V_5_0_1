/**
 * Configurație Jest pentru testele GeniusERP
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '../../../',
  
  // Test match patterns
  testMatch: [
    '**/utils/testing/modules/**/unit/**/*.test.ts',
    '**/utils/testing/modules/**/integration/**/*.test.ts',
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@server/(.*)$': '<rootDir>/apps/api/src/$1',
    '^@shared/(.*)$': '<rootDir>/libs/shared/src/$1',
    '^@testing/(.*)$': '<rootDir>/utils/testing/$1',
  },
  
  // Coverage
  collectCoverageFrom: [
    'apps/api/src/**/*.ts',
    '!apps/api/src/**/*.d.ts',
    '!apps/api/src/**/*.test.ts',
    '!apps/api/src/**/*.spec.ts',
  ],
  
  coverageDirectory: '<rootDir>/utils/testing/coverage/jest',
  
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/utils/testing/config/jest.setup.ts'],
  
  // Timeouts
  testTimeout: 30000,
  
  // Transformers
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  
  // Global variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/utils/testing/reports/jest',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Max workers
  maxWorkers: '50%',
};

export default config;
