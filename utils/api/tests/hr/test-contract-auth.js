/**
 * Test Script for Contract Routes Authentication
 * 
 * This script verifies that authentication is properly applied to all contract routes
 * including the POST, GET, and PUT endpoints.
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // Same as auth.service.ts

/**
 * Generate a valid JWT token for testing with proper roles
 */
function generateToken(role = 'hr_team') {
  const payload = {
    id: '123456789',
    username: 'hrmanager',
    email: 'hr@example.com',
    firstName: 'HR',
    lastName: 'Manager',
    role: role,
    roles: [role, 'user'],
    companyId: '987654321',
    permissions: ['hr_view', 'hr_edit', 'employee_view', 'employee_edit']
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  return token;
}

/**
 * Generate an invalid token without the required roles
 */
function generateInvalidRoleToken() {
  const payload = {
    id: '123456789',
    username: 'salesuser',
    email: 'sales@example.com',
    firstName: 'Sales',
    lastName: 'User',
    role: 'sales',
    roles: ['sales', 'user'],
    companyId: '987654321',
    permissions: ['sales_view', 'sales_edit']
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  return token;
}

/**
 * Test contract creation with authentication
 */
async function testContractCreation() {
  console.log('\n1. Testing contract creation with valid authentication...');
  
  const validToken = generateToken();
  const invalidToken = generateInvalidRoleToken();
  
  // Prepare sample contract data
  const contractData = {
    employeeId: 'emp-123',
    contractNumber: 'CN-2025-001',
    contractType: 'FULL_TIME',
    startDate: '2025-05-01',
    endDate: null,
    baseSalaryGross: '5000',
    workingTime: 40,
    corCode: '12345',
    annualVacationDays: 21
  };
  
  // Test with valid token
  try {
    const validResponse = await fetch(`${API_BASE_URL}/api/hr/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify(contractData)
    });
    
    console.log('Valid token response status:', validResponse.status);
    console.log('Should be 201 (Created) or 400 if employee not found');
    
    // Test with invalid role token
    const invalidRoleResponse = await fetch(`${API_BASE_URL}/api/hr/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${invalidToken}`
      },
      body: JSON.stringify(contractData)
    });
    
    console.log('Invalid role token response status:', invalidRoleResponse.status);
    console.log('Should be 403 (Forbidden)');
    
    // Test with no token
    const noTokenResponse = await fetch(`${API_BASE_URL}/api/hr/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractData)
    });
    
    console.log('No token response status:', noTokenResponse.status);
    console.log('Should be 401 (Unauthorized)');
    
  } catch (error) {
    console.error('Error during contract creation test:', error.message);
  }
}

/**
 * Test contract history retrieval with authentication
 */
async function testContractHistoryRetrieval() {
  console.log('\n2. Testing contract history retrieval with authentication...');
  
  const validToken = generateToken();
  const invalidToken = generateInvalidRoleToken();
  const employeeId = 'emp-123';
  
  // Test with valid token
  try {
    const validResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    });
    
    console.log('Valid token response status:', validResponse.status);
    console.log('Should be 200 (OK) or 404 if employee not found');
    
    // Test with invalid role token
    const invalidRoleResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${invalidToken}`
      }
    });
    
    console.log('Invalid role token response status:', invalidRoleResponse.status);
    console.log('Should be 403 (Forbidden)');
    
    // Test with no token
    const noTokenResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${employeeId}`, {
      method: 'GET'
    });
    
    console.log('No token response status:', noTokenResponse.status);
    console.log('Should be 401 (Unauthorized)');
    
  } catch (error) {
    console.error('Error during contract history retrieval test:', error.message);
  }
}

/**
 * Test contract update with authentication
 */
async function testContractUpdate() {
  console.log('\n3. Testing contract update with authentication...');
  
  const validToken = generateToken();
  const invalidToken = generateInvalidRoleToken();
  const contractId = 'contract-123';
  
  // Prepare update data
  const updateData = {
    baseSalaryGross: '5500',
    annualVacationDays: 22
  };
  
  // Test with valid token
  try {
    const validResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Valid token response status:', validResponse.status);
    console.log('Should be 200 (OK) or 404 if contract not found');
    
    // Test with invalid role token
    const invalidRoleResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${invalidToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('Invalid role token response status:', invalidRoleResponse.status);
    console.log('Should be 403 (Forbidden)');
    
    // Test with no token
    const noTokenResponse = await fetch(`${API_BASE_URL}/api/hr/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('No token response status:', noTokenResponse.status);
    console.log('Should be 401 (Unauthorized)');
    
  } catch (error) {
    console.error('Error during contract update test:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting contract endpoints authentication tests...');
  
  await testContractCreation();
  await testContractHistoryRetrieval();
  await testContractUpdate();
  
  console.log('\nContract authentication tests completed.');
}

// Execute the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});