import jwt from 'jsonwebtoken';
import fs from 'fs';

const userData = {
  id: 'user-test-1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  roles: ['admin', 'user'],
  companyId: 'co001'
};

// Use the correct JWT secret from the auth service
const JWT_SECRET = "geniuserp_auth_jwt_secret";
const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

fs.writeFileSync('app-token.txt', token);
console.log('Token created:', token);
