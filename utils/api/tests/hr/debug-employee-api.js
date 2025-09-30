/**
 * Debug Script for HR Employee API Endpoint
 * This script makes direct API requests and logs all details
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// API config
const API_URL = 'http://localhost:5000';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8';

// Test company ID (use a company ID that exists in your database)
const TEST_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440001';

/**
 * Generate a valid JWT token for testing
 */
function generateToken() {
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin.test',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'Test',
    role: 'admin',
    roles: ['admin'],
    companyId: TEST_COMPANY_ID,
    permissions: ['*'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Make an API request and log all details
 */
async function testEmployeeAPI() {
  const token = generateToken();
  console.log('Generated authentication token with company ID:', TEST_COMPANY_ID);
  
  const timestamp = Date.now();
  const employeeData = {
    name: `Debug Test ${timestamp}`,
    email: `debug.test.${timestamp}@example.com`,
    position: 'Debug Position',
    cnp: '1900101000000' // Using a known good CNP
  };

  console.log('\n=== REQUEST DETAILS ===');
  console.log('URL:', `${API_URL}/api/hr/employee`);
  console.log('Method: POST');
  console.log('Headers:');
  console.log('  Content-Type: application/json');
  console.log('  Authorization: Bearer [TOKEN]');
  console.log('Body:', JSON.stringify(employeeData, null, 2));

  try {
    console.log('\n=== SENDING REQUEST ===');
    const response = await fetch(`${API_URL}/api/hr/employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });

    console.log('\n=== RESPONSE DETAILS ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    console.log('Headers:', JSON.stringify(responseHeaders, null, 2));
    
    // Try to get response body
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = 'Could not parse JSON response';
    }
    
    console.log('Body:', JSON.stringify(responseBody, null, 2));
    
    if (response.ok) {
      console.log('\n✅ REQUEST SUCCESSFUL');
    } else {
      console.log('\n❌ REQUEST FAILED');
    }
    
    return responseBody;
  } catch (error) {
    console.error('\n=== ERROR DETAILS ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Stack Trace:', error.stack);
    return null;
  }
}

// Run the test
console.log('=== STARTING API DEBUG TEST ===');
testEmployeeAPI()
  .then(() => console.log('\n=== TEST COMPLETED ==='))
  .catch(error => console.error('\nUnhandled error:', error));