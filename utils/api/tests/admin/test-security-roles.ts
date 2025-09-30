/**
 * Test script for RBAC Security in Inventory Module
 *
 * This script tests that Role-Based Access Control (RBAC) is correctly
 * implemented in the inventory module endpoints. It verifies that:
 * 1. Regular users cannot access protected endpoints
 * 2. Users with inventory_manager role can access protected endpoints
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Common interface for JWT user data
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

// Generate a token for a user with inventory_manager role
function createInventoryManagerToken(): string {
  const userData: JwtUserData = {
    id: '12345678-1234-1234-1234-123456789012',
    username: 'inventory_manager',
    email: 'inventory@example.com',
    role: 'inventory_manager',
    roles: ['inventory_manager'],
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  console.log('Creating token for inventory_manager with roles:', userData.roles);
  
  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Generate a token for a regular user without inventory permissions
function createRegularUserToken(): string {
  const userData: JwtUserData = {
    id: '12345678-5555-5555-5555-123456789012',
    username: 'regular_user',
    email: 'user@example.com',
    role: 'user',
    roles: ['user'],
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  console.log('Creating token for regular_user with roles:', userData.roles);
  
  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Helper function to make HTTP requests
async function makeRequest(url: string, method: string, token: string, data?: any): Promise<any> {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (method.toLowerCase() === 'get') {
      const response = await axios.get(url, config);
      return { success: true, status: response.status, data: response.data };
    } else if (method.toLowerCase() === 'post') {
      const response = await axios.post(url, data, config);
      return { success: true, status: response.status, data: response.data };
    } else if (method.toLowerCase() === 'put') {
      const response = await axios.put(url, data, config);
      return { success: true, status: response.status, data: response.data };
    } else if (method.toLowerCase() === 'delete') {
      const response = await axios.delete(url, config);
      return { success: true, status: response.status, data: response.data };
    }
    
    throw new Error(`Unsupported method: ${method}`);
  } catch (error: any) {
    return { 
      success: false, 
      status: error.response?.status || 500,
      data: error.response?.data,
      message: error.message
    };
  }
}

// RBAC Test Battery
async function testRbacSecurity() {
  console.log('🔒 Testing Role-Based Access Control for Inventory Module');
  console.log('===========================================================');
  
  // Use the direct Node.js API port to bypass Vite in development mode
  console.log('Checking API endpoint...');
  try {
    // Try to use the default port first
    await axios.options('http://localhost:5000/api/v1/inventory');
    console.log('Using standard port: 5000');
    var baseUrl = 'http://localhost:5000/api/v1/inventory';
  } catch (e) {
    // If that fails, try the Express port in Replit development setup
    console.log('Trying alternate Express port: 3001');
    var baseUrl = 'http://localhost:3001/api/v1/inventory';
  }
  const tokens = {
    manager: createInventoryManagerToken(),
    user: createRegularUserToken()
  };
  
  // Test 1: Create Warehouse Endpoint (Protected)
  console.log('\n🧪 TEST 1: CREATE WAREHOUSE ENDPOINT');
  console.log('----------------------------------------------------------');
  
  const warehouseData = {
    name: 'Test Security Warehouse',
    code: 'TSW-001',
    location: 'Bucharest',
    type: 'depozit',
    is_active: true
  };
  
  // Test 1.1: Regular user should be denied
  console.log('👤 Testing with regular user (should be denied)');
  const test1_1 = await makeRequest(`${baseUrl}/warehouse`, 'post', tokens.user, warehouseData);
  
  if (test1_1.status === 403) {
    console.log('✅ PASS: Regular user correctly denied with 403 Forbidden');
  } else {
    console.log(`❌ FAIL: Expected 403, got ${test1_1.status}`);
    console.log('Response:', JSON.stringify(test1_1.data, null, 2));
  }
  
  // Test 1.2: Inventory manager should be allowed
  console.log('\n👤 Testing with inventory manager (should be allowed)');
  const test1_2 = await makeRequest(`${baseUrl}/warehouse`, 'post', tokens.manager, warehouseData);
  
  if (test1_2.success && test1_2.status === 201) {
    console.log('✅ PASS: Inventory manager successfully created warehouse');
    console.log('Warehouse ID:', test1_2.data.warehouse?.id);
  } else {
    console.log(`❌ FAIL: Expected successful creation, got status ${test1_2.status}`);
    console.log('Response:', JSON.stringify(test1_2.data, null, 2));
  }
  
  // Store the warehouse ID for subsequent tests if creation was successful
  const warehouseId = test1_2.data?.warehouse?.id;
  
  if (!warehouseId) {
    console.log('❌ Cannot continue tests without a valid warehouse ID');
    return;
  }
  
  // Test 2: Update Warehouse Endpoint (Protected)
  console.log('\n🧪 TEST 2: UPDATE WAREHOUSE ENDPOINT');
  console.log('----------------------------------------------------------');
  
  const updateData = {
    name: 'Updated Security Warehouse',
    location: 'Cluj'
  };
  
  // Test 2.1: Regular user should be denied
  console.log('👤 Testing with regular user (should be denied)');
  const test2_1 = await makeRequest(`${baseUrl}/warehouse/${warehouseId}`, 'put', tokens.user, updateData);
  
  if (test2_1.status === 403) {
    console.log('✅ PASS: Regular user correctly denied with 403 Forbidden');
  } else {
    console.log(`❌ FAIL: Expected 403, got ${test2_1.status}`);
    console.log('Response:', JSON.stringify(test2_1.data, null, 2));
  }
  
  // Test 2.2: Inventory manager should be allowed
  console.log('\n👤 Testing with inventory manager (should be allowed)');
  const test2_2 = await makeRequest(`${baseUrl}/warehouse/${warehouseId}`, 'put', tokens.manager, updateData);
  
  if (test2_2.success && (test2_2.status === 200 || test2_2.status === 204)) {
    console.log('✅ PASS: Inventory manager successfully updated warehouse');
  } else {
    console.log(`❌ FAIL: Expected successful update, got status ${test2_2.status}`);
    console.log('Response:', JSON.stringify(test2_2.data, null, 2));
  }
  
  // Test 3: Deactivate Warehouse Endpoint (Protected)
  console.log('\n🧪 TEST 3: DEACTIVATE WAREHOUSE ENDPOINT');
  console.log('----------------------------------------------------------');
  
  // Test 3.1: Regular user should be denied
  console.log('👤 Testing with regular user (should be denied)');
  const test3_1 = await makeRequest(`${baseUrl}/warehouse/${warehouseId}`, 'delete', tokens.user);
  
  if (test3_1.status === 403) {
    console.log('✅ PASS: Regular user correctly denied with 403 Forbidden');
  } else {
    console.log(`❌ FAIL: Expected 403, got ${test3_1.status}`);
    console.log('Response:', JSON.stringify(test3_1.data, null, 2));
  }
  
  // Test 3.2: Inventory manager should be allowed
  console.log('\n👤 Testing with inventory manager (should be allowed)');
  const test3_2 = await makeRequest(`${baseUrl}/warehouse/${warehouseId}`, 'delete', tokens.manager);
  
  if (test3_2.success && (test3_2.status === 200 || test3_2.status === 204)) {
    console.log('✅ PASS: Inventory manager successfully deactivated warehouse');
  } else {
    console.log(`❌ FAIL: Expected successful deactivation, got status ${test3_2.status}`);
    console.log('Response:', JSON.stringify(test3_2.data, null, 2));
  }
  
  // Test 4: Read Endpoints (Unprotected - both users should have access)
  console.log('\n🧪 TEST 4: READ ENDPOINTS (BOTH USERS SHOULD HAVE ACCESS)');
  console.log('----------------------------------------------------------');
  
  // Test 4.1: Regular user access to warehouse list
  console.log('👤 Testing warehouse list with regular user (should be allowed)');
  const test4_1 = await makeRequest(`${baseUrl}/warehouses`, 'get', tokens.user);
  
  if (test4_1.success && (test4_1.status === 200)) {
    console.log('✅ PASS: Regular user can access warehouse list');
  } else {
    console.log(`❌ FAIL: Expected 200, got ${test4_1.status}`);
    console.log('Response:', JSON.stringify(test4_1.data, null, 2));
  }
  
  // Test 4.2: Inventory manager access to warehouse list
  console.log('\n👤 Testing warehouse list with inventory manager (should be allowed)');
  const test4_2 = await makeRequest(`${baseUrl}/warehouses`, 'get', tokens.manager);
  
  if (test4_2.success && (test4_2.status === 200)) {
    console.log('✅ PASS: Inventory manager can access warehouse list');
  } else {
    console.log(`❌ FAIL: Expected 200, got ${test4_2.status}`);
    console.log('Response:', JSON.stringify(test4_2.data, null, 2));
  }
  
  console.log('\n🔒 RBAC SECURITY TESTING COMPLETED');
  console.log('===========================================================');
}

// Run the tests
testRbacSecurity().catch(console.error);