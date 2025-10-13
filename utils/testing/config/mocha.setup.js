/**
 * Setup file pentru Mocha
 */

// Set timezone
process.env.TZ = 'Europe/Bucharest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/geniuserp_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';

// Global setup
before(function() {
  // Setup code that runs once before all tests
  this.timeout(30000);
});

// Global teardown
after(function() {
  // Cleanup code that runs once after all tests
  this.timeout(30000);
});

// Setup before each test
beforeEach(function() {
  // Reset any mocks or state before each test
});

// Cleanup after each test
afterEach(function() {
  // Clean up after each test
});

