/**
 * Test script for Employee creation using the API
 * 
 * This script tests the employee creation functionality after the fix to
 * the createSimpleEmployee method in the EmployeeService.
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Configuration
const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';

/**
 * Generate a valid JWT token for testing
 */
function generateToken() {
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: '550e8400-e29b-41d4-a716-446655440001', // Using valid company ID from the database
    permissions: ['hr_access', 'employee_create']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test employee creation with the API
 */
async function testEmployeeCreation() {
  try {
    const token = generateToken();
    
    const employeeData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      position: 'Software Developer',
      salary: 5000,
      hireDate: new Date().toISOString(),
      cnp: '1900101000000' // Using a "valid" CNP format
    };
    
    console.log('Testing employee creation with data:', employeeData);
    
    const response = await fetch(`${BASE_URL}/api/hr/employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    const result = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Employee created successfully!');
      console.log('Employee ID:', result.data.id);
    } else {
      console.log('❌ Failed to create employee');
      console.log('Error:', result.message || result.error);
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testEmployeeCreation();