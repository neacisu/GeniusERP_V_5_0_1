/**
 * Generate Integration Test Token
 * 
 * This script creates a JWT token for testing the integrations routes.
 */

import jwt from 'jsonwebtoken';
import 'dotenv/config';

const { sign } = jwt;

/**
 * Generate a JWT token for testing
 */
function generateTestToken(): string {
  // Create test user data
  const userData = {
    id: '12345678-1234-1234-1234-123456789012',
    username: 'tester',
    email: 'test@example.com',
    role: 'admin',
    roles: ['admin', 'integration_manager'],
    companyId: 'c12345678-1234-1234-1234-123456789012'
  };
  
  // Sign the token using the JWT_SECRET from .env
  const token = sign(userData, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
  
  console.log('Generated test token:');
  console.log(token);
  
  return token;
}

// Generate and output token
const token = generateTestToken();