/**
 * Test Script for Employee Creation with New Fixed Service
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:5000';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // Match environment variable

/**
 * Generate a valid JWT token for testing
 */
function generateToken() {
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: '550e8400-e29b-41d4-a716-446655440001', // Test Company
    permissions: ['hr.employee.create', 'hr.employee.read', 'hr.employee.update']
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test employee creation with the new fixed implementation
 */
async function testEmployeeCreation() {
  // Get a valid token
  const token = generateToken();
  
  // Employee payload
  const payload = {
    name: 'Test Employee',
    email: 'test.employee@example.com',
    position: 'Developer',
    salary: '5000',
    hireDate: '2025-04-06',
    cnp: '1900101000001' // Explicitly provide a CNP value to test the fix
  };
  
  try {
    console.log('Testing employee creation with fixed service...');
    console.log('Employee payload:', payload);
    
    const response = await fetch(`${API_URL}/api/hr/employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    if (result.success === true) {
      console.log('✅ Employee created successfully!');
      return { success: true, employee: result.data };
    } else {
      console.log('❌ Employee creation failed!');
      return { success: false, error: result.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Error during API request:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testEmployeeCreation().then(result => {
  console.log('Test finished with result:', result.success ? 'SUCCESS' : 'FAILED');
  if (!result.success) {
    console.error('Error details:', result.error);
    process.exit(1);
  }
  process.exit(0);
});