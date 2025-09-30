/**
 * Generate JWT token for testing the collaboration module endpoints
 * Using a test user ID and company ID
 */

import jwt from 'jsonwebtoken';

// Secret key for token signing (this should match your server's JWT secret)
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// Create token payload with user details
const payload = {
  id: '00000000-0000-0000-0000-000000000001', // Test user ID
  email: 'test@example.com',
  companyId: '00000000-0000-0000-0000-000000000001', // Test company ID
  roles: ['USER', 'ADMIN'],
  permissions: ['read:tasks', 'write:tasks']
};

// Generate the token with a long expiry
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

// Print the token to console
console.log('JWT Token for testing:');
console.log(token);
console.log('\nUse this with curl:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/collaboration/tasks`);