/**
 * Test direct API requests with HTTP module
 * 
 * This script tests making direct HTTP requests to the API to diagnose
 * authentication issues.
 */

import http from 'http';
import jwt from 'jsonwebtoken';

// Settings from auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// Real user data
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user
const COMPANY_ID = 'e6c88ba0-5dc3-4958-83e5-ecd33af0ca9c'; // Genesis
const USER_ROLE = 'admin';

// Create token with roles
function createToken() {
  const payload = {
    id: USER_ID,
    username: 'admin',
    role: USER_ROLE,
    roles: [USER_ROLE, 'hr_team'],
    companyId: COMPANY_ID
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Make a request to the server
function makeRequest(token) {
  // Request data
  const postData = JSON.stringify({
    name: 'Test Direct HTTP Employee',
    email: `test-${Date.now()}@example.com`,
    position: 'Developer',
    salary: 5000,
    hireDate: new Date().toISOString()
  });
  
  // Request options
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/hr/employee',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${token}`
    }
  };
  
  console.log('Request options:', JSON.stringify(options, null, 2));
  console.log('Request data:', postData);
  
  // Make request
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    res.setEncoding('utf8');
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response data:', responseData);
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log('Parsed response:', JSON.stringify(jsonResponse, null, 2));
      } catch (error) {
        console.log('Could not parse response as JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`Error making request: ${error.message}`);
  });
  
  // Write data to request body
  req.write(postData);
  req.end();
}

// Run test
function runTest() {
  const token = createToken();
  console.log('Generated token:', token);
  console.log('Token decoded:', jwt.decode(token));
  
  console.log('\nMaking HTTP request to API...');
  makeRequest(token);
}

// Required for ESM modules
runTest();