/**
 * Setup file pentru Jest
 */

// Extend Jest matchers
import '@testing-library/jest-dom';

// Set timezone
process.env.TZ = 'Europe/Bucharest';

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/geniuserp_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global setup
beforeAll(() => {
  // Setup code that runs once before all tests
});

// Global teardown
afterAll(() => {
  // Cleanup code that runs once after all tests
});

// Setup before each test
beforeEach(() => {
  // Reset any mocks or state before each test
});

// Cleanup after each test
afterEach(() => {
  // Clean up after each test
});

