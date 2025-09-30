/**
 * Test Auth Token Generator
 * This script uses the app's own JwtService to generate a token for testing
 */

import fs from 'fs';
import path from 'path';
import { JwtService } from './server/modules/auth/services/jwt.service';

// Create test payload
const payload = {
  id: '123456789',
  username: 'testuser',
  email: 'test@example.com',
  role: 'ecommerce_admin',
  roles: ['ecommerce_admin', 'ecommerce_manager', 'ecommerce_user'],
  companyId: 'COMPANY1'
};

// Create the JWT service using the app's code
const jwtService = new JwtService();

// Generate a token
const token = jwtService.generateToken(payload);

// Save token to file
fs.writeFileSync('app-token.txt', token);
console.log('Token generated and saved to app-token.txt');
console.log(token);

// Test verification
try {
  const verified = jwtService.verifyToken(token);
  console.log('Verification successful');
  console.log(JSON.stringify(verified, null, 2));
} catch (error) {
  console.error('Verification failed', error);
}