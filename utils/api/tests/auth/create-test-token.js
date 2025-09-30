/**
 * Generate a JWT token for testing collaboration module endpoints
 * Using the JWT_SECRET from environment variable
 */
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Use the real admin user ID and company ID from the database
const userId = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';
const companyId = '7196288d-7314-4512-8b67-2c82449b5465';
const taskId = '302c8928-b341-48b3-8d38-4a05b247e858';

// Get the JWT_SECRET from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';

// Generate a token that matches the AuthGuard's expected format
function generateToken() {
  const payload = {
    id: userId, // AuthGuard expects 'id' as the user ID
    userId: userId, // Some services expect 'userId'
    username: 'admin@geniuserp.com', // Required by the UnifiedJwtPayload interface
    email: 'admin@geniuserp.com',
    companyId: companyId, // Used for company access control
    role: 'admin', // Default role
    roles: ['admin', 'USER'], // Both role formats for compatibility
    permissions: ['read:tasks', 'write:tasks'], // Example permissions
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };

  const token = jwt.sign(payload, JWT_SECRET);
  console.log('Generated token:', token);
  console.log('Token payload:', payload);
  
  // Save the token to file for use with curl commands
  fs.writeFileSync('test-token.txt', token);
  
  return token;
}

// Run the token generation
generateToken();

// Output test commands to use with the token
const token = fs.readFileSync('test-token.txt', 'utf8');
console.log('\nTest commands:');
console.log(`curl -X GET -H "Authorization: Bearer ${token}" http://localhost:5000/api/collaboration/tasks`);
console.log(`curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{"taskId":"${taskId}", "content":"Test note created via curl", "isPrivate": false}' http://localhost:5000/api/collaboration/notes`);