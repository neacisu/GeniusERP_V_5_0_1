// Test script for the employee creation CNP fix
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Replace with your JWT secret - should match the one in environment variables
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8';

// Create a test token with admin permissions
function generateToken() {
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440001', // Admin user ID
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: '550e8400-e29b-41d4-a716-446655440001', // Company ID
    permissions: ['create:employee', 'read:employee', 'update:employee', 'delete:employee'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Execute tests for employee creation
async function runEmployeeTests() {
  console.log('=== TESTING EMPLOYEE CREATION WITH CNP FIX ===');
  const token = generateToken();
  
  // Create a test employee with a valid CNP
  try {
    const validEmployee = {
      name: 'Test Employee',
      email: 'test.employee@example.com',
      position: 'Developer',
      salary: '5000',
      hireDate: '2025-01-01',
      cnp: '1900101123456' // Valid CNP format
    };
    
    console.log('[TEST] Creating employee with valid CNP...');
    const validResponse = await axios.post('http://localhost:5000/api/hr/employee', validEmployee, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[SUCCESS] Employee created with valid CNP:', validResponse.data);
  } catch (error) {
    console.error('[ERROR] Failed to create employee with valid CNP:', error.response?.data || error.message);
  }
  
  // Create a test employee with a null CNP (should use default)
  try {
    const employeeWithNullCnp = {
      name: 'Employee Null CNP',
      email: 'null.cnp@example.com',
      position: 'Analyst',
      salary: '4500',
      hireDate: '2025-02-01',
      cnp: null
    };
    
    console.log('[TEST] Creating employee with null CNP (should use default)...');
    const nullCnpResponse = await axios.post('http://localhost:5000/api/hr/employee', employeeWithNullCnp, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[SUCCESS] Employee created with null CNP (default used):', nullCnpResponse.data);
  } catch (error) {
    console.error('[ERROR] Failed to create employee with null CNP:', error.response?.data || error.message);
  }
  
  // Create a test employee with an empty string CNP (should use default)
  try {
    const employeeWithEmptyCnp = {
      name: 'Employee Empty CNP',
      email: 'empty.cnp@example.com',
      position: 'Manager',
      salary: '6000',
      hireDate: '2025-03-01',
      cnp: ''
    };
    
    console.log('[TEST] Creating employee with empty CNP (should use default)...');
    const emptyCnpResponse = await axios.post('http://localhost:5000/api/hr/employee', employeeWithEmptyCnp, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[SUCCESS] Employee created with empty CNP (default used):', emptyCnpResponse.data);
  } catch (error) {
    console.error('[ERROR] Failed to create employee with empty CNP:', error.response?.data || error.message);
  }
  
  // Create a test employee with no CNP field (should use default)
  try {
    const employeeWithNoCnp = {
      name: 'Employee No CNP',
      email: 'no.cnp@example.com',
      position: 'Director',
      salary: '7000',
      hireDate: '2025-04-01'
      // CNP field omitted entirely
    };
    
    console.log('[TEST] Creating employee with no CNP field (should use default)...');
    const noCnpResponse = await axios.post('http://localhost:5000/api/hr/employee', employeeWithNoCnp, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[SUCCESS] Employee created with no CNP field (default used):', noCnpResponse.data);
  } catch (error) {
    console.error('[ERROR] Failed to create employee with no CNP field:', error.response?.data || error.message);
  }
}

// Run the tests
runEmployeeTests().catch(console.error);