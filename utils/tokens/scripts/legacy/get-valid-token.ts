/**
 * Script to generate a valid token using the correct JWT_SECRET
 */
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './server/modules/auth/services/auth.service';

// Create a test payload
const payload = {
  id: 'test-id',
  username: 'testuser',
  role: 'ADMIN',
  companyId: 'test-company'
};

// Log the JWT_SECRET (partial for security)
console.log('Using JWT_SECRET starting with:', JWT_SECRET.substring(0, 5) + '...');

// Sign with the actual JWT_SECRET
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log(token);
