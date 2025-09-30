/**
 * Test script for JWT verification using the correct secret
 * 
 * This script tests JWT verification with the token to ensure
 * it's working properly with the correct JWT_SECRET.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET as AUTH_SERVICE_JWT_SECRET } from './server/modules/auth/services/auth.service';
import fs from 'fs';

/**
 * Test JWT verification with the correct secret
 */
async function testJwtVerification() {
  // Get the actual JWT_SECRET that's being used in the AuthGuard
  const JWT_SECRET = process.env.JWT_SECRET || AUTH_SERVICE_JWT_SECRET;
  
  console.log('Testing JWT verification with the token...');
  console.log('AuthService JWT_SECRET:', AUTH_SERVICE_JWT_SECRET.substring(0, 3) + '...' + AUTH_SERVICE_JWT_SECRET.substring(AUTH_SERVICE_JWT_SECRET.length - 3));
  console.log('Actual JWT_SECRET used:', JWT_SECRET.substring(0, 3) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 3));
  
  try {
    // Read token from file
    const token = fs.readFileSync('app-token.txt', 'utf-8').trim();
    console.log('Token from file:', token.substring(0, 20) + '...');
    
    // Try to verify the token with both JWT_SECRET values
    try {
      console.log('\nVerifying with AUTH_SERVICE_JWT_SECRET:');
      const decoded1 = jwt.verify(token, AUTH_SERVICE_JWT_SECRET);
      console.log('✅ Verification successful with AUTH_SERVICE_JWT_SECRET!');
      
      console.log('\nVerifying with actual JWT_SECRET:');
      const decoded2 = jwt.verify(token, JWT_SECRET);
      console.log('✅ Verification successful with actual JWT_SECRET!');
      
      console.log('\nDecoded token:', decoded2);
      
    } catch (tokenError) {
      console.log('❌ Token verification failed:');
      console.log(tokenError);
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testJwtVerification();