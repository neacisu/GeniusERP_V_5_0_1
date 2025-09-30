/**
 * Test HR Module Employees Endpoint
 *
 * This script tests the HR module's search employees endpoint to ensure it works correctly
 * with various search parameters and pagination.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration settings for the test
const apiBaseUrl = 'http://localhost:5000';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // The actual JWT_SECRET from environment
const TEST_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';

// Generate a JWT token for testing
function generateToken() {
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440001', // User ID
    username: 'admin', // Required by AuthGuard
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'], // Required by AuthGuard for RBAC
    companyId: TEST_COMPANY_ID,
    permissions: ['all'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Test the employee search endpoint with various parameters
async function testSearchEmployees() {
  console.log('Testing HR Module Search Employees API...\n');
  const token = generateToken();
  
  try {
    // Test Case 1: Basic search without parameters
    console.log('Test Case 1: Basic search without parameters');
    const response1 = await axios.get(`${apiBaseUrl}/api/hr/employees`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        companyId: TEST_COMPANY_ID
      }
    });
    
    console.log(`Status: ${response1.status}`);
    console.log(`Total Employees: ${response1.data.data?.pagination?.totalCount || 0}`);
    console.log(`Employees Retrieved: ${response1.data.data?.employees?.length || 0}`);
    console.log('First Employee: ', response1.data.data?.employees[0] ? JSON.stringify(response1.data.data.employees[0], null, 2) : 'No employees found');
    console.log('\n');
    
    // Test Case 2: Search with name filter
    console.log('Test Case 2: Search with name filter');
    const response2 = await axios.get(`${apiBaseUrl}/api/hr/employees`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        companyId: TEST_COMPANY_ID,
        searchTerm: 'John'
      }
    });
    
    console.log(`Status: ${response2.status}`);
    console.log(`Total Employees Matching "John": ${response2.data.data?.pagination?.totalCount || 0}`);
    console.log(`Employees Retrieved: ${response2.data.data?.employees?.length || 0}`);
    console.log('\n');
    
    // Test Case 3: Pagination test
    console.log('Test Case 3: Pagination test (page 1, limit 2)');
    const response3 = await axios.get(`${apiBaseUrl}/api/hr/employees`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        companyId: TEST_COMPANY_ID,
        page: 1,
        limit: 2
      }
    });
    
    console.log(`Status: ${response3.status}`);
    console.log(`Total Employees: ${response3.data.data?.pagination?.totalCount || 0}`);
    console.log(`Employees Retrieved: ${response3.data.data?.employees?.length || 0}`);
    console.log('\n');
    
    // Test Case 4: Active employees only
    console.log('Test Case 4: Active employees only');
    const response4 = await axios.get(`${apiBaseUrl}/api/hr/employees`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        companyId: TEST_COMPANY_ID,
        isActive: true
      }
    });
    
    console.log(`Status: ${response4.status}`);
    console.log(`Total Active Employees: ${response4.data.data?.pagination?.totalCount || 0}`);
    console.log(`Active Employees Retrieved: ${response4.data.data?.employees?.length || 0}`);
    console.log('\n');
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error testing HR Employee Search API:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  }
}

// Run the test
testSearchEmployees();