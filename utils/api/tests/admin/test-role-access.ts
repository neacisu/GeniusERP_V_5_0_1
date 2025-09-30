/**
 * Test script for role-based access control
 * 
 * This script tests whether different user roles can access appropriate endpoints.
 * Uses token-manager.js for token generation.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../'); // Project root directory

dotenv.config();

const API_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  roles: string[];
  token?: string;
}

interface EndpointTest {
  description: string;
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  data?: any;
  allowedRoles: string[];
}

// Test user roles to generate tokens for
const TEST_ROLES = [
  { role: 'admin', permissions: ['admin.read', 'admin.write', 'users.read', 'users.write'] },
  { role: 'accountant', permissions: ['accounting.read', 'accounting.write'] },
  { role: 'sales', permissions: ['sales.read', 'sales.write'] },
  { role: 'marketing', permissions: ['marketing.read', 'marketing.write'] },
  { role: 'inventory', permissions: ['inventory.read', 'inventory.write'] }
];

// Endpoints to test for different roles
const ENDPOINTS_TO_TEST: EndpointTest[] = [
  {
    description: 'Admin users list (admin only)',
    url: '/auth/users',
    method: 'get',
    allowedRoles: ['admin']
  },
  {
    description: 'User profile (all authenticated users)',
    url: '/auth/user',
    method: 'get',
    allowedRoles: ['admin', 'accountant', 'sales', 'marketing', 'inventory']
  },
  {
    description: 'Auth verification (all authenticated users)',
    url: '/auth/verify',
    method: 'get',
    allowedRoles: ['admin', 'accountant', 'sales', 'marketing', 'inventory']
  }
];

/**
 * Generate token for a specific role using token-manager.js
 */
async function generateTokenForRole(role: string, permissions: string[]): Promise<{ token: string, userData: User }> {
  try {
    console.log(`🔑 Generating token for role: ${role}`);
    
    // Use token-manager.js to generate a token
    const tokenFilePath = path.join(__dirname, `role-token-${role}.txt`);
    const tokenManagerPath = path.join(rootDir, 'utils/tokens/token-manager.js');
    
    // Construct the command with role-specific permissions
    const permissionsStr = permissions.join(',');
    const command = `node ${tokenManagerPath} generate --type auth --roles ${role} --permissions ${permissionsStr} --expiresIn 1h --output ${tokenFilePath}`;
    
    const { stdout, stderr } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      const child = spawn('bash', ['-c', command], { stdio: ['inherit', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0 || code === null) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Token generation failed with code ${code}: ${stderr}`));
        }
      });
    });
    
    // Check if token file was created
    if (!fs.existsSync(tokenFilePath)) {
      throw new Error('Token file was not created');
    }
    
    // Read the token from the file
    const token = fs.readFileSync(tokenFilePath, 'utf-8').trim();
    
    // Create a user object with the generated token
    const userId = `user-${role}-${Date.now()}`;
    const userData: User = {
      id: userId,
      username: `test.${role}`,
      role: role,
      roles: [role],
      token: token
    };
    
    console.log(`✅ Token generated for role ${role}`);
    
    return { token, userData };
  } catch (error: any) {
    console.error(`❌ Failed to generate token for role ${role}:`, error.message);
    throw error;
  }
}

/**
 * Test access to a specific endpoint
 */
async function testEndpointAccess(
  endpoint: EndpointTest,
  token: string,
  username: string,
  role: string
): Promise<boolean> {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    let response;
    if (endpoint.method === 'get') {
      response = await axios.get(`${API_URL}${endpoint.url}`, config);
    } else if (endpoint.method === 'post') {
      response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data || {}, config);
    } else if (endpoint.method === 'put') {
      response = await axios.put(`${API_URL}${endpoint.url}`, endpoint.data || {}, config);
    } else {
      response = await axios.delete(`${API_URL}${endpoint.url}`, config);
    }
    
    const shouldHaveAccess = endpoint.allowedRoles.includes(role);
    
    if (shouldHaveAccess) {
      console.log(`✅ ${username} (${role}) correctly has access to: ${endpoint.description}`);
    } else {
      console.log(`❌ UNEXPECTED: ${username} (${role}) should NOT have access to: ${endpoint.description}`);
    }
    
    return true;
  } catch (error: any) {
    const status = error.response?.status;
    const shouldHaveAccess = endpoint.allowedRoles.includes(role);
    
    if (status === 403 || status === 401) {
      if (shouldHaveAccess) {
        console.log(`❌ UNEXPECTED: ${username} (${role}) should have access to: ${endpoint.description}`);
      } else {
        console.log(`✅ ${username} (${role}) correctly denied access to: ${endpoint.description}`);
      }
    } else {
      console.error(`❌ Error testing ${username} (${role}) access to ${endpoint.description}:`, error.response?.data || error.message);
    }
    
    return false;
  }
}

/**
 * Main test function
 */
async function testRoleBasedAccess() {
  console.log('Testing role-based access control...\n');
  
  // Generate tokens for all roles
  const usersWithTokens: User[] = [];
  
  for (const roleConfig of TEST_ROLES) {
    try {
      const { userData } = await generateTokenForRole(roleConfig.role, roleConfig.permissions);
      usersWithTokens.push(userData);
      console.log(`✅ Generated token for role: ${roleConfig.role}`);
    } catch (error) {
      console.error(`Failed to generate token for role ${roleConfig.role}, continuing with next role`);
    }
  }
  
  if (usersWithTokens.length === 0) {
    throw new Error('Could not generate any tokens for testing');
  }
  
  console.log('\nTesting endpoint access for each user role...');
  
  // Test each endpoint with each user role
  for (const user of usersWithTokens) {
    console.log(`\n📝 Testing access for ${user.username} (${user.role}):`);
    
    for (const endpoint of ENDPOINTS_TO_TEST) {
      await testEndpointAccess(endpoint, user.token!, user.username, user.role);
    }
  }
  
  console.log('\n🎉 Role-based access control test completed!');
}

// Run the test
testRoleBasedAccess().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});