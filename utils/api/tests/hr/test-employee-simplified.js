/**
 * Test script for Employee creation using the API
 * Using the fixed createSimpleEmployee method
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

/**
 * Generate a valid JWT token for testing
 * Using the same structure as expected by the auth system
 */
function generateToken() {
  const payload = {
    id: '123456789',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: '550e8400-e29b-41d4-a716-446655440001', // Valid test company ID
    permissions: ['manage_employees']
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8', { expiresIn: '1h' });
}

/**
 * Test employee creation with the API using our modified function
 */
async function testEmployeeCreation() {
  try {
    const token = generateToken();
    console.log('Generated JWT token for API request');
    
    // Define test employee data
    const employeeData = {
      name: 'John Smith',
      email: 'john.smith@example.com',
      position: 'Software Engineer',
      companyId: '550e8400-e29b-41d4-a716-446655440001', // Valid company ID
      salary: 70000,
      hireDate: new Date().toISOString(),
      cnp: '1900101000000' // Default CNP (for testing only)
    };
    
    console.log('Attempting to create employee with data:', employeeData);
    
    // Make API request
    const response = await fetch('http://localhost:5000/api/hr/employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Body:', data);
    
    if (response.ok) {
      console.log('Employee created successfully!');
      console.log('Employee ID:', data.id);
    } else {
      console.error('Failed to create employee:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testEmployeeCreation();