/**
 * JWT Token Generator and Verification
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load existing token from file
const token = fs.readFileSync('token.txt', 'utf-8').trim();

// The same secret as in auth.service.ts
const JWT_SECRET = 'geniuserp_auth_jwt_secret';

// Decode without verification
console.log('Decoding token without verification:');
const decoded = jwt.decode(token);
console.log(JSON.stringify(decoded, null, 2));

// Verify token
try {
  console.log('\nVerifying token with jwt.verify:');
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('✅ Verification successful!');
  console.log(JSON.stringify(verified, null, 2));
} catch (error) {
  console.error('❌ Verification failed:', error.message);
}

// Generate a new token with the same payload but without iat/exp
console.log('\nGenerating a new token with the same payload and secret:');
const { iat, exp, ...payloadWithoutTimes } = decoded;
const newToken = jwt.sign(payloadWithoutTimes, JWT_SECRET, { expiresIn: '24h' });
console.log(newToken);

// Save the new token
fs.writeFileSync('new-token.txt', newToken);
console.log('New token saved to new-token.txt');

// Compare the two tokens
console.log('\nComparing original and new tokens:');
console.log('Original:', token);
console.log('New:     ', newToken);