/**
 * Configurație Vitest pentru testele GeniusERP
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Environment
    environment: 'node',
    
    // Include patterns
    include: [
      '**/utils/testing/modules/**/unit/**/*.test.ts',
      '**/utils/testing/modules/**/schema/**/*.test.ts',
    ],
    
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    
    // Global setup
    globals: true,
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './utils/testing/coverage/vitest',
      include: ['apps/api/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    
    // Timeout
    testTimeout: 30000,
    hookTimeout: 30000,
    
    // Reporters
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './utils/testing/reports/vitest/results.json',
      html: './utils/testing/reports/vitest/index.html',
    },
    
    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    
    // Sequence
    sequence: {
      shuffle: false,
    },
    
    // Mock reset
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../apps/web/src'),
      '@server': path.resolve(__dirname, '../../../apps/api/src'),
      '@shared': path.resolve(__dirname, '../../../libs/shared/src'),
      '@testing': path.resolve(__dirname, '../../../utils/testing'),
    },
  },
});
