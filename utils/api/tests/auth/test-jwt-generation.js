/**
 * JWT Test Token Generator
 * 
 * Generates a valid JWT token for testing the protected routes
 */

import jwt from 'jsonwebtoken';

// Secret key for JWT - must match the one in server/modules/auth/services/auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// User data to encode in the token
const userData = {
  id: 'e3d8e481-bfb4-4f3b-bc99-7143fa673172',
  username: 'admin',
  role: 'admin',
  roles: ['admin'],
  companyId: '7196288d-7314-4512-8b67-2c82449b5465'
};

// Create token with 1 year expiration
const token = jwt.sign(
  userData,
  JWT_SECRET,
  { expiresIn: '1y' }
);

console.log('🔑 Generated JWT token:');
console.log(token);
console.log('\n📝 Token payload:');
console.log(userData);

// Export the token
export default token;