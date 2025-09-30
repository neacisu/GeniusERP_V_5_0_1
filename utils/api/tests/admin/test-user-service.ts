/**
 * Test script for User Service
 * 
 * This script tests the UserService functionality including user creation,
 * update, role assignment, password verification, and user retrieval.
 */

import { getDrizzle } from './server/db';
import { UserService } from './server/modules/admin/services/user.service';
import { UserStatus } from './shared/schema/admin.schema';
import { v4 as uuidv4 } from 'uuid';

// Function to test user service features
async function testUserService() {
  try {
    console.log('Testing User Service...');
    
    // Connect to the database
    const db = getDrizzle();
    
    // Initialize the user service
    const userService = new UserService(db);
    
    // Generate a unique email to avoid collisions in tests
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    
    // Test user creation
    console.log(`Creating test user with email: ${uniqueEmail}`);
    const createUserParams = {
      email: uniqueEmail,
      password: 'Test@12345',
      firstName: 'Test',
      lastName: 'User',
      status: UserStatus.ACTIVE
    };
    
    const createdUser = await userService.createUser(createUserParams);
    console.log('User created successfully:', createdUser);
    
    // Test finding user by email
    console.log(`Finding user by email: ${uniqueEmail}`);
    const foundUserByEmail = await userService.findUserByEmail(uniqueEmail);
    console.log('Found user by email:', foundUserByEmail);
    
    // Test finding user by ID
    console.log(`Finding user by ID: ${createdUser.id}`);
    const foundUserById = await userService.findUserById(createdUser.id);
    console.log('Found user by ID:', foundUserById);
    
    // Test password verification
    console.log('Testing password verification...');
    const isPasswordValid = await userService.verifyPassword('Test@12345', createdUser.password);
    console.log('Password verification result:', isPasswordValid);
    
    // Test user update
    console.log('Updating user...');
    const updateUserParams = {
      firstName: 'Updated',
      lastName: 'User',
      email: uniqueEmail // Keep same email to avoid issues
    };
    
    const updatedUser = await userService.updateUser(createdUser.id, updateUserParams);
    console.log('Updated user:', updatedUser);
    
    // Test changing password
    console.log('Changing password...');
    const userWithNewPassword = await userService.changePassword(createdUser.id, 'NewPassword@123');
    console.log('Password changed successfully');
    
    // Verify new password
    const isNewPasswordValid = await userService.verifyPassword('NewPassword@123', userWithNewPassword.password);
    console.log('New password verification result:', isNewPasswordValid);
    
    // Test getting users with pagination
    console.log('Getting users with pagination...');
    const paginatedUsers = await userService.getUsers({
      page: 1,
      limit: 10,
      sortBy: 'created_at',
      sortDirection: 'desc'
    });
    console.log(`Retrieved ${paginatedUsers.data.length} users (Page 1 of ${paginatedUsers.pagination.totalPages})`);
    
    // Clean up the test user
    console.log('Deleting test user...');
    const deletedUser = await userService.deleteUser(createdUser.id);
    console.log('Test user deleted successfully');
    
    console.log('User Service tests completed successfully');
  } catch (error) {
    console.error('Error testing User Service:', error);
  }
}

// Execute the test
testUserService();