/**
 * Test script for creating and authenticating users with different roles
 * 
 * This script creates test users with different roles and tests their authentication.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  token?: string;
}

// Test user data with different roles
const TEST_USERS = [
  { username: 'admin', password: 'admin', email: 'admin@example.com', role: 'admin', firstName: 'Admin', lastName: 'User' },
  { username: 'contabil', password: 'contabil', email: 'contabil@example.com', role: 'accountant', firstName: 'Contabil', lastName: 'User' },
  { username: 'vanzari', password: 'vanzari', email: 'vanzari@example.com', role: 'sales', firstName: 'Vanzari', lastName: 'User' },
  { username: 'marketing', password: 'marketing', email: 'marketing@example.com', role: 'marketing', firstName: 'Marketing', lastName: 'User' },
  { username: 'gestionar', password: 'gestionar', email: 'gestionar@example.com', role: 'inventory', firstName: 'Gestionar', lastName: 'User' }
];

/**
 * Register a new user
 */
async function registerUser(userData: any): Promise<User> {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log(`✅ User ${userData.username} registered successfully`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message === 'Numele de utilizator există deja') {
      console.log(`⚠️ User ${userData.username} already exists, trying to login instead`);
      return loginUser(userData.username, userData.password);
    }
    console.error(`❌ Failed to register user ${userData.username}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Login user with username and password
 */
async function loginUser(username: string, password: string): Promise<User> {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    console.log(`✅ User ${username} logged in successfully`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ Failed to login user ${username}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify user authentication
 */
async function verifyAuthentication(token: string): Promise<any> {
  try {
    const response = await axios.get(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Authentication verification failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function testUserRoles() {
  console.log('Testing user creation with different roles...\n');
  
  const createdUsers: User[] = [];
  
  // Register all users
  for (const userData of TEST_USERS) {
    try {
      const user = await registerUser(userData);
      createdUsers.push(user);
    } catch (error) {
      console.error(`Failed to register ${userData.username}, continuing with next user`);
    }
  }
  
  console.log('\nVerifying authentication for each user...');
  
  // Verify authentication for each user
  for (const user of createdUsers) {
    if (!user.token) {
      console.log(`⚠️ No token available for user ${user.username}, skipping verification`);
      continue;
    }
    
    try {
      const authDetails = await verifyAuthentication(user.token);
      console.log(`\n✅ Authentication verified for ${user.username} with role: ${user.role}`);
      console.log(`   User details: ${JSON.stringify(authDetails.user, null, 2)}`);
    } catch (error) {
      console.error(`❌ Failed to verify authentication for ${user.username}`);
    }
  }
  
  console.log('\n🎉 User roles test completed!');
}

// Run the test
testUserRoles().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});