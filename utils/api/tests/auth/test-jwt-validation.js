/**
 * Test JWT Token Validation
 * 
 * This script tests whether our JWT token is being properly validated
 * by the AuthGuard in the application.
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

// Test an endpoint that uses authentication
async function testAuthentication() {
  try {
    console.log('Testing JWT Authentication...');
    const token = generateToken();
    
    // Log token details for debugging
    console.log('Token:', token);
    console.log('Token Details:', jwt.decode(token));
    
    // Try accessing the departments endpoint which is authenticated
    const response = await axios.get(`${apiBaseUrl}/api/hr/departments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response Data:', response.data);
    console.log('\nAuthentication Test Successful!');
  } catch (error) {
    console.error('Authentication Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
  }
}

// Run the test
testAuthentication();