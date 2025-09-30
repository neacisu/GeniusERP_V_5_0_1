/**
 * Comprehensive Test for All Module Placeholder Endpoints
 * 
 * This script systematically tests all placeholder endpoints for each module
 * to ensure they are properly connected, protected with JWT auth, and ready
 * for business logic integration.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { setTimeout } from 'timers/promises';

// Define the JWT user data structure
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

// Define module endpoint structure
interface ModuleEndpoint {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
}

/**
 * Create a test JWT token
 */
function createTestToken(): string {
  const testUserData: JwtUserData = {
    id: '12345',
    username: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN',
    roles: ['ADMIN', 'USER'],
    companyId: 'c23e4567-e89b-12d3-a456-426614174000' // Test Company SRL
  };

  // Get JWT secret from environment, or use default for testing
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
  
  // Create token with 1 hour expiration
  return jwt.sign(testUserData, jwtSecret, { expiresIn: '1h' });
}

/**
 * Test all placeholder endpoints
 */
async function testAllPlaceholderEndpoints() {
  const token = createTestToken();
  const baseUrl = 'http://localhost:5000/api';
  
  // Define all module endpoints to test
  const endpoints: ModuleEndpoint[] = [
    { name: 'Sales', endpoint: '/api/v1/sales/placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'HR', endpoint: '/api/v1/hr/placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'E-commerce', endpoint: '/api/v1/ecommerce/order-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'Marketing', endpoint: '/api/v1/marketing/campaign-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'Integrations', endpoint: '/api/v1/integrations/activate-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'BPM', endpoint: '/api/v1/bpm/process-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'Collaboration', endpoint: '/api/v1/collab/task-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'AI', endpoint: '/api/v1/ai/report-placeholder', method: 'POST', data: { test: 'data' } },
    { name: 'Settings', endpoint: '/api/v1/settings/setup-placeholder', method: 'POST', data: { test: 'data' } }
  ];
  
  console.log('=== Testing All Module Placeholder Endpoints ===');
  console.log(`Using token: ${token.substring(0, 20)}...`);
  console.log('------------------------------------------------');
  
  // Results tracking
  const results = {
    passed: [] as string[],
    failed: [] as { module: string, reason: string }[]
  };
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name} module: ${endpoint.endpoint}`);
    
    try {
      // Test with valid auth
      const response = await axios({
        method: endpoint.method,
        url: `${baseUrl}${endpoint.endpoint}`,
        data: endpoint.data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${endpoint.name} response (${response.status}):`, JSON.stringify(response.data, null, 2));
      results.passed.push(endpoint.name);
      
      // Test without authorization (expected to fail with 401)
      try {
        await axios({
          method: endpoint.method,
          url: `${baseUrl}${endpoint.endpoint}`,
          data: endpoint.data
        });
        console.log(`⚠️ ${endpoint.name} auth check FAILED: Endpoint did not reject unauthorized request`);
        results.failed.push({ module: endpoint.name, reason: 'Missing auth protection' });
      } catch (authError: any) {
        if (authError.response?.status === 401) {
          console.log(`✅ ${endpoint.name} auth check passed: Rejected unauthorized request with 401`);
        } else {
          console.log(`⚠️ ${endpoint.name} auth check unexpected error:`, authError.message);
        }
      }
    } catch (error: any) {
      console.log(`❌ ${endpoint.name} test FAILED:`);
      
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Data:`, error.response.data);
        
        if (error.response.status === 404) {
          results.failed.push({ module: endpoint.name, reason: 'Endpoint not found (404)' });
        } else if (error.response.status === 401) {
          results.failed.push({ module: endpoint.name, reason: 'Authentication failed (401)' });
        } else {
          results.failed.push({ module: endpoint.name, reason: `Error (${error.response.status})` });
        }
      } else {
        console.log(`Error: ${error.message}`);
        results.failed.push({ module: endpoint.name, reason: error.message });
      }
    }
    
    // Small delay to avoid overwhelming the server
    await setTimeout(100);
  }
  
  // Print summary
  console.log('\n=== Endpoint Test Summary ===');
  console.log(`Passed: ${results.passed.length}/${endpoints.length}`);
  
  if (results.passed.length > 0) {
    console.log('\nModules with working endpoints:');
    results.passed.forEach(module => console.log(`✅ ${module}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\nModules with issues:');
    results.failed.forEach(failure => console.log(`❌ ${failure.module}: ${failure.reason}`));
  }
}

// Run the tests
testAllPlaceholderEndpoints();