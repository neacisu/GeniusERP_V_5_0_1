/**
 * Configurație Mocha pentru testele de integrare GeniusERP
 */

module.exports = {
  // Specificație teste
  spec: [
    'utils/testing/modules/**/integration/**/*.test.ts',
    'utils/testing/modules/**/integration/**/*.test.js',
  ],
  
  // Require modules
  require: [
    'ts-node/register',
    './utils/testing/config/mocha.setup.js',
  ],
  
  // Extensions
  extension: ['ts', 'js'],
  
  // Timeout
  timeout: 30000,
  
  // Reporters
  reporter: 'spec',
  
  // Reporter options
  reporterOptions: {
    json: true,
    output: './utils/testing/reports/mocha/results.json',
  },
  
  // Parallel execution
  parallel: false,
  jobs: 4,
  
  // UI
  ui: 'bdd',
  
  // Colors
  color: true,
  
  // Bail on first failure
  bail: false,
  
  // Slow test threshold
  slow: 1000,
  
  // Exit after tests
  exit: true,
  
  // Recursive
  recursive: true,
  
  // Watch mode (disabled for CI)
  watch: false,
  
  // Global setup/teardown
  globalSetup: './utils/testing/config/mocha.global-setup.js',
  globalTeardown: './utils/testing/config/mocha.global-teardown.js',
};

