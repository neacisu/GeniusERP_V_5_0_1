/**
 * Generate JWT token for testing communications module
 * 
 * This script creates a JWT token for the comms_admin user
 * using the JWT_SECRET from Replit secrets.
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

function generateCommToken() {
  // User data from the database
  const userData = {
    id: '3bc19baa-c8f8-4594-bc90-d4a36ed0f184',
    username: 'comms_admin',
    email: 'comms_admin@example.com',
    firstName: 'Communications',
    lastName: 'Admin',
    role: 'admin',
    companyId: '97c4796a-fd9f-4fdf-822c-2d954c47650c',
    roles: ['comms_admin'],
    status: 'active'
  };

  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('Error: JWT_SECRET is not defined in environment variables');
    return null;
  }

  // Create token with 1 hour expiration
  const token = jwt.sign(
    userData,
    jwtSecret,
    { expiresIn: '1h' }
  );

  console.log('JWT Token for Communications Testing:');
  console.log(token);
  
  return token;
}

generateCommToken();