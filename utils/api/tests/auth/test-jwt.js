/**
 * Test JWT token verification
 * 
 * This script tests JWT token generation and verification
 * to debug authentication issues.
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';

// Settings from auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';
const JWT_EXPIRES_IN = '1h';

// Real user data
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user
const COMPANY_ID = 'e6c88ba0-5dc3-4958-83e5-ecd33af0ca9c'; // Genesis
const USER_EMAIL = 'admin@geniuserp.com';
const USER_ROLE = 'admin';

// Create JWT token that exactly matches the format in the auth.service.generateToken method
function createValidToken() {
  // Follow the exact JwtPayload structure used in generateToken
  const payload = {
    id: USER_ID,
    username: 'admin',
    role: USER_ROLE,
    roles: [USER_ROLE], // Add roles array for RBAC middleware
    companyId: COMPANY_ID
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Test JWT token creation and verification
function testJwtToken() {
  try {
    // Generate token
    const token = createValidToken();
    console.log('Generated token:', token);
    
    // Save token to file for further tests
    fs.writeFileSync('token.txt', token);
    console.log('Token saved to token.txt');
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('\nVerification successful with JWT_SECRET:', JWT_SECRET);
      console.log('Decoded token payload:', decoded);
    } catch (verifyError) {
      console.error('\nVerification failed:', verifyError.message);
    }
    
    // Try with incorrect secret
    try {
      const decoded = jwt.verify(token, 'wrong_secret');
      console.log('\nVerification with wrong secret succeeded (this should not happen):', decoded);
    } catch (verifyError) {
      console.log('\nVerification correctly failed with wrong secret:', verifyError.message);
    }
    
  } catch (error) {
    console.error('Error in JWT test:', error.message);
  }
}

// Run the test
testJwtToken();