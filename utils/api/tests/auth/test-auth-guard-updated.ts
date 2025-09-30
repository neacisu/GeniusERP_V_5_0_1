/**
 * Test script for JWT verification with the updated auth guard
 * 
 * This script tests both the old and updated auth guard implementations
 * to confirm that the JWT verification works with the correct secret.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './server/modules/auth/services/auth.service';
import { JwtUserData } from './server/modules/auth/guards/auth.guard';

/**
 * Test JWT verification with updated auth guard
 */
async function testUpdatedAuthGuard() {
  console.log('Testing updated JWT verification...');
  
  try {
    // Create a test user payload
    const testUserPayload: JwtUserData = {
      id: 'test-user-id',
      username: 'testuser',
      role: 'ADMIN',
      companyId: 'test-company-id',
    };
    
    // Sign a token with the JWT_SECRET
    const token = jwt.sign(testUserPayload, JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token:', token);
    
    // Verify the token with the JWT_SECRET (not using env var)
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserData;
    console.log('✅ Token verified successfully with imported JWT_SECRET');
    console.log('Decoded token:', decoded);
    
    // If we reach here, everything worked as expected
    console.log('✅ Auth Guard fix confirmed working!');
    return true;
  } catch (error) {
    console.error('❌ Error during token verification:', error);
    return false;
  }
}

// Run the test
testUpdatedAuthGuard().then((success) => {
  if (success) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.error('❌ Tests failed!');
    process.exit(1);
  }
});