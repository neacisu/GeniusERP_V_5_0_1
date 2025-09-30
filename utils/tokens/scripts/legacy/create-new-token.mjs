import jwt from 'jsonwebtoken';
import fs from 'fs';

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";
const JWT_EXPIRES_IN = "24h";

// Create user data payload
const userData = {
  id: 'user-test-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  roles: ['admin', 'user'],
  companyId: 'co001'
};

// Generate JWT token
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Save token to file
fs.writeFileSync('app-token.txt', token);

// Display token info
console.log('New token generated:');
console.log('Token:', token);
console.log('\nToken saved to app-token.txt');
console.log('Token details:', jwt.decode(token));

