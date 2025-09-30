/**
 * Generate JWT token for testing the collaboration module endpoints
 * Using an existing user ID and company ID from the database
 */

import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

// Load environment variables from .env file if present
config();

function generateTestToken() {
  // Get the secret from environment variables
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set');
    process.exit(1);
  }

  // Use the admin user from our database
  const payload = {
    id: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787',  // Admin user ID
    companyId: '7196288d-7314-4512-8b67-2c82449b5465',  // Demo company ID
    email: 'admin@geniuserp.com',
    username: 'admin',
    roles: ['user', 'admin'],
    status: 'ACTIVE'
  };

  // Generate the token (valid for 24 hours)
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });

  console.log('Generated JWT token:');
  console.log(token);
  console.log('\nUse this token in your Authorization header as:');
  console.log('Authorization: Bearer TOKEN');
}

// Execute the function
generateTestToken();