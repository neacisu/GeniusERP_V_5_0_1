/**
 * Test token verification and examine the decoded payload
 * 
 * This script tests the verification of JWT tokens and logs the decoded payload
 * to help diagnose authentication issues.
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

// Settings from auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// Real user data
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user
const COMPANY_ID = 'e6c88ba0-5dc3-4958-83e5-ecd33af0ca9c'; // Genesis
const USER_ROLE = 'admin';

// Generate multiple token variations to test
function createTokens() {
  const standardPayload = {
    id: USER_ID,
    username: 'admin',
    role: USER_ROLE,
    roles: [USER_ROLE, 'hr_team'],
    companyId: COMPANY_ID
  };
  
  // Create tokens with different permissions
  const tokens = {
    // Standard token with all fields
    standard: jwt.sign(standardPayload, JWT_SECRET, { expiresIn: '10m' }),
    
    // Token with different roles array
    rolesOnly: jwt.sign({
      ...standardPayload,
      role: undefined
    }, JWT_SECRET, { expiresIn: '10m' }),
    
    // Token with role but no roles array
    roleOnly: jwt.sign({
      ...standardPayload,
      roles: undefined
    }, JWT_SECRET, { expiresIn: '10m' }),
  };
  
  return tokens;
}

// Verify all tokens locally to double-check they're valid
function verifyTokens(tokens) {
  console.log('\n==== Verifying tokens locally ====');
  for (const [name, token] of Object.entries(tokens)) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`\n✅ [${name}] Verified successfully:`);
      console.log(decoded);
    } catch (error) {
      console.error(`\n❌ [${name}] Verification failed:`, error.message);
    }
  }
}

// Test each token against the API
async function testApiEndpoint(tokens) {
  console.log('\n==== Testing API with each token ====');
  for (const [name, token] of Object.entries(tokens)) {
    try {
      console.log(`\n📝 Testing [${name}] token...`);
      const response = await axios.get(
        'http://localhost:5000/api/examples/protected',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(`✅ API Response (${name}):`);
      console.log(`Status: ${response.status}`);
      console.log('Data:', response.data);
    } catch (error) {
      console.error(`❌ API Call Failed (${name}):`);
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('Creating test tokens...');
  const tokens = createTokens();
  
  // Log token details
  for (const [name, token] of Object.entries(tokens)) {
    console.log(`\n[${name}] Token: ${token}`);
    console.log(`[${name}] Decoded: `, jwt.decode(token));
  }
  
  // Verify tokens locally
  verifyTokens(tokens);
  
  // Test API endpoint with each token
  await testApiEndpoint(tokens);
}

runTests();