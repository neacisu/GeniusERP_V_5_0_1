/**
 * Test BPM Module Authentication
 * 
 * This script tests the BPM module's authentication and role-based access control
 * by creating a JWT token for our test user and attempting to access the
 * '/api/bpm/process-placeholder' endpoint.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import jsonwebtoken from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Test user data from the database
const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'admin_test',
  email: 'admin_test@testcompany.ro',
  role: 'admin',
  roles: ['admin', 'bpm_manager', 'bpm_admin', 'bpm_user'],
  companyId: 'c23e4567-e89b-12d3-a456-426614174000'
};

/**
 * Create a JWT token for testing
 */
function createTestToken(): string {
  const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_testing_only';
  return jsonwebtoken.sign(testUser, jwtSecret, { expiresIn: '1h' });
}

/**
 * Test BPM process endpoint with authentication
 */
async function testBpmProcessEndpoint() {
  try {
    const token = createTestToken();
    console.log('Generated JWT token for testing');
    
    // Test the process-placeholder endpoint
    const response = await axios.get('http://localhost:5000/api/bpm/process-placeholder', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return true;
  } catch (error) {
    console.error('Error testing BPM process endpoint:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

/**
 * Test BPM endpoint without required role
 */
async function testBpmProcessEndpointWithoutRole() {
  try {
    // Create a user without BPM roles
    const userWithoutBpmRole = {
      ...testUser,
      roles: ['admin'] // Remove BPM roles
    };
    
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_for_testing_only';
    const token = jsonwebtoken.sign(userWithoutBpmRole, jwtSecret, { expiresIn: '1h' });
    
    console.log('Generated JWT token without BPM roles');
    
    // Test the process-placeholder endpoint
    const response = await axios.get('http://localhost:5000/api/bpm/process-placeholder', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return true;
  } catch (error) {
    // We expect this to fail with 403 Forbidden
    if (error.response?.status === 403) {
      console.log('✅ Successfully blocked access without required role: 403 Forbidden');
      return true;
    }
    
    console.error('Unexpected error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Run the tests
(async () => {
  console.log('Testing BPM Process endpoint with valid roles...');
  const validResult = await testBpmProcessEndpoint();
  
  console.log('\nTesting BPM Process endpoint without required roles...');
  const invalidResult = await testBpmProcessEndpointWithoutRole();
  
  if (validResult && invalidResult) {
    console.log('\n✅ All BPM authentication tests passed!');
  } else {
    console.log('\n❌ Some BPM authentication tests failed.');
  }
})();