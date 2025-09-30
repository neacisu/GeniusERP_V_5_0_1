/**
 * Generate JWT token for testing the collaboration module endpoints
 * Using the JWT_SECRET from environment variable
 */
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

function generateToken() {
  // Read JWT_SECRET from environment
  const jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret-for-testing';
  
  // Create a sample user payload
  const user = {
    id: uuidv4(),
    companyId: uuidv4(),
    email: 'test@example.com',
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  // Sign the token
  const token = jwt.sign(user, jwtSecret);
  
  console.log('Generated token for testing:');
  console.log(token);
  console.log('\nUser payload:');
  console.log(JSON.stringify(user, null, 2));
  
  return token;
}

generateToken();