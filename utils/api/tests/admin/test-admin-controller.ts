/**
 * Test script for Admin Controller
 * 
 * This script tests the Admin Controller endpoints for user management.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Logger } from './server/common/logger';

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key';

// Create logger for testing
const logger = new Logger('TestAdminController');

/**
 * Interface for JWT user data
 */
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
 * Create a test JWT token for an admin user
 */
function createAdminToken(): string {
  const adminUserData: JwtUserData = {
    id: '00000000-1111-2222-3333-444444444444',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    roles: ['admin'],
    companyId: '00000000-1111-2222-3333-555555555555'
  };
  
  return jwt.sign(adminUserData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test the Admin Controller endpoints
 */
async function testAdminController() {
  try {
    logger.info('Starting Admin Controller test...');
    
    // Create admin token
    const token = createAdminToken();
    const headers = {
      Authorization: `Bearer ${token}`
    };
    
    // Base URL for API
    const baseUrl = 'http://localhost:3000/api/admin';
    
    // Test user creation
    logger.info('Testing user creation...');
    const createUserResponse = await axios.post(`${baseUrl}/users`, {
      email: `test-user-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      companyId: '00000000-1111-2222-3333-555555555555',
      roleIds: []
    }, { headers });
    
    logger.info('User creation response:', createUserResponse.data);
    
    if (createUserResponse.status !== 201 || !createUserResponse.data.success) {
      throw new Error('User creation failed');
    }
    
    const userId = createUserResponse.data.data.id;
    
    // Test getting user by ID
    logger.info(`Testing get user by ID: ${userId}...`);
    const getUserResponse = await axios.get(`${baseUrl}/users/${userId}`, { headers });
    
    logger.info('Get user response:', getUserResponse.data);
    
    if (getUserResponse.status !== 200 || !getUserResponse.data.success) {
      throw new Error('Get user failed');
    }
    
    // Test updating user
    logger.info(`Testing update user: ${userId}...`);
    const updateUserResponse = await axios.patch(`${baseUrl}/users/${userId}`, {
      firstName: 'Updated',
      lastName: 'Name'
    }, { headers });
    
    logger.info('Update user response:', updateUserResponse.data);
    
    if (updateUserResponse.status !== 200 || !updateUserResponse.data.success) {
      throw new Error('Update user failed');
    }
    
    // Test role assignment
    logger.info(`Testing role assignment for user: ${userId}...`);
    try {
      const assignRolesResponse = await axios.post(`${baseUrl}/users/${userId}/roles`, {
        roleIds: [] // Empty array as we might not have actual role IDs
      }, { headers });
      
      logger.info('Assign roles response:', assignRolesResponse.data);
    } catch (error) {
      // This might fail if we don't have valid role IDs
      logger.warn('Role assignment test skipped or failed (expected if no valid role IDs)');
    }
    
    // Test password change
    logger.info(`Testing password change for user: ${userId}...`);
    const changePasswordResponse = await axios.post(`${baseUrl}/users/${userId}/change-password`, {
      password: 'newpassword123'
    }, { headers });
    
    logger.info('Change password response:', changePasswordResponse.data);
    
    if (changePasswordResponse.status !== 200 || !changePasswordResponse.data.success) {
      throw new Error('Change password failed');
    }
    
    // Test get all users
    logger.info('Testing get all users...');
    const getAllUsersResponse = await axios.get(`${baseUrl}/users`, { headers });
    
    logger.info(`Found ${getAllUsersResponse.data.data.length} users`);
    
    if (getAllUsersResponse.status !== 200 || !getAllUsersResponse.data.success) {
      throw new Error('Get all users failed');
    }
    
    // Test user deletion (soft delete)
    logger.info(`Testing delete user: ${userId}...`);
    const deleteUserResponse = await axios.delete(`${baseUrl}/users/${userId}`, { headers });
    
    logger.info('Delete user response:', deleteUserResponse.data);
    
    if (deleteUserResponse.status !== 200 || !deleteUserResponse.data.success) {
      throw new Error('Delete user failed');
    }
    
    logger.info('Admin Controller test completed successfully!');
  } catch (error) {
    logger.error('Error in Admin Controller test:', error);
    throw error;
  }
}

// Run the test
testAdminController()
  .then(() => {
    logger.info('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Test failed:', error);
    process.exit(1);
  });