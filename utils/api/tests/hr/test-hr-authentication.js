/**
 * Test HR Module Authentication
 * This script tests JWT authentication for HR module endpoints using a valid token
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// JWT Secret from environment or fallback to default (same as in auth.service.ts)
const JWT_SECRET = process.env.JWT_SECRET || '8yMpHJbmnNRrM7QpNKSdnazIFcugb4JT';

// Base URL for API requests - Using local server
const baseUrl = 'http://localhost:5000';

// Generate a valid JWT token for testing
function generateToken(userId, companyId, roles = ['hr_team', 'user']) {
  const payload = {
    sub: userId,
    id: userId,
    email: 'hrtest@testcompany.com',
    username: 'hrtest',
    companyId: companyId,
    role: 'hr_team',
    roles: roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

// Test helper function to make API requests
async function testEndpoint(endpoint, token, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Only add Content-Type and data for non-GET requests
    if (method !== 'GET' && data) {
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }
    
    const response = await axios(config);
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    };
  }
}

// Main test function
async function testHrAuthentication() {
  console.log('Starting HR Module Authentication Test\n');
  
  // Retrieve IDs from environment or prompt for them
  const companyId = process.env.TEST_COMPANY_ID || '7196288d-7314-4512-8b67-2c82449b5465';
  const userId = process.env.TEST_USER_ID || 'a05968e3-2d89-47ef-8cc6-1022c502896a';
  
  console.log(`Using Company ID: ${companyId}`);
  console.log(`Using User ID: ${userId}`);
  
  // Generate valid token
  const token = generateToken(userId, companyId);
  console.log(`Generated JWT token for testing\n`);
  
  // Test endpoints
  console.log('1. Testing GET /api/hr/employees endpoint:');
  const employeesResult = await testEndpoint('/api/hr/employees', token);
  console.log(`Status: ${employeesResult.status} - ${employeesResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (!employeesResult.success) {
    console.log(`Error: ${employeesResult.message}`);
  } else {
    console.log(`Retrieved ${employeesResult.data?.length || 0} employees`);
  }
  console.log('\n');

  console.log('2. Testing GET /api/hr/departments endpoint:');
  const departmentsResult = await testEndpoint('/api/hr/departments', token);
  console.log(`Status: ${departmentsResult.status} - ${departmentsResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (!departmentsResult.success) {
    console.log(`Error: ${departmentsResult.message}`);
  } else {
    console.log(`Retrieved ${departmentsResult.data?.length || 0} departments`);
  }
  console.log('\n');

  console.log('3. Testing GET /api/hr/contracts endpoint:');
  const contractsResult = await testEndpoint('/api/hr/contracts', token);
  console.log(`Status: ${contractsResult.status} - ${contractsResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (!contractsResult.success) {
    console.log(`Error: ${contractsResult.message}`);
  } else {
    console.log(`Retrieved ${contractsResult.data?.length || 0} contracts`);
  }
  console.log('\n');

  // Test with invalid token
  console.log('4. Testing with invalid token:');
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWQiOiJmYWtlIiwiY29tcGFueUlkIjoiZmFrZSIsInJvbGUiOiJociIsImlhdCI6MTUxNjIzOTAyMn0.fakesignature';
  const invalidResult = await testEndpoint('/api/hr/employees', invalidToken);
  console.log(`Status: ${invalidResult.status} - ${invalidResult.success ? 'SUCCESS (unexpected)' : 'FAILED (expected)'}`);
  if (!invalidResult.success) {
    console.log(`Error: ${invalidResult.message} (Expected error)`);
  }
  console.log('\n');

  // Summary of results
  console.log('Authentication Test Summary:');
  console.log(`Valid token tests: ${[employeesResult, departmentsResult, contractsResult].filter(r => r.success).length}/3 successful`);
  console.log(`Invalid token test: ${!invalidResult.success ? 'Passed' : 'Failed'}`);
  console.log('\nHR Module Authentication Test Completed');
}

// Run the test
testHrAuthentication().catch(err => {
  console.error('Test failed with error:', err);
});