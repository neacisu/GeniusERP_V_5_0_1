/**
 * Comprehensive Auth Guard Test Script
 * 
 * This script tests the consolidated AuthGuard implementation, ensuring that 
 * both the static and instance methods work correctly.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtAuthMode } from './server/modules/auth/models/auth.enum';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';

interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

/**
 * Generate a test JWT token
 */
function createTestToken(data: Partial<JwtUserData> = {}): string {
  const defaultData: JwtUserData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    roles: ['user'],
    companyId: '123e4567-e89b-12d3-a456-426614174001',
  };

  // Merge default data with provided data
  const tokenData: JwtUserData = { ...defaultData, ...data };
  
  return jwt.sign(tokenData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test an endpoint with a specific token and log the result
 */
async function testEndpoint(
  endpoint: string, 
  token: string | null = null, 
  description: string,
  expectedStatus: number = 200
): Promise<void> {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers });
    
    const status = response.status;
    if (status === expectedStatus) {
      console.log(`✅ [PASS] ${description} - Status: ${status}`);
      console.log(`   Response:`, response.data);
    } else {
      console.log(`❌ [FAIL] ${description} - Expected status: ${expectedStatus}, Actual: ${status}`);
    }
  } catch (error: any) {
    const status = error.response?.status;
    if (status === expectedStatus) {
      console.log(`✅ [PASS] ${description} - Status: ${status}`);
      if (error.response?.data) console.log(`   Response:`, error.response.data);
    } else {
      console.log(`❌ [FAIL] ${description} - Expected status: ${expectedStatus}, Actual: ${status || 'unknown'}`);
      console.log(`   Error:`, error.response?.data || error.message);
    }
  }
}

/**
 * Run the comprehensive test suite
 */
async function runTests() {
  console.log('=== AuthGuard Comprehensive Test Suite ===');
  console.log('Testing against server at:', API_BASE_URL);
  console.log('');

  // Test 1: Public routes should work without auth
  await testEndpoint('/api/health', null, 'Public route works without auth', 200);
  
  // Test 2: Protected routes with static AuthGuard.protect()
  await testEndpoint('/api/settings/setup-placeholder', null, 'Protected route rejects without token', 401);
  
  const validToken = createTestToken();
  await testEndpoint('/api/settings/setup-placeholder', validToken, 'Protected route accepts valid token', 200);
  
  // Test 3: Protected routes with instance authGuard.requireAuth()
  await testEndpoint('/api/collab/tasks-placeholder', null, 'Instance protected route rejects without token', 401);
  await testEndpoint('/api/collab/tasks-placeholder', validToken, 'Instance protected route accepts valid token', 200);
  
  // Test 4: Roles checking
  const adminToken = createTestToken({ role: 'admin', roles: ['admin'] });
  const userToken = createTestToken({ role: 'user', roles: ['user'] });
  
  await testEndpoint('/api/admin/users-placeholder', userToken, 'Admin route rejects user token', 403);
  await testEndpoint('/api/admin/users-placeholder', adminToken, 'Admin route accepts admin token', 200);
  
  // Test 5: Company access checking
  const companyAToken = createTestToken({ companyId: 'company-a' });
  const companyBToken = createTestToken({ companyId: 'company-b' });
  
  await testEndpoint('/api/companies/company-a/resources', companyAToken, 'Company route accepts matching company', 200);
  await testEndpoint('/api/companies/company-a/resources', companyBToken, 'Company route rejects non-matching company', 403);
  await testEndpoint('/api/companies/company-b/resources', adminToken, 'Company route accepts admin for any company', 200);
  
  // Test 6: Permission checking
  const permissionToken = createTestToken({
    permissions: ['invoice:read', 'invoice:create']
  });
  
  await testEndpoint('/api/invoices/read', permissionToken, 'Permission route accepts with matching permission', 200);
  await testEndpoint('/api/invoices/approve', permissionToken, 'Permission route rejects with missing permission', 403);
  
  console.log('');
  console.log('=== Test Suite Completed ===');
}

// Run all tests
runTests()
  .then(() => {
    console.log('All tests completed.');
  })
  .catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });