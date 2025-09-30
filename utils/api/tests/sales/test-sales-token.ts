/**
 * Test Sales Auth Token Generator
 * This script uses the app's own JwtService to generate a token for testing
 */

import fs from 'fs';
import path from 'path';
import { JwtService } from './server/modules/auth/services/jwt.service';
import { UserRole } from './server/modules/auth/types';

// Create test payload for sales role (should not have invoice access)
const payload = {
  id: '555555555',
  username: 'sales',
  email: 'sales@example.com',
  role: UserRole.SALES_AGENT,
  roles: [UserRole.SALES_AGENT],
  companyId: 'COMPANY1'
};

// Create the JWT service using the app's code
const jwtService = new JwtService();

// Generate a token
const token = jwtService.generateToken(payload);

// Save token to file
fs.writeFileSync('sales-token.txt', token);
console.log('Sales Token generated and saved to sales-token.txt');
console.log(token);

// Test verification
try {
  const verified = jwtService.verifyToken(token);
  console.log('Verification successful');
  console.log(JSON.stringify(verified, null, 2));
} catch (error) {
  console.error('Verification failed', error);
}