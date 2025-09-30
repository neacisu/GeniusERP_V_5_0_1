/**
 * JWT Token Refresh Generator
 * 
 * Generates a new JWT token using the current environment's secret
 * for testing the protected routes
 */

import { JwtService } from './server/modules/auth/services/jwt.service.js';

// User data to encode in the token
const userData = {
  id: 'e3d8e481-bfb4-4f3b-bc99-7143fa673172',
  username: 'admin',
  role: 'admin',
  roles: ['admin'],
  companyId: '7196288d-7314-4512-8b67-2c82449b5465'
};

// Create JwtService instance
const jwtService = new JwtService();

// Generate a token with the current environment's secret
const token = jwtService.generateToken(userData);

console.log('🔑 Generated JWT token with current secret:');
console.log(token);

// Test verification of the newly generated token
try {
  console.log('\n🔍 Verifying the newly generated token...');
  const decoded = jwtService.verifyToken(token);
  console.log('✅ Token is valid!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
  console.error(error);
}

// Export the token
export default token;