import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";
const JWT_EXPIRES_IN = '1h';

// Generate a token for testing
function generateToken() {
  const payload = {
    id: 'test-id-123',
    username: 'testadmin',
    email: 'test@example.com',
    role: 'ADMIN',
    roles: ['ADMIN', 'USER'],
    companyId: 'test-company-123',
    firstName: 'Test',
    lastName: 'Admin'
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  console.log('Token generated successfully');
  
  // Save to file
  fs.writeFileSync('test-token.txt', token);
  console.log('Token saved to test-token.txt');
  
  return token;
}

const token = generateToken();
console.log('Token:', token);