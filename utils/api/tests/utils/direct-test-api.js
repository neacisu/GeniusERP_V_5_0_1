/**
 * Direct API test with JWT - ESM version
 * 
 * This script tests making a direct JWT and a direct API request
 * to identify potential issues in the JWT validation process.
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
  
  // Use a 10-minute expiry to ensure it's fresh
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
}

// Directly test the API with axios
async function testDirectApiCall() {
  const token = createFreshToken();
  console.log('Generated fresh token:', token);
  console.log('Token decoded:', jwt.decode(token));
  console.log('Token verified by us:', jwt.verify(token, JWT_SECRET));
  
  try {
    const response = await axios.post(
      'http://localhost:5000/api/hr/employee',
      {
        name: 'Test Axios Employee',
        email: `test-axios-${Date.now()}@example.com`,
        position: 'Developer',
        salary: 5000,
        hireDate: new Date().toISOString()
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);
  } catch (error) {
    console.error('API Call Failed:');
    console.error('Status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
    
    // Check if we can verify the token again, just to double-check
    try {
      console.log('\nVerifying token again:');
      const verified = jwt.verify(token, JWT_SECRET);
      console.log('Token is still valid:', verified);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
    }
  }
}

// Run the test
testDirectApiCall();