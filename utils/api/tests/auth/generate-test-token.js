/**
 * Generate Test JWT Token
 * 
 * This script generates a JWT token for testing purposes,
 * matching the format expected by our authentication system.
 */

import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Secret key from environment
const jwtSecret = process.env.JWT_SECRET || 'development-secret-key-for-testing-only';

// User data 
const userData = {
  id: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787',
  email: 'admin@example.com',
  name: 'Admin User',
  roles: ['ADMIN', 'USER'],
  companyId: '7196288d-7314-4512-8b67-2c82449b5465',
  createdAt: '2025-03-20T12:00:00.000Z'
};

// Generate token with 1 year expiration
const token = jwt.sign(
  userData,
  jwtSecret,
  { 
    expiresIn: '1y' 
  }
);

console.log('Generated JWT token:');
console.log(token);