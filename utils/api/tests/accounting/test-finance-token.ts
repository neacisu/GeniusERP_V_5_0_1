/**
 * Test Finance Manager Auth Token Generator
 * This script uses the app's own JwtService to generate a token for testing
 */

import fs from 'fs';
import path from 'path';
import { JwtService } from './server/modules/auth/services/jwt.service';
import { UserRole } from './server/modules/auth/types';

// Create test payload for finance manager
const payload = {
  id: '987654321',
  username: 'finance',
  email: 'finance@example.com',
  role: UserRole.FINANCE_MANAGER,
  roles: [UserRole.FINANCE_MANAGER],
  companyId: 'COMPANY1'
};

// Create the JWT service using the app's code
const jwtService = new JwtService();

// Generate a token
const token = jwtService.generateToken(payload);

// Save token to file
fs.writeFileSync('finance-token.txt', token);
console.log('Finance Manager Token generated and saved to finance-token.txt');
console.log(token);

// Test verification
try {
  const verified = jwtService.verifyToken(token);
  console.log('Verification successful');
  console.log(JSON.stringify(verified, null, 2));
} catch (error) {
  console.error('Verification failed', error);
}