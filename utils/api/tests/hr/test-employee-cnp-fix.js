/**
 * Test the fixed employee creation endpoint with CNP handling
 */
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

config();

const apiUrl = 'http://localhost:5000';

/**
 * Create a valid JWT token for testing
 */
function generateToken() {
  // Create a token that matches the expected structure
  // The token needs these fields: id, username, email, firstName, lastName, role, roles, companyId, permissions
  const payload = {
    id: '5f9d4a4b-c1d0-4e4a-9c1d-0e4a9c1d0e4a',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Use a valid company ID from your database
    permissions: ['manage_employees']
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8', { expiresIn: '1h' });
}

/**
 * Test employee creation with the CNP parameter
 */
async function testEmployeeCreation(testName, payload) {
  try {
    console.log(`\n[${testName}] Testing employee creation...`);
    
    const token = generateToken();
    console.log(`[${testName}] Generated token:`, token.substring(0, 20) + '...');
    
    console.log(`[${testName}] Sending payload:`, JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${apiUrl}/api/hr/employee`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[${testName}] Success! Status:`, response.status);
    console.log(`[${testName}] Created employee:`, JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error(`[${testName}] Error:`, error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Run multiple tests with different CNP values
 */
async function runTests() {
  console.log('Starting CNP Fix tests...');
  
  // Test 1: Valid CNP string
  const test1 = await testEmployeeCreation('Test 1: Valid CNP', {
    name: 'John Doe',
    email: `john.doe.${Date.now()}@example.com`,
    position: 'Developer',
    cnp: '1900101123456'
  });
  
  // Test 2: Empty string CNP
  const test2 = await testEmployeeCreation('Test 2: Empty CNP', {
    name: 'Jane Smith',
    email: `jane.smith.${Date.now()}@example.com`,
    position: 'Designer',
    cnp: ''
  });
  
  // Test 3: CNP is null
  const test3 = await testEmployeeCreation('Test 3: null CNP', {
    name: 'Bob Johnson',
    email: `bob.johnson.${Date.now()}@example.com`,
    position: 'Manager',
    cnp: null
  });
  
  // Test 4: CNP not provided
  const test4 = await testEmployeeCreation('Test 4: undefined CNP', {
    name: 'Alice Williams',
    email: `alice.williams.${Date.now()}@example.com`,
    position: 'Analyst'
    // cnp not included
  });
  
  // Summary
  console.log('\n--- Test Summary ---');
  console.log('Test 1 (Valid CNP): ' + (test1 ? 'PASSED' : 'FAILED'));
  console.log('Test 2 (Empty CNP): ' + (test2 ? 'PASSED' : 'FAILED'));
  console.log('Test 3 (null CNP): ' + (test3 ? 'PASSED' : 'FAILED'));
  console.log('Test 4 (undefined CNP): ' + (test4 ? 'PASSED' : 'FAILED'));
}

runTests().catch(error => console.error('Test failed:', error));