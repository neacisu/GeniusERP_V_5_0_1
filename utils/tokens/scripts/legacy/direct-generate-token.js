/**
 * Direct Token Generator
 * This script generates a JWT token using the same secret and structure as auth.service.ts
 */
import fs from 'node:fs';
// Import existing crypto-js package, which we know is available
import crypto from 'crypto';

// Use the exact same JWT_SECRET as defined in auth.service.ts
const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";

// Create a user payload that matches what our API expects
const payload = {
  id: 'user-test-1',                     // Unique user ID
  username: 'testuser',                  // Username
  email: 'test@example.com',             // Email
  role: 'admin',                         // Primary role
  roles: ['admin', 'hq_admin', 'user'],  // All roles including hq_admin
  companyId: 'co001',                    // Company ID
  franchiseId: null,                     // Franchise ID (null)
  iat: Math.floor(Date.now() / 1000),    // Issued at (now)
  exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
};

// Basic JWT implementation to avoid dependencies
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sign(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64Header = base64UrlEncode(JSON.stringify(header));
  const base64Payload = base64UrlEncode(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

// Generate token
const token = sign(payload, JWT_SECRET);

// Save token to file
fs.writeFileSync('./app-token.txt', token);

console.log('Generated token:');
console.log(token);
console.log('\nPayload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\nToken saved to app-token.txt');