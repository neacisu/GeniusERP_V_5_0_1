/**
 * Generate a new JWT token for testing the setup endpoints
 * 
 * This script generates a JWT token with the correct JWT_SECRET that matches
 * the one in auth.service.ts, and gives it admin privileges.
 */
import jwt from 'jsonwebtoken';
import fs from 'node:fs';

// This must match the JWT_SECRET in auth.service.ts
const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret"; 

// Create a user payload similar to what our auth.service.ts would generate
const adminUserData = {
  id: 'user-test-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',  // Primary role
  roles: ['admin', 'user', 'hq_admin'],  // All roles, including hq_admin
  companyId: 'co001',  // Sample company ID
  franchiseId: null,
};

// Generate the token
function generateToken() {
  // Create a token that expires in 1 hour
  const token = jwt.sign(adminUserData, JWT_SECRET, { expiresIn: '1h' });
  
  // Display token
  console.log('Generated Token:');
  console.log(token);
  
  // Save token to file
  fs.writeFileSync('./app-token.txt', token);
  console.log('\nToken saved to app-token.txt');
}

// Execute
generateToken();