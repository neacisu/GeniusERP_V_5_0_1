/**
 * Test script for authentication via username (non-email based login)
 * 
 * This script tests the authentication functionality using username and password
 * rather than email-based login.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';

// Load environment variables
dotenv.config();

// Create an axios instance for the API
const api = axios.create({
  baseURL: 'http://localhost:5000',
});

// Test data for user registration and login
const testUser = {
  username: `test_user_${uuid().substring(0, 6)}`,
  password: 'Test1234!',
  email: `testuser_${uuid().substring(0, 6)}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  role: 'user'
};

// Store token for authenticated requests
let authToken: string;

/**
 * Run the test
 */
async function testUsernamePasswordLogin() {
  console.log('Testing username/password authentication...');
  
  try {
    // Step 1: Register a new user
    console.log(`\nRegistering user with username: ${testUser.username}`);
    const registerResponse = await api.post('/api/auth/register', testUser);
    
    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.data)}`);
    }
    
    console.log('✅ User registration successful');
    console.log('User details:', {
      id: registerResponse.data.id,
      username: registerResponse.data.username,
      email: registerResponse.data.email,
    });
    
    // Extract token from registration response
    authToken = registerResponse.data.token;
    console.log('Received authentication token');
    
    // Step 2: Log out to clear session
    console.log('\nLogging out to clear session...');
    await api.post('/api/auth/logout', {}, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log('✅ Logout successful');
    
    // Step 3: Test login with username and password
    console.log('\nTesting login with username and password...');
    const loginResponse = await api.post('/api/auth/login', {
      username: testUser.username,
      password: testUser.password,
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login: ${JSON.stringify(loginResponse.data)}`);
    }
    
    // Update auth token
    authToken = loginResponse.data.token;
    console.log('✅ Login with username successful');
    
    // Step 4: Verify authentication by accessing protected endpoint
    console.log('\nVerifying authentication by accessing protected endpoint...');
    const verifyResponse = await api.get('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    if (verifyResponse.status !== 200) {
      throw new Error(`Failed to verify authentication: ${JSON.stringify(verifyResponse.data)}`);
    }
    
    console.log('✅ Authentication verification successful');
    console.log('Authentication details:', verifyResponse.data);
    
    // Step 5: Get current user info
    console.log('\nRetrieving current user info...');
    const userResponse = await api.get('/api/auth/user', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    if (userResponse.status !== 200) {
      throw new Error(`Failed to get user info: ${JSON.stringify(userResponse.data)}`);
    }
    
    console.log('✅ User info retrieved successfully');
    console.log('User info:', {
      id: userResponse.data.id,
      username: userResponse.data.username,
      email: userResponse.data.email,
      role: userResponse.data.role,
    });
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error: any) {
    console.error('❌ Authentication test failed:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    process.exit(1);
  }
}

// Execute the test
testUsernamePasswordLogin();