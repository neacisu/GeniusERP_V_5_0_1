/**
 * Comprehensive Authentication Test
 * 
 * This script performs extensive testing of authentication for all module 
 * placeholder endpoints to verify the following:
 * 
 * 1. Endpoints reject requests without tokens
 * 2. Endpoints reject requests with invalid tokens
 * 3. Endpoints accept requests with valid tokens
 * 
 * The test will help identify issues with the requireAuth middleware.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AuthGuard } from './server/common/middleware/auth-guard';

// Get API port from environment or use default (5000 based on server code)
const API_PORT = process.env.PORT || '5000';
const API_BASE = `http://localhost:${API_PORT}`;

// Define module endpoints for testing
const endpoints = [
  { name: 'Sales', url: `${API_BASE}/api/v1/sales/placeholder`, method: 'post' },
  { name: 'HR', url: `${API_BASE}/api/v1/hr/placeholder`, method: 'post' },
  { name: 'E-commerce', url: `${API_BASE}/api/v1/ecommerce/order-placeholder`, method: 'post' },
  { name: 'Marketing', url: `${API_BASE}/api/v1/marketing/campaign-placeholder`, method: 'post' },
  { name: 'Integrations', url: `${API_BASE}/api/v1/integrations/activate-placeholder`, method: 'post' },
  { name: 'BPM', url: `${API_BASE}/api/v1/bpm/process-placeholder`, method: 'post' },
  { name: 'Collaboration', url: `${API_BASE}/api/v1/collab/task-placeholder`, method: 'post' },
  { name: 'AI', url: `${API_BASE}/api/v1/ai/report-placeholder`, method: 'post' },
  { name: 'Settings', url: `${API_BASE}/api/v1/settings/setup-placeholder`, method: 'post' },
];

// JWT constants (matching our auth service)
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';
const JWT_WRONG_SECRET = 'wrong_secret_for_testing';

/**
 * Generate a valid JWT token for testing
 */
function generateValidToken(): string {
  const userData = {
    id: 'test-user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    roles: ['admin'],
    companyId: 'test-company-id-123',
  };
  
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Generate an invalid JWT token (wrong signature) for testing
 */
function generateInvalidToken(): string {
  const userData = {
    id: 'test-user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    roles: ['admin'],
    companyId: 'test-company-id-123',
  };
  
  return jwt.sign(userData, JWT_WRONG_SECRET, { expiresIn: '1h' });
}

/**
 * Test an endpoint for authentication enforcement
 */
async function testEndpointAuth(endpoint: typeof endpoints[0]) {
  console.log(`\n=== Testing ${endpoint.name} Authentication ===`);
  
  // Test data for the request
  const testData = { 
    companyId: 'test-company-id-123',
    data: { testField: 'test-value' }
  };
  
  // 1. Test with no token
  try {
    console.log(`Testing without token...`);
    await axios({
      method: endpoint.method,
      url: endpoint.url,
      data: testData
    });
    console.log(`❌ ${endpoint.name} - NO TOKEN: Failed! Endpoint allowed access without token`);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) {
      console.log(`✅ ${endpoint.name} - NO TOKEN: Success! Properly returned 401 Unauthorized`);
    } else {
      console.log(`❓ ${endpoint.name} - NO TOKEN: Unknown result! Status: ${status}, Message: ${error.message}`);
    }
  }
  
  // 2. Test with invalid token
  try {
    console.log(`Testing with invalid token...`);
    const invalidToken = generateInvalidToken();
    await axios({
      method: endpoint.method,
      url: endpoint.url,
      headers: {
        Authorization: `Bearer ${invalidToken}`
      },
      data: testData
    });
    console.log(`❌ ${endpoint.name} - INVALID TOKEN: Failed! Endpoint allowed access with invalid token`);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) {
      console.log(`✅ ${endpoint.name} - INVALID TOKEN: Success! Properly returned 401 Unauthorized`);
    } else {
      console.log(`❓ ${endpoint.name} - INVALID TOKEN: Unknown result! Status: ${status}, Message: ${error.message}`);
    }
  }
  
  // 3. Test with valid token
  try {
    console.log(`Testing with valid token...`);
    const validToken = generateValidToken();
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      headers: {
        Authorization: `Bearer ${validToken}`
      },
      data: testData
    });
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ ${endpoint.name} - VALID TOKEN: Success! Properly allowed access with valid token`);
    } else {
      console.log(`❓ ${endpoint.name} - VALID TOKEN: Unknown result! Status: ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ ${endpoint.name} - VALID TOKEN: Failed! Endpoint denied access with valid token. Status: ${error.response?.status}, Message: ${error.message}`);
  }
}

/**
 * Run the comprehensive authentication test
 */
async function runAuthTest() {
  console.log('Starting Comprehensive Authentication Test');
  console.log('===========================================');
  console.log(`JWT_SECRET: ${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}`);
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    await testEndpointAuth(endpoint);
  }
  
  console.log('\n===========================================');
  console.log('Authentication Test Completed');
}

// Run the test
runAuthTest().catch(error => {
  console.error('Error running test:', error);
});