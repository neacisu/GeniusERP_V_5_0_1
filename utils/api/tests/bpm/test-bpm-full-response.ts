/**
 * Test BPM Module Full Response Structure
 * 
 * This script tests the BPM module's response format and structure
 * by creating a JWT token for our test user and displaying the full
 * JSON response from the '/api/bpm/process-placeholder' endpoint.
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
 * Test BPM process endpoint and display full response
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
    console.log('Response data (full JSON):');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error testing BPM process endpoint:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Run the test
(async () => {
  console.log('Testing BPM Process endpoint with valid roles...');
  await testBpmProcessEndpoint();
})();