const { JWT_SECRET } = require('./server/modules/auth/services/auth.service');
const jwt = require('jsonwebtoken');

// Create a test payload
const payload = {
  id: 'test-id',
  username: 'testuser',
  role: 'ADMIN',
  companyId: 'test-company'
};

// Sign with the actual JWT_SECRET
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
console.log(token);
