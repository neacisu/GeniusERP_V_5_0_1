/**
 * This test script verifies that employee creation now works
 * with our hardcoded CNP approach to solve the not-null constraint issues.
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Configuration
const API_URL = 'http://localhost:5000';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // From JWT environment variable

/**
 * Create a valid JWT token for testing
 */
function generateToken() {
  const payload = {
    id: '99e1a5ac-c397-4f23-828c-1a043cee6aaa',
    username: 'test-user',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['admin', 'user'],
    companyId: '4a0ba500-31fe-4fb5-9270-31f4f128db4d',
    permissions: ['create:employees', 'view:employees']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test employee creation endpoint with our hardcoded CNP approach
 */
async function testHardcodedCnpApproach() {
  try {
    const token = generateToken();
    
    // Employee data with missing CNP to test our hardcoded approach
    const employeeData = {
      name: "Test Employee",
      email: "test.employee@example.com",
      position: "Test Position"
    };
    
    console.log('Testing employee creation with hardcoded CNP approach...');
    console.log('Employee data:', JSON.stringify(employeeData, null, 2));
    
    const response = await fetch(`${API_URL}/api/hr/employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ TEST PASSED: Employee created successfully with hardcoded CNP approach!');
      console.log('Created employee CNP:', data.data.cnp);
      return data.data;
    } else {
      console.log('❌ TEST FAILED: Employee creation failed!');
      console.log('Error:', data.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error in test:', error);
    return null;
  }
}

// Run the test
testHardcodedCnpApproach();