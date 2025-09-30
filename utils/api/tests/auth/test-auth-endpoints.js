/**
 * Authentication Endpoint Testing Script
 * 
 * This script tests all API endpoints for proper authentication behavior after migration.
 * It verifies:
 * 1. Endpoints return 401 Unauthorized without authentication
 * 2. Endpoints return proper response with valid authentication
 * 3. Role-based authorization is working correctly
 */

import jwt from 'jsonwebtoken';
// Use axios instead of node-fetch as axios is already installed
import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret'; // Use same default as auth.service.ts

// Test different user roles
const USERS = {
  admin: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    username: 'admin_user',
    email: 'admin@example.com',
    role: 'admin',
    roles: ['admin'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  marketing: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    username: 'marketing_user',
    email: 'marketing@example.com',
    role: 'marketing',
    roles: ['marketing'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  accountant: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    username: 'accounting_user',
    email: 'accounting@example.com',
    role: 'accountant',
    roles: ['accountant'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  sales: {
    id: '123e4567-e89b-12d3-a456-426614174004',
    username: 'sales_user',
    email: 'sales@example.com',
    role: 'sales',
    roles: ['sales'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  hr: {
    id: '123e4567-e89b-12d3-a456-426614174005',
    username: 'hr_user',
    email: 'hr@example.com',
    role: 'hr',
    roles: ['hr'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  inventory: {
    id: '123e4567-e89b-12d3-a456-426614174006',
    username: 'inventory_user',
    email: 'inventory@example.com',
    role: 'inventory',
    roles: ['inventory'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  warehouse: {
    id: '123e4567-e89b-12d3-a456-426614174007',
    username: 'warehouse_user',
    email: 'warehouse@example.com',
    role: 'warehouse',
    roles: ['warehouse'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  manager: {
    id: '123e4567-e89b-12d3-a456-426614174008',
    username: 'manager_user',
    email: 'manager@example.com',
    role: 'manager',
    roles: ['manager'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  employee: {
    id: '123e4567-e89b-12d3-a456-426614174009',
    username: 'employee_user',
    email: 'employee@example.com',
    role: 'employee',
    roles: ['employee'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  customer_service: {
    id: '123e4567-e89b-12d3-a456-426614174010',
    username: 'cs_user',
    email: 'cs@example.com',
    role: 'customer_service',
    roles: ['customer_service'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  developer: {
    id: '123e4567-e89b-12d3-a456-426614174011',
    username: 'developer_user',
    email: 'developer@example.com',
    role: 'developer',
    roles: ['developer'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  },
  payroll: {
    id: '123e4567-e89b-12d3-a456-426614174012',
    username: 'payroll_user',
    email: 'payroll@example.com',
    role: 'payroll',
    roles: ['payroll'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  }
};

// Define endpoints to test by module
const ENDPOINTS = [
  // Marketing module endpoints
  { module: 'marketing', path: '/api/marketing/campaigns', method: 'GET', requiredRoles: ['admin', 'marketing'] },
  { module: 'marketing', path: '/api/marketing/segments', method: 'GET', requiredRoles: ['admin', 'marketing'] },
  { module: 'marketing', path: '/api/marketing/templates', method: 'GET', requiredRoles: ['admin', 'marketing'] },
  
  // Invoices module endpoints
  { module: 'invoices', path: '/api/invoices', method: 'GET', requiredRoles: ['admin', 'accountant'] },
  { module: 'invoices', path: '/api/invoices/drafts', method: 'GET', requiredRoles: ['admin', 'accountant'] },
  
  // Accounting module endpoints
  { module: 'accounting', path: '/api/accounting/journals', method: 'GET', requiredRoles: ['admin', 'accountant'] },
  { module: 'accounting', path: '/api/accounting/ledger', method: 'GET', requiredRoles: ['admin', 'accountant'] },
  
  // CRM module endpoints
  { module: 'crm', path: '/api/crm/contacts', method: 'GET', requiredRoles: ['admin', 'sales'] },
  { module: 'crm', path: '/api/crm/deals', method: 'GET', requiredRoles: ['admin', 'sales'] },
  
  // HR module endpoints
  { module: 'hr', path: '/api/hr/employees', method: 'GET', requiredRoles: ['admin', 'hr'] },
  { module: 'hr', path: '/api/hr/payroll', method: 'GET', requiredRoles: ['admin', 'hr', 'payroll'] },
  
  // Inventory module endpoints
  { module: 'inventory', path: '/api/inventory/warehouses', method: 'GET', requiredRoles: ['admin', 'inventory', 'warehouse'] },
  { module: 'inventory', path: '/api/inventory/stock', method: 'GET', requiredRoles: ['admin', 'inventory'] },
  
  // Documents module endpoints
  { module: 'documents', path: '/api/documents', method: 'GET', requiredRoles: ['admin', 'manager'] },
  { module: 'documents', path: '/api/documents/versions', method: 'GET', requiredRoles: ['admin', 'manager'] },
  
  // E-commerce module endpoints
  { module: 'ecommerce', path: '/api/ecommerce/products', method: 'GET', requiredRoles: ['admin', 'sales'] },
  { module: 'ecommerce', path: '/api/ecommerce/orders', method: 'GET', requiredRoles: ['admin', 'sales'] },
  
  // Settings module endpoints
  { module: 'settings', path: '/api/settings/company', method: 'GET', requiredRoles: ['admin'] },
  { module: 'settings', path: '/api/settings/preferences', method: 'GET', requiredRoles: ['admin', 'manager'] },
  
  // BPM module endpoints
  { module: 'bpm', path: '/api/bpm/processes', method: 'GET', requiredRoles: ['admin', 'manager'] },
  { module: 'bpm', path: '/api/bpm/workflows', method: 'GET', requiredRoles: ['admin', 'manager'] },
  
  // Collaboration module endpoints
  { module: 'collab', path: '/api/collab/tasks', method: 'GET', requiredRoles: ['admin', 'manager', 'employee'] },
  { module: 'collab', path: '/api/collab/comments', method: 'GET', requiredRoles: ['admin', 'manager', 'employee'] },
  
  // AI module endpoints
  { module: 'ai', path: '/api/ai/sales-assistant', method: 'GET', requiredRoles: ['admin', 'sales'] },
  { module: 'ai', path: '/api/ai/inbox-assistant', method: 'GET', requiredRoles: ['admin', 'customer_service'] },
  
  // Admin module endpoints
  { module: 'admin', path: '/api/admin/users', method: 'GET', requiredRoles: ['admin'] },
  { module: 'admin', path: '/api/admin/roles', method: 'GET', requiredRoles: ['admin'] },
  
  // Integrations module endpoints
  { module: 'integrations', path: '/api/integrations', method: 'GET', requiredRoles: ['admin', 'developer'] },
  { module: 'integrations', path: '/api/integrations/connections', method: 'GET', requiredRoles: ['admin', 'developer'] }
];

/**
 * Generate a JWT token for a specific user role
 */
function generateToken(userRole) {
  const user = USERS[userRole];
  if (!user) {
    throw new Error(`Unknown user role: ${userRole}`);
  }
  
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test an endpoint with no authentication
 */
async function testUnauthenticated(endpoint) {
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.path}`,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return true; // Always return true to handle all status codes
      }
    });
    
    const success = response.status === 401;
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: response.status,
      expected: 401,
      success,
      authenticationType: 'none'
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      error: error.message,
      success: false,
      authenticationType: 'none'
    };
  }
}

/**
 * Test an endpoint with user authentication
 */
async function testAuthenticated(endpoint, userRole) {
  try {
    const token = generateToken(userRole);
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.path}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return true; // Always return true to handle all status codes
      }
    });
    
    // Check if the user should have access
    const hasRequiredRole = endpoint.requiredRoles.includes(userRole) || 
                           (userRole === 'admin') || // Admin can access everything
                           endpoint.requiredRoles.some(role => USERS[userRole].roles.includes(role));
    
    const expectedStatus = hasRequiredRole ? 200 : 403;
    const success = response.status === expectedStatus;
    
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      userRole,
      status: response.status,
      expected: expectedStatus,
      success,
      authenticationType: 'jwt'
    };
  } catch (error) {
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      userRole,
      error: error.message,
      success: false,
      authenticationType: 'jwt'
    };
  }
}

/**
 * Test all endpoints
 */
async function testAllEndpoints() {
  const results = {
    unauthenticated: [],
    authenticated: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      moduleResults: {}
    }
  };
  
  // Initialize module results
  for (const endpoint of ENDPOINTS) {
    if (!results.summary.moduleResults[endpoint.module]) {
      results.summary.moduleResults[endpoint.module] = {
        total: 0,
        passed: 0,
        failed: 0
      };
    }
  }
  
  // Test unauthenticated access
  console.log('Testing unauthenticated access...');
  for (const endpoint of ENDPOINTS) {
    const result = await testUnauthenticated(endpoint);
    results.unauthenticated.push(result);
    
    results.summary.total++;
    results.summary.moduleResults[endpoint.module].total++;
    
    if (result.success) {
      results.summary.passed++;
      results.summary.moduleResults[endpoint.module].passed++;
    } else {
      results.summary.failed++;
      results.summary.moduleResults[endpoint.module].failed++;
    }
    
    console.log(`${result.method} ${result.endpoint} - ${result.success ? 'PASS' : 'FAIL'} (${result.status})`);
  }
  
  // Test authenticated access for each user role
  console.log('\nTesting authenticated access...');
  for (const userRole of Object.keys(USERS)) {
    console.log(`\nTesting as ${userRole}...`);
    
    for (const endpoint of ENDPOINTS) {
      const result = await testAuthenticated(endpoint, userRole);
      results.authenticated.push(result);
      
      results.summary.total++;
      results.summary.moduleResults[endpoint.module].total++;
      
      if (result.success) {
        results.summary.passed++;
        results.summary.moduleResults[endpoint.module].passed++;
      } else {
        results.summary.failed++;
        results.summary.moduleResults[endpoint.module].failed++;
      }
      
      console.log(`${result.method} ${result.endpoint} - ${result.success ? 'PASS' : 'FAIL'} (${result.status})`);
    }
  }
  
  return results;
}

// Run the tests
console.log('Starting endpoint authentication tests...');
testAllEndpoints().then(results => {
  console.log('\n======= TEST SUMMARY =======');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(2)}%`);
  
  console.log('\n======= MODULE RESULTS =======');
  for (const [module, stats] of Object.entries(results.summary.moduleResults)) {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`${module}: ${stats.passed}/${stats.total} (${successRate}%)`);
  }
  
  // Write full results to file
  fs.writeFileSync('auth-test-results.json', JSON.stringify(results, null, 2));
  console.log('\nFull test results written to auth-test-results.json');
});