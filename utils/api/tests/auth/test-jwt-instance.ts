/**
 * JWT Test Instance Token Generator
 * 
 * This script demonstrates using our JwtService singleton instance
 * to generate a valid JWT for testing protected routes.
 */

import jwtService from './server/modules/auth/services/jwt.service';
import { UserRole } from './server/modules/auth/types';

/**
 * Create a sample token using the JwtService instance
 */
async function generateInstanceToken() {
  // Test user data
  const userData = {
    id: '123456',
    username: 'testuser',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN, UserRole.FINANCE_MANAGER],
    companyId: 'company-123'
  };
  
  try {
    // Generate token using the instance
    const token = jwtService.generateToken(userData);
    console.log('\nToken generated using JwtService instance:');
    console.log(token);
    
    // Verify token
    const verified = jwtService.verifyToken(token);
    console.log('\nToken verification result:');
    console.log(JSON.stringify(verified, null, 2));
    
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('==== Testing JwtService Instance ====');
    await generateInstanceToken();
    console.log('\nJWT token generation successful!');
    console.log('Use this token in the Authorization header with the format:');
    console.log('Bearer <token>');
    console.log('\nExample curl command:');
    console.log('curl -H "Authorization: Bearer <token>" http://localhost:3000/api/examples/protected');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
main().catch(console.error);