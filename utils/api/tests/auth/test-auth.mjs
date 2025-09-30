import jwt from 'jsonwebtoken';
import fs from 'fs';

// Create a function to test token verification
async function testTokenVerification() {
  try {
    // Read the token
    const token = fs.readFileSync('app-token.txt', 'utf-8').trim();
    console.log('Token:', token);
    
    // Create user data similar to our token
    const userData = {
      id: 'user-test-1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'admin',
      roles: ['admin', 'user'],
      companyId: 'co001'
    };
    
    // Different JWT secrets to try
    const secrets = [
      "geniuserp_auth_jwt_secret",
      "x7kOPu4YM6qzfPrXFKp5q8",
      process.env.JWT_SECRET || "default_secret"
    ];
    
    console.log('\nTesting JWT verification with different secrets:');
    
    // Try to verify with each secret
    for (const secret of secrets) {
      try {
        const decoded = jwt.verify(token, secret);
        console.log(`✅ Verification SUCCESS with secret: ${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}`);
        console.log('Decoded:', decoded);
      } catch (error) {
        console.log(`❌ Verification FAILED with secret: ${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}`);
        console.log('  Error:', error.message);
      }
    }
    
    // Create a fresh token with each secret
    console.log('\nCreating fresh tokens with each secret:');
    
    for (const secret of secrets) {
      const newToken = jwt.sign(userData, secret, { expiresIn: '1h' });
      console.log(`Created token with secret ${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}:`);
      console.log(newToken.substring(0, 20) + '...' + newToken.substring(newToken.length - 20));
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testTokenVerification();
