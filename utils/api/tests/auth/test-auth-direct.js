/**
 * Direct test of authentication with examples module
 * 
 * This script tests a very simple API endpoint to check if the authentication
 * system is working correctly overall.
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

// Settings from auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// Real user data
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user
const COMPANY_ID = 'e6c88ba0-5dc3-4958-83e5-ecd33af0ca9c'; // Genesis
const USER_ROLE = 'admin';

// Generate a fresh token with the same parameters
function createFreshToken() {
  const payload = {
    id: USER_ID,
    username: 'admin',
    role: USER_ROLE,
    roles: [USER_ROLE, 'hr_team'],
    companyId: COMPANY_ID
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
}

// Test the examples module protected endpoint
async function testExamplesProtectedEndpoint() {
  const token = createFreshToken();
  console.log('Generated fresh token:', token);
  console.log('Token verified locally:', !!jwt.verify(token, JWT_SECRET));
  
  try {
    // Just GET a simple protected examples API
    const response = await axios.get(
      'http://localhost:5000/api/examples/protected',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Protected API Response Status:', response.status);
    console.log('Protected API Response Data:', response.data);
  } catch (error) {
    console.error('Protected API Call Failed:');
    console.error('Status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

// Run the test
testExamplesProtectedEndpoint();