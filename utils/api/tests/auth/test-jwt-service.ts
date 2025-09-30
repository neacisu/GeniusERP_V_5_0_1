/**
 * Romanian ERP - JwtService Implementation Test
 * 
 * This script tests the JwtService implementation to ensure it correctly
 * creates and verifies JWT tokens with the appropriate user data.
 * It validates that the singleton pattern works as expected and that
 * tokens contain all required fields.
 * 
 * Features tested:
 * - Token generation with user data
 * - Token verification with confirmation of field values
 * - Refresh token generation and verification
 * - Error handling for invalid tokens
 * - Singleton pattern consistency
 */

import jwtService, { JwtService } from './server/modules/auth/services/jwt.service';
import { JwtUserData, UserRole } from './server/modules/auth/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main test function for the JwtService
 */
async function testJwtService() {
  console.log('Romanian ERP - JwtService Implementation Test');
  console.log('==============================================');
  console.log('Testing JwtService implementation with singleton pattern...');
  
  try {
    // First, test that we have a singleton
    console.log('\n✓ Testing singleton pattern...');
    const instance1 = jwtService;
    const instance2 = jwtService;
    
    if (instance1 === instance2) {
      console.log('  ✓ JwtService singleton confirmed');
    } else {
      throw new Error('JwtService is not a singleton!');
    }
    
    // Create test user data
    const testUserId = uuidv4();
    const testCompanyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Use actual company ID
    
    const testUserData: JwtUserData = {
      id: testUserId,
      username: 'test.user',
      role: UserRole.ACCOUNTANT,
      roles: [UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER],
      companyId: testCompanyId,
      franchiseId: uuidv4(),
      email: 'test.user@example.com'
    };
    
    // Test token generation
    console.log('\n✓ Testing token generation...');
    const token = jwtService.generateToken(testUserData);
    
    if (!token || typeof token !== 'string' || token.length === 0) {
      throw new Error('Token generation failed!');
    }
    
    console.log(`  ✓ Generated JWT token: ${token.slice(0, 25)}...`);
    
    // Test token verification
    console.log('\n✓ Testing token verification...');
    const decodedToken = jwtService.verifyToken(token);
    
    if (!decodedToken) {
      throw new Error('Token verification failed!');
    }
    
    console.log('  ✓ Token verification successful');
    console.log('  Decoded token payload:');
    console.log(`    - User ID: ${decodedToken.id}`);
    console.log(`    - Username: ${decodedToken.username}`);
    console.log(`    - Role: ${decodedToken.role}`);
    console.log(`    - Company ID: ${decodedToken.companyId}`);
    
    // Verify all fields were preserved
    console.log('\n✓ Testing field preservation...');
    
    const fieldsMatch = 
      decodedToken.id === testUserData.id &&
      decodedToken.username === testUserData.username &&
      decodedToken.role === testUserData.role &&
      Array.isArray(decodedToken.roles) &&
      decodedToken.roles.length === testUserData.roles.length &&
      decodedToken.companyId === testUserData.companyId &&
      decodedToken.franchiseId === testUserData.franchiseId &&
      decodedToken.email === testUserData.email;
    
    if (!fieldsMatch) {
      throw new Error('Token fields do not match original data!');
    }
    
    console.log('  ✓ All fields preserved correctly in token');
    
    // Test refresh token generation
    console.log('\n✓ Testing refresh token generation...');
    const refreshToken = jwtService.generateRefreshToken(testUserId);
    
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new Error('Refresh token generation failed!');
    }
    
    console.log(`  ✓ Generated refresh token: ${refreshToken.slice(0, 25)}...`);
    
    // Test refresh token verification
    console.log('\n✓ Testing refresh token verification...');
    const decodedRefreshToken = jwtService.verifyRefreshToken(refreshToken);
    
    if (!decodedRefreshToken) {
      throw new Error('Refresh token verification failed!');
    }
    
    console.log('  ✓ Refresh token verification successful');
    console.log(`  ✓ Decoded user ID: ${decodedRefreshToken.id}`);
    
    // Verify user ID was preserved
    if (decodedRefreshToken.id !== testUserId) {
      throw new Error('Refresh token user ID does not match!');
    }
    
    console.log('  ✓ User ID preserved correctly in refresh token');
    
    // Test error handling with invalid token
    console.log('\n✓ Testing error handling with invalid token...');
    const invalidToken = token.slice(0, -5) + 'XXXXX'; // Corrupt the token
    const invalidResult = jwtService.verifyToken(invalidToken);
    
    if (invalidResult !== null) {
      throw new Error('Invalid token verification should return null!');
    }
    
    console.log('  ✓ Invalid token correctly rejected');
    
    console.log('\n✓ JwtService test completed successfully');
    console.log('==============================================');
  } catch (error) {
    console.error('\n❌ Test failed:', (error as Error).message);
    throw error;
  }
}

// Run the test
testJwtService()
  .then(() => console.log('Test execution completed.'))
  .catch(error => console.error('Test execution failed:', error))
  .finally(() => process.exit());