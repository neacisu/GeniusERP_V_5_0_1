/**
 * API Integration Test Example
 * 
 * This is an example of how to use the standardized test framework
 * to test API endpoints in a structured way.
 */

const { TestSuite, ApiTester } = require('../../../testing/test-framework');

// Create test suite and API tester
const suite = new TestSuite('API Endpoints Test');
const api = new ApiTester();

// Setup hooks
suite.setBeforeAll(async () => {
  console.log('Generating test token...');
  api.generateToken({ 
    type: 'admin',
    roles: ['admin', 'USER'],
    outputFile: './tokens/admin-test-token.txt'
  });
});

// Add tests for authentication endpoints
suite.test('Auth - Protected Endpoint with Valid Token', async () => {
  const response = await api.get('/api/examples/protected');
  if (!response.success) {
    throw new Error('Protected endpoint access failed');
  }
});

suite.test('User - Get Current User', async () => {
  const response = await api.get('/api/user');
  if (!response.id) {
    throw new Error('Failed to get current user');
  }
});

// Add tests for admin endpoints
suite.test('Admin - Get Users List', async () => {
  const response = await api.get('/api/admin/users');
  if (!Array.isArray(response)) {
    throw new Error('Failed to get users list');
  }
});

// Example skipped test
suite.skip('Skip Example - This test will be skipped', async () => {
  throw new Error('This should not run');
});

// Run the test suite
(async () => {
  try {
    await suite.run();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
})();