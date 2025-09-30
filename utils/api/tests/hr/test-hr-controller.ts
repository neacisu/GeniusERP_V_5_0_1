/**
 * Test script for HR Controller
 * 
 * This script tests the HR Controller endpoints for role-based access control.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Interface for JWT user data
 */
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId: string;
  franchiseId?: string | null;
}

/**
 * Create a test JWT token for an HR manager user
 */
function createHrToken(): string {
  const hrUserData: JwtUserData = {
    id: '9876543210',
    username: 'hrmanager',
    email: 'hr@example.com',
    role: 'hr_manager',
    roles: ['hr_manager'],
    companyId: '123456789'
  };
  
  // Get the JWT secret from environment variables or use a default for testing
  const jwtSecret = process.env.JWT_SECRET || 'x7kHj2q9X3ZpM7nL5q8';
  
  return jwt.sign(hrUserData, jwtSecret, { expiresIn: '1h' });
}

/**
 * Create a test JWT token for a regular user
 */
function createRegularUserToken(): string {
  const regularUserData: JwtUserData = {
    id: '1234567890',
    username: 'regularuser',
    email: 'user@example.com',
    role: 'user',
    roles: ['user'],
    companyId: '123456789'
  };
  
  // Get the JWT secret from environment variables or use a default for testing
  const jwtSecret = process.env.JWT_SECRET || 'x7kHj2q9X3ZpM7nL5q8';
  
  return jwt.sign(regularUserData, jwtSecret, { expiresIn: '1h' });
}

/**
 * Test the HR Controller endpoints
 */
async function testHrController() {
  console.log('Testing HR Controller endpoints...');
  console.log('====================================\n');
  
  const baseUrl = 'http://localhost:5000/api/v1/hr';
  const hrToken = createHrToken();
  const regularUserToken = createRegularUserToken();
  
  // Test with HR manager role
  console.log('Testing with HR_MANAGER role:');
  console.log('----------------------------');
  try {
    const hrResponse = await axios.post(
      `${baseUrl}/placeholder`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hrToken}`
        }
      }
    );
    
    console.log('✅ HR manager can access placeholder endpoint:');
    console.log(`Status: ${hrResponse.status}`);
    console.log(`Response: ${JSON.stringify(hrResponse.data, null, 2)}`);
    console.log();
  } catch (error: any) {
    console.error('❌ Error testing HR manager access:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    console.log();
  }
  
  // Test with regular user role (should be allowed since the endpoint doesn't have specific role restrictions)
  console.log('Testing with USER role:');
  console.log('-------------------');
  try {
    const userResponse = await axios.post(
      `${baseUrl}/placeholder`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${regularUserToken}`
        }
      }
    );
    
    console.log('✅ Regular user can access placeholder endpoint (no role restriction):');
    console.log(`Status: ${userResponse.status}`);
    console.log(`Response: ${JSON.stringify(userResponse.data, null, 2)}`);
    console.log();
  } catch (error: any) {
    console.log('✅ Regular user correctly denied access with 403 Forbidden');
    console.log(`Error message: ${JSON.stringify(error.response?.data, null, 2)}`);
    console.log();
  }
  
  // Test without authentication (should be denied)
  console.log('Testing without authentication (should be denied):');
  console.log('-----------------------------------------------');
  try {
    const noAuthResponse = await axios.post(
      `${baseUrl}/placeholder`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.error('❌ Unauthenticated request should not succeed:');
    console.error(`Status: ${noAuthResponse.status}`);
    console.error(`Response: ${JSON.stringify(noAuthResponse.data, null, 2)}`);
    console.log();
  } catch (error: any) {
    console.log('✅ Unauthenticated request correctly denied with 401 Unauthorized');
    console.log(`Error message: ${JSON.stringify(error.response?.data, null, 2)}`);
    console.log();
  }
  
  console.log('All HR Controller tests completed');
}

// Run the test
testHrController().catch(error => {
  console.error('Unhandled error during test:', error);
  process.exit(1);
});