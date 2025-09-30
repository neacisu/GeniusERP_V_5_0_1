/**
 * Test script for the HR module's employee creation endpoint
 * This follows Step 123 requirements for testing the employee creation functionality
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8'; // Using env var or default secret

/**
 * Generate a valid JWT token for testing with HR team role
 * Using real company ID and user ID from the database
 */
function generateHrToken() {
  const payload = {
    id: 'a05968e3-2d89-47ef-8cc6-1022c502896a', // Real user ID from database
    email: 'hrtest@testcompany.com',
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Real company ID from database
    roles: ['hr_team', 'user'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Generate a standard user token without HR role for testing authentication
 * Using real company ID but with standard user role
 */
function generateStandardUserToken() {
  const payload = {
    id: uuidv4(),
    email: 'standard-user@example.com',
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Real company ID
    roles: ['user'], // No HR team role
    exp: Math.floor(Date.now() / 1000) + (60 * 60),
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Test the employee creation endpoint
 */
async function testEmployeeCreation() {
  console.log('=== Testing HR Employee Creation Endpoint ===\n');
  
  const hrToken = generateHrToken();
  const standardToken = generateStandardUserToken();
  
  try {
    // Test 1: First attempt with standard user token (should fail)
    console.log('Test 1: Attempting to create employee with standard user token (without hr_team role)');
    try {
      await axios.post(`${API_BASE_URL}/hr/employee`, {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        position: 'HR Manager',
        phone: '+40721000111',
        departmentId: null
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${standardToken}`
        }
      });
      
      console.log('❌ Test 1 FAILED: Request succeeded but should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Test 1 PASSED: Request correctly rejected with 403 Forbidden');
      } else {
        console.error('❌ Test 1 FAILED with unexpected error:', error.message);
      }
    }
    
    // Test 2: Test the singular endpoint (/employee) with simplified payload
    console.log('\nTest 2: Testing singular endpoint /hr/employee as specified in Step 123');
    
    // The endpoint expects 'name' not 'firstName' and 'lastName'
    const simpleEmployeeData = {
      name: 'Simple Employee',
      email: `simple.employee.${Date.now()}@example.com`,
      position: 'Tester',
      salary: 5000,
      cnp: '1900101123456' // Adding a CNP value that should pass validation
    };
    
    console.log('Simple employee data:', JSON.stringify(simpleEmployeeData, null, 2));
    
    try {
      const simpleSingularResponse = await axios.post(`${API_BASE_URL}/hr/employee`, simpleEmployeeData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hrToken}`
        }
      });
      
      console.log('✅ Test 2 PASSED: Employee created with singular endpoint');
      console.log('Response status:', simpleSingularResponse.status);
      console.log('Created employee:', JSON.stringify(simpleSingularResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Test 2 FAILED: Could not create employee with singular endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      console.log('Continuing to test plural endpoint...');
    }
    
    // Test 3: Create comprehensive employee with HR token (should succeed)
    console.log('\nTest 3: Creating comprehensive employee with valid HR team token');
    
    const employeeData = {
      firstName: 'John',
      lastName: 'Smith',
      email: `john.smith.${Date.now()}@example.com`, // Unique email
      phone: '+40721222333',
      position: 'Sales Manager',
      departmentId: null, // Optional department
      cnp: '1950912123456', // Romanian personal identification number
      address: 'Str. Exemplu 123, Bucharest',
      birthDate: '1995-09-12'
    };
    
    console.log('Employee data:', JSON.stringify(employeeData, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/hr/employees`, employeeData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      }
    });
    
    console.log('✅ Test 3 PASSED: Employee created successfully');
    console.log('Response status:', response.status);
    console.log('Created employee:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.id) {
      const employeeId = response.data.data.id;
      
      // Test 4: Verify employee was created by retrieving it
      console.log('\nTest 4: Verifying employee was created by retrieving it');
      
      const getResponse = await axios.get(`${API_BASE_URL}/hr/employees/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${hrToken}`
        }
      });
      
      console.log('✅ Test 4 PASSED: Employee retrieved successfully');
      console.log('Retrieved employee:', JSON.stringify(getResponse.data, null, 2));
    }
    
    console.log('\n=== All tests completed ===');
    
  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testEmployeeCreation().catch(error => {
  console.error('Unhandled error:', error);
});