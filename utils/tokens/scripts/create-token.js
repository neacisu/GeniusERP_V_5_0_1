/**
 * Create test authentication token
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'geniuserp_auth_jwt_secret';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';
const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

// Create a token valid for 24 hours
function createToken() {
  const payload = {
    id: TEST_USER_ID,
    companyId: TEST_COMPANY_ID,
    roles: ['admin', 'accounting'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };
  
  const token = jwt.sign(payload, JWT_SECRET);
  console.log('Generated token:');
  console.log(token);
  
  // Verify the token to confirm it's valid
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\nToken payload:');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('\nToken is valid and will expire at:', new Date(decoded.exp * 1000).toISOString());
  } catch (error) {
    console.error('Token verification failed:', error.message);
  }
}

createToken();