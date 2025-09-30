/**
 * Test Script for Direct SQL Employee Creation Endpoint
 * 
 * This script tests the new direct SQL approach endpoint (/api/hr/employee-direct)
 * that uses a raw SQL query to ensure proper handling of the CNP field.
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// JWT Secret - must match the one used in the application
const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';

/**
 * Generate a valid JWT token for testing
 * Make sure to include all required fields that the auth system expects
 */
function generateToken() {
  const userData = {
    id: uuidv4(),
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['admin', 'hr_team'],
    companyId: 'c29c0d80-5856-4f37-96ae-1a1004361c47', // Use a valid company ID from your database
    permissions: ['create_employee', 'view_employee', 'edit_employee']
  };
  
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test the direct SQL employee creation endpoint
 */
async function testDirectEmployeeCreation() {
  try {
    // Get a valid token
    const token = generateToken();
    
    // Prepare test employee data
    const employeeData = {
      name: `Test Employee ${Math.floor(Math.random() * 1000)}`,
      email: `test.employee.${Math.floor(Math.random() * 10000)}@example.com`,
      position: 'Software Developer',
      franchiseId: null,
      cnp: '1900101345678' // Test CNP value
    };
    
    console.log('Testing employee creation with direct SQL endpoint...');
    console.log('Employee data:', employeeData);
    
    // Make the API request to the new endpoint
    const response = await fetch('http://localhost:5000/api/hr/employee-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    // Get the response
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS: Employee created successfully');
      console.log('Response data:', JSON.stringify(result, null, 2));
      console.log('Employee ID:', result.data.id);
      console.log('CNP value stored:', result.data.cnp);
    } else {
      console.error('❌ ERROR: Failed to create employee');
      console.error('Response status:', response.status);
      console.error('Error message:', result.message || result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ ERROR: Exception while testing endpoint');
    console.error(error);
  }
}

// Execute the test
testDirectEmployeeCreation();