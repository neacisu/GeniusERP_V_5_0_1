/**
 * Simple token generator script
 */

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

// Get the JWT secret from environment variable or use the default
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';
console.log(`Using JWT_SECRET: ${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}`);

// Generate test user data with ai_access role
const userData = {
  id: randomUUID(),
  username: 'testadmin',
  email: 'testadmin@example.com',
  role: 'admin',
  roles: ['admin', 'ai_access', 'super_admin'],
  companyId: randomUUID(),
  franchiseId: null
};

// Generate the token with a 1 hour expiration
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated JWT token:');
console.log(token);
console.log('\nUser data:');
console.log(JSON.stringify(userData, null, 2));