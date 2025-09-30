/**
 * Generate JWT token for testing the sales API endpoints
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// JWT secret should be in .env
const JWT_SECRET = process.env.JWT_SECRET || 'changeme123456789';

// Create a sample user payload with sales_team role
const companyId = 'test-co';
const userId = uuidv4();

const user = {
  id: userId,
  email: 'sales@example.com',
  username: 'salesuser',
  firstName: 'Sales',
  lastName: 'User',
  companyId: companyId,
  roles: ['sales_team', 'SALES_TEAM', 'user'],
  permissions: ['read:sales', 'write:sales'],
  metadata: {
    testMode: true
  }
};

// Generate the token
function generateToken() {
  const token = jwt.sign(
    { 
      user,
      // Standard JWT claims
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hour expiration
      iss: 'test-script'
    }, 
    JWT_SECRET
  );

  console.log('\n=== Sales API Test JWT Token ===');
  console.log(token);
  console.log('\n=== Token Payload ===');
  console.log(JSON.stringify(user, null, 2));
  console.log('\n=== Usage Command for Customer Creation ===');
  console.log(`curl -X POST http://localhost:5000/api/sales/customer \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{
    "companyId": "${companyId}",
    "franchiseId": "test-franchise",
    "name": "John Doe",
    "email": "john@example.com"
  }'`);
}

generateToken();
