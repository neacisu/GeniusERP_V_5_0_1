/**
 * Unified Token Generator Utility
 * 
 * This script replaces multiple token generation scripts with a single utility
 * that can generate different types of tokens for various purposes.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Default JWT secret from environment or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';

/**
 * Generate a JWT token with customizable parameters
 * @param {Object} options - Token generation options
 * @param {string} options.type - Token type ('user', 'admin', 'sales', 'finance', 'hr', etc.)
 * @param {string} options.userId - User ID (optional)
 * @param {string} options.companyId - Company ID (optional)
 * @param {string} options.email - User email (optional)
 * @param {Array} options.roles - User roles (optional)
 * @param {Array} options.permissions - User permissions (optional)
 * @param {number} options.expiresIn - Token expiration in seconds (default: 24 hours)
 * @param {string} options.outputFile - File to save token (optional)
 * @returns {string} Generated JWT token
 */
function generateToken(options = {}) {
  const {
    type = 'user',
    userId = uuidv4(),
    companyId = uuidv4(),
    email = 'admin@example.com',
    roles = ['user'],
    permissions = [],
    expiresIn = 86400, // 24 hours
    outputFile = null
  } = options;

  // Add roles based on type
  let tokenRoles = [...roles];
  if (type === 'admin' && !roles.includes('admin')) {
    tokenRoles.push('admin');
  }
  if (type === 'sales' && !roles.includes('sales')) {
    tokenRoles.push('sales');
  }
  // Add more type-specific roles as needed

  // Build the payload
  const payload = {
    id: userId,
    userId,
    username: email,
    email,
    companyId,
    role: tokenRoles[0], // Primary role (for compatibility)
    roles: tokenRoles,
    permissions,
    exp: Math.floor(Date.now() / 1000) + expiresIn
  };

  // Sign and create the token
  const token = jwt.sign(payload, JWT_SECRET);
  
  // Log info
  console.log(`\n===== Generated ${type.toUpperCase()} Token =====`);
  console.log('Token:', token);
  console.log('Payload:', payload);
  
  // Save to file if specified
  if (outputFile) {
    fs.writeFileSync(outputFile, token);
    console.log(`Token saved to ${outputFile}`);
  }
  
  return token;
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload if valid
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n===== Token Verification =====');
    console.log('✅ Token verified successfully');
    console.log('Decoded payload:', decoded);
    return decoded;
  } catch (error) {
    console.error('\n===== Token Verification Failed =====');
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Export functions if used as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateToken,
    verifyToken
  };
}

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'generate') {
    const type = args[1] || 'user';
    const outputFile = args[2] || `./tokens/${type}-token.txt`;
    
    // Create tokens directory if it doesn't exist
    if (!fs.existsSync('./tokens')) {
      fs.mkdirSync('./tokens', { recursive: true });
    }
    
    generateToken({ type, outputFile });
    
    // Log usage examples
    console.log('\n===== Usage Examples =====');
    console.log(`curl -X GET -H "Authorization: Bearer $(cat ${outputFile})" http://localhost:5000/api/examples/protected`);
    
  } else if (command === 'verify') {
    const tokenFile = args[1];
    if (!tokenFile) {
      console.error('Please provide a token file to verify');
      process.exit(1);
    }
    
    const token = fs.readFileSync(tokenFile, 'utf8');
    verifyToken(token);
    
  } else {
    console.log('Usage:');
    console.log('  node token-generator.js generate [type] [outputFile]');
    console.log('  node token-generator.js verify [tokenFile]');
  }
}