/**
 * JWT Generator for Testing
 * 
 * This script generates JWT tokens for testing authentication features
 */

// Import required libraries
import fs from 'fs';
import { JwtService } from './server/modules/auth/services/jwt.service.js';

// Use JwtService which will use the environment's secret
const jwtService = new JwtService();

// Create a test user payload
const payload = {
  id: '123456789',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  roles: ['admin', 'manager', 'accountant'],
  companyId: 'COMPANY1'
};

// Generate token using JwtService
const token = jwtService.generateToken(payload);

// Print token for testing
console.log('JWT Token for testing:');
console.log(token);

// Save token to file for convenience
fs.writeFileSync('token.txt', token);
console.log('Token saved to token.txt');

// Decode and verify token to show info
try {
  const decoded = jwtService.verifyToken(token);
  console.log('\nDecoded token payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\nUse with API:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/examples/protected`);
} catch (error) {
  console.error('Token verification failed:', error.message);
}