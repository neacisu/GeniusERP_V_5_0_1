/**
 * Generate JWT token for HR module testing
 * This script generates a valid token with HR team role and existing company ID
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';

function generateToken() {
  const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // This should match the value in auth.service.ts
  console.log('Using JWT_SECRET:', JWT_SECRET.substring(0, 3) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 3));
  
  // User data with HR team role and existing company ID and user ID
  const userData = {
    id: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', // Valid user ID from the users table
    username: 'admin',
    email: 'admin@geniuserp.com',
    role: 'admin',
    roles: ['admin', 'hr_team', 'super_admin'], // Added hr_team role
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Using an existing company ID from the database
    franchiseId: null
  };
  
  // Token will expire in 1 hour (3600 seconds)
  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: 3600 });
  
  console.log('Generated JWT token:');
  console.log(token);
  console.log('\nUser data:');
  console.log(JSON.stringify(userData, null, 2));
  
  // Optionally save token to a file for later use
  fs.writeFileSync('hr-test-token.txt', token);
  console.log('\nToken saved to hr-test-token.txt');
}

generateToken();
