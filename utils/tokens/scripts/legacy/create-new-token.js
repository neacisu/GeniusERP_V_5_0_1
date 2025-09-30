// ESM module format
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Get JWT_SECRET from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';

// Create token payload
const userData = {
  id: 'user-test-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  roles: ['admin', 'user'],
  companyId: 'co001',
  franchiseId: null
};

// Sign JWT token with expiration of 1 hour
const token = jwt.sign(userData, JWT_SECRET, { 
  expiresIn: '1h' 
});

// Output token to console
console.log("Generated token:", token);

// Save token to file
fs.writeFileSync('new-token.txt', token);

console.log("Token saved to new-token.txt");