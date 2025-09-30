/**
 * Generate JWT token for testing the collaboration module endpoints
 * Using the JWT_SECRET from Replit secrets
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get JWT_SECRET from environment (Replit secrets)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET not found in environment');
  process.exit(1);
}

// Create token payload with user details
const payload = {
  id: '00000000-0000-0000-0000-000000000001', // Test user ID
  email: 'test@example.com',
  companyId: '00000000-0000-0000-0000-000000000001', // Test company ID as UUID
  username: 'testuser', // Required by UnifiedJwtPayload
  roles: ['USER', 'ADMIN'],
  permissions: ['read:tasks', 'write:tasks']
};

// Generate the token with a long expiry
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

// Save token to a file for easier reuse in other scripts
fs.writeFileSync('app-token.txt', token);

// Print the token to console
console.log('JWT Token for testing:');
console.log(token);
console.log('\nUse this with curl:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/collaboration/tasks`);