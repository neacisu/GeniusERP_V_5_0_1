#!/usr/bin/env node
/**
 * Token Manager
 * 
 * A comprehensive CLI utility to manage all token operations in the project.
 * This script uses the JWT secret stored in Replit secrets and admin UUID.
 * 
 * Enhanced with secure token storage capabilities for encrypted token management.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { Command } from 'commander';
import crypto from 'crypto';
import os from 'os';
import secretChecker from './verify/secret-check.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize commander
const program = new Command();

// Constants and defaults
const GENERATED_DIR = path.join(__dirname, 'generated');
const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const SECURE_STORE_DIR = path.join(__dirname, 'secure-store');
const DEFAULT_EXPIRY = '24h';
const TOKEN_TYPES = ['admin', 'user', 'sales', 'hr', 'finance', 'accounting', 'crm', 'inventory', 'comms'];

// Ensure directories exist
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

if (!fs.existsSync(SECURE_STORE_DIR)) {
  fs.mkdirSync(SECURE_STORE_DIR, { recursive: true });
  
  // Create a .gitignore file to prevent committing tokens
  const gitignorePath = path.join(SECURE_STORE_DIR, '.gitignore');
  fs.writeFileSync(gitignorePath, '# Ignore all token files\n*\n!.gitignore\n');
}

/**
 * Generate a secure encryption key based on machine parameters
 * @returns {string} Encryption key
 */
function generateEncryptionKey() {
  // Create a deterministic but somewhat unique key
  // This is not fully secure and should be replaced with a real secret in production
  const machineSalt = `${os.hostname()}-${os.platform()}-${os.arch()}`;
  return crypto.createHash('sha256').update(machineSalt).digest('hex');
}

/**
 * Secure token store for managing tokens with encryption
 */
class TokenStore {
  /**
   * Create a new token store
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = {
      storePath: SECURE_STORE_DIR,
      encryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
      tokenTTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      verbose: true,
      ...options
    };
    
    // Use provided encryption key or generate one
    if (!this.config.encryptionKey) {
      this.config.encryptionKey = generateEncryptionKey();
      
      if (this.config.verbose) {
        console.log('⚠️ Using generated encryption key. For better security, set TOKEN_ENCRYPTION_KEY environment variable.');
      }
    }
  }

  /**
   * Encrypt a token
   * @param {string} token - Token to encrypt
   * @returns {Object} Encrypted token data
   */
  encryptToken(token) {
    // Generate a random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(this.config.encryptionKey.slice(0, 32)), 
      iv
    );
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encrypted
    };
  }

  /**
   * Decrypt a token
   * @param {Object} encryptedData - Encrypted token data
   * @returns {string} Decrypted token
   */
  decryptToken(encryptedData) {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.config.encryptionKey.slice(0, 32)),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Store a token securely
   * @param {string} name - Token name/identifier
   * @param {string} token - Token to store
   * @param {Object} metadata - Additional metadata
   * @returns {boolean} Success status
   */
  storeToken(name, token, metadata = {}) {
    // Validate inputs
    if (!name || !token) {
      console.error('Token name and value are required');
      return false;
    }
    
    // Sanitize name for use as filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.config.storePath, `${safeName}.json`);
    
    try {
      // Encrypt the token
      const encryptedData = this.encryptToken(token);
      
      // Create token data object
      const tokenData = {
        name,
        created: new Date().toISOString(),
        expires: new Date(Date.now() + this.config.tokenTTL).toISOString(),
        metadata,
        encryption: {
          method: 'aes-256-cbc',
          iv: encryptedData.iv
        },
        token: encryptedData.encrypted
      };
      
      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(tokenData, null, 2));
      
      if (this.config.verbose) {
        console.log(`Token '${name}' stored successfully`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error storing token '${name}':`, error.message);
      return false;
    }
  }

  /**
   * Retrieve a token
   * @param {string} name - Token name/identifier
   * @returns {string|null} Retrieved token or null if not found/expired
   */
  getToken(name) {
    // Sanitize name for use as filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.config.storePath, `${safeName}.json`);
    
    try {
      // Check if token file exists
      if (!fs.existsSync(filePath)) {
        if (this.config.verbose) {
          console.log(`Token '${name}' not found`);
        }
        return null;
      }
      
      // Read and parse token data
      const tokenData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check if token has expired
      if (new Date(tokenData.expires) < new Date()) {
        if (this.config.verbose) {
          console.log(`Token '${name}' has expired`);
        }
        return null;
      }
      
      // Decrypt the token
      const decrypted = this.decryptToken({
        iv: tokenData.encryption.iv,
        encrypted: tokenData.token
      });
      
      if (this.config.verbose) {
        console.log(`Token '${name}' retrieved successfully`);
      }
      
      return decrypted;
    } catch (error) {
      console.error(`Error retrieving token '${name}':`, error.message);
      return null;
    }
  }

  /**
   * Get token metadata
   * @param {string} name - Token name/identifier
   * @returns {Object|null} Token metadata or null if not found
   */
  getTokenMetadata(name) {
    // Sanitize name for use as filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.config.storePath, `${safeName}.json`);
    
    try {
      // Check if token file exists
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      // Read and parse token data
      const tokenData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Return metadata without the actual token
      const {
        token, // removed from result
        encryption, // removed from result
        ...metadata
      } = tokenData;
      
      return metadata;
    } catch (error) {
      console.error(`Error retrieving token metadata '${name}':`, error.message);
      return null;
    }
  }

  /**
   * List all stored tokens
   * @returns {Array} List of token names and metadata
   */
  listTokens() {
    try {
      // Read all token files
      const files = fs.readdirSync(this.config.storePath)
        .filter(file => file.endsWith('.json') && file !== '.gitignore');
      
      // Get metadata for each token
      const tokens = files.map(file => {
        const name = file.replace('.json', '');
        return {
          name,
          ...this.getTokenMetadata(name)
        };
      });
      
      return tokens;
    } catch (error) {
      console.error('Error listing tokens:', error.message);
      return [];
    }
  }

  /**
   * Delete a token
   * @param {string} name - Token name/identifier
   * @returns {boolean} Success status
   */
  deleteToken(name) {
    // Sanitize name for use as filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.config.storePath, `${safeName}.json`);
    
    try {
      // Check if token file exists
      if (!fs.existsSync(filePath)) {
        if (this.config.verbose) {
          console.log(`Token '${name}' not found`);
        }
        return false;
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      if (this.config.verbose) {
        console.log(`Token '${name}' deleted successfully`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting token '${name}':`, error.message);
      return false;
    }
  }

  /**
   * Delete all tokens
   * @returns {boolean} Success status
   */
  deleteAllTokens() {
    try {
      // Read all token files
      const files = fs.readdirSync(this.config.storePath)
        .filter(file => file.endsWith('.json') && file !== '.gitignore')
        .map(file => path.join(this.config.storePath, file));
      
      // Delete each file
      let deleted = 0;
      for (const file of files) {
        fs.unlinkSync(file);
        deleted++;
      }
      
      if (this.config.verbose) {
        console.log(`Deleted ${deleted} tokens`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting all tokens:', error.message);
      return false;
    }
  }
}

// Get JWT secret from Replit Secrets or environment variables
async function getJwtSecret() {
  return new Promise((resolve, reject) => {
    exec('echo $JWT_SECRET', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error accessing JWT_SECRET: ${error}`);
        reject(error);
        return;
      }
      const secret = stdout.trim();
      if (!secret) {
        console.error('JWT_SECRET is not set in Replit Secrets or environment variables');
        reject(new Error('JWT_SECRET is not set'));
        return;
      }
      resolve(secret);
    });
  });
}

// Get admin UUID from environment or database
async function getAdminUuid() {
  // Try to get from environment variable
  return new Promise((resolve) => {
    exec('echo $ADMIN_UUID', (error, stdout, stderr) => {
      const adminUuid = stdout.trim();
      if (adminUuid) {
        resolve(adminUuid);
      } else {
        // Fallback to a default for development
        console.warn('ADMIN_UUID not found in environment, using a default UUID');
        resolve('49e12af8-dbd0-48db-b5bd-4fb3f6a39787');
      }
    });
  });
}

// Generate a token with the specified options
async function generateToken(options) {
  try {
    const secret = await getJwtSecret();
    const adminUuid = await getAdminUuid();
    
    // Default values
    const userId = options.userId || adminUuid;
    const companyId = options.companyId || '7196288d-7314-4512-8b67-2c82449b5465';
    const email = options.email || 'admin@example.com';
    
    // Determine roles based on token type
    let roles = options.roles || [];
    if (options.type && !roles.includes(options.type)) {
      roles.push(options.type);
    }
    if (options.type === 'admin' && !roles.includes('admin')) {
      roles.push('admin');
    }
    
    // Build the payload
    const payload = {
      id: userId,
      userId: userId,
      email: email,
      companyId: companyId,
      role: roles[0] || 'user', // Primary role
      roles: roles.length ? roles : ['user'],
      permissions: options.permissions || []
    };
    
    // Add additional fields if provided
    if (options.additionalFields) {
      Object.assign(payload, options.additionalFields);
    }
    
    // Generate and sign the token
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn: options.expiresIn || DEFAULT_EXPIRY }
    );
    
    // Save token to file if output path is provided
    if (options.output) {
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, token);
      console.log(`✅ Token saved to: ${outputPath}`);
    }
    
    return { token, payload };
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
    throw error;
  }
}

// Verify a token
async function verifyToken(tokenString) {
  try {
    const secret = await getJwtSecret();
    const decoded = jwt.verify(tokenString, secret);
    return { isValid: true, decoded };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

// List all available scripts
function listScripts() {
  console.log('\n📜 Available token scripts:');
  
  // List main scripts in scripts directory
  const mainScripts = fs.readdirSync(SCRIPTS_DIR)
    .filter(file => file.endsWith('.js') && !fs.statSync(path.join(SCRIPTS_DIR, file)).isDirectory());
  
  console.log('\n- Main scripts:');
  mainScripts.forEach(script => {
    console.log(`  • ${script}`);
  });
  
  // List specialized scripts
  const specializedDir = path.join(SCRIPTS_DIR, 'specialized');
  if (fs.existsSync(specializedDir)) {
    const specializedScripts = fs.readdirSync(specializedDir)
      .filter(file => file.endsWith('.js'));
    
    console.log('\n- Specialized scripts:');
    specializedScripts.forEach(script => {
      console.log(`  • specialized/${script}`);
    });
  }
  
  console.log('\nUse: node token-manager.js run <script-name> to run a specific script');
}

// List all generated tokens
function listTokens() {
  console.log('\n🔑 Generated tokens:');
  
  const tokens = fs.readdirSync(GENERATED_DIR)
    .filter(file => file.endsWith('.txt') && !fs.statSync(path.join(GENERATED_DIR, file)).isDirectory());
  
  tokens.forEach(tokenFile => {
    const tokenPath = path.join(GENERATED_DIR, tokenFile);
    const stats = fs.statSync(tokenPath);
    const token = fs.readFileSync(tokenPath, 'utf8').substring(0, 20) + '...';
    
    console.log(`- ${tokenFile}`);
    console.log(`  • Created: ${stats.mtime.toISOString()}`);
    console.log(`  • Token: ${token}`);
    
    // Try to verify and show expiration
    try {
      const tokenData = fs.readFileSync(tokenPath, 'utf8');
      verifyToken(tokenData).then(result => {
        if (result.isValid) {
          const expiry = new Date(result.decoded.exp * 1000);
          console.log(`  • Expires: ${expiry.toISOString()}`);
          console.log(`  • User ID: ${result.decoded.userId}`);
          console.log(`  • Roles: ${result.decoded.roles.join(', ')}`);
        } else {
          console.log(`  • Status: Invalid (${result.error})`);
        }
      });
    } catch (error) {
      console.log(`  • Status: Error reading token`);
    }
    console.log();
  });
}

// Run a specific token script
function runScript(scriptName) {
  // Check if the script exists in the main scripts directory
  let scriptPath = path.join(SCRIPTS_DIR, scriptName);
  if (!scriptPath.endsWith('.js')) {
    scriptPath += '.js';
  }
  
  // If not found, check in specialized directory
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.join(SCRIPTS_DIR, 'specialized', scriptName);
    if (!scriptPath.endsWith('.js')) {
      scriptPath += '.js';
    }
  }
  
  // If still not found, check if it's just the filename without path
  if (!fs.existsSync(scriptPath)) {
    const possiblePaths = [
      ...fs.readdirSync(SCRIPTS_DIR)
        .filter(file => file.endsWith('.js') && !fs.statSync(path.join(SCRIPTS_DIR, file)).isDirectory())
        .map(file => path.join(SCRIPTS_DIR, file)),
      ...fs.existsSync(path.join(SCRIPTS_DIR, 'specialized')) 
        ? fs.readdirSync(path.join(SCRIPTS_DIR, 'specialized'))
            .filter(file => file.endsWith('.js'))
            .map(file => path.join(SCRIPTS_DIR, 'specialized', file))
        : []
    ];
    
    const matchingScript = possiblePaths.find(p => path.basename(p).includes(scriptName));
    if (matchingScript) {
      scriptPath = matchingScript;
    }
  }
  
  // If script found, execute it
  if (fs.existsSync(scriptPath)) {
    console.log(`🔄 Running script: ${scriptPath}`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error executing script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️ Script warnings/errors: ${stderr}`);
      }
      console.log(`📤 Script output:\n${stdout}`);
    });
  } else {
    console.error(`❌ Script not found: ${scriptName}`);
    console.log('Available scripts:');
    listScripts();
  }
}

// CLI Setup
program
  .name('token-manager')
  .description('Comprehensive token management for the application')
  .version('1.0.0');

// generate command
program
  .command('generate')
  .description('Generate a new token')
  .option('-t, --type <type>', 'Token type (admin, user, sales, etc.)', 'admin')
  .option('-u, --userId <id>', 'User ID (defaults to admin UUID)')
  .option('-c, --companyId <id>', 'Company ID')
  .option('-e, --email <email>', 'User email')
  .option('-r, --roles <roles>', 'Comma-separated roles', val => val.split(','))
  .option('-p, --permissions <permissions>', 'Comma-separated permissions', val => val.split(','))
  .option('-x, --expiresIn <time>', 'Token expiration time', DEFAULT_EXPIRY)
  .option('-o, --output <path>', 'Output file path', path.join(GENERATED_DIR, 'token.txt'))
  .action(async (options) => {
    try {
      console.log(`🔑 Generating ${options.type} token...`);
      const result = await generateToken(options);
      console.log('\n✅ Token generated successfully!');
      console.log(`\nToken: ${result.token}`);
      console.log('\nPayload:');
      console.log(JSON.stringify(result.payload, null, 2));
      
      // Show usage examples
      console.log('\n📋 Usage examples:');
      console.log(`curl -X GET -H "Authorization: Bearer ${result.token}" http://localhost:5000/api/examples/protected`);
    } catch (error) {
      console.error('❌ Failed to generate token:', error);
    }
  });

// verify command
program
  .command('verify')
  .description('Verify a token')
  .option('-t, --token <token>', 'JWT token string')
  .option('-f, --file <path>', 'Path to token file')
  .action(async (options) => {
    let tokenString;
    
    if (options.token) {
      tokenString = options.token;
    } else if (options.file) {
      const filePath = path.resolve(options.file);
      try {
        tokenString = fs.readFileSync(filePath, 'utf8').trim();
      } catch (error) {
        console.error(`❌ Error reading token file: ${error.message}`);
        return;
      }
    } else {
      console.error('❌ Please provide either a token string or file path');
      return;
    }
    
    try {
      console.log('🔍 Verifying token...');
      const result = await verifyToken(tokenString);
      
      if (result.isValid) {
        console.log('\n✅ Token is valid!');
        console.log('\nDecoded payload:');
        console.log(JSON.stringify(result.decoded, null, 2));
        
        // Show expiration info
        const expiry = new Date(result.decoded.exp * 1000);
        const now = new Date();
        const timeRemaining = expiry > now 
          ? `${Math.round((expiry - now) / 1000 / 60)} minutes`
          : 'Expired';
        
        console.log(`\nExpires: ${expiry.toISOString()} (${timeRemaining})`);
      } else {
        console.error(`❌ Invalid token: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error verifying token:', error);
    }
  });

// list-scripts command
program
  .command('list-scripts')
  .description('List all available token scripts')
  .action(listScripts);

// list-tokens command
program
  .command('list-tokens')
  .description('List all generated tokens')
  .action(listTokens);

// run command
program
  .command('run <script>')
  .description('Run a specific token script')
  .action(runScript);

// store-token command
program
  .command('store-token')
  .description('Store a token securely with encryption')
  .option('-n, --name <name>', 'Name to identify the token')
  .option('-t, --token <token>', 'Token string to store')
  .option('-f, --file <path>', 'Path to file containing the token')
  .option('-m, --metadata <json>', 'Additional metadata in JSON format')
  .action(async (options) => {
    // Initialize a token store
    const tokenStore = new TokenStore();
    
    let tokenString;
    
    if (options.token) {
      tokenString = options.token;
    } else if (options.file) {
      try {
        tokenString = fs.readFileSync(path.resolve(options.file), 'utf8').trim();
      } catch (error) {
        console.error(`❌ Error reading token file: ${error.message}`);
        return;
      }
    } else {
      console.error('❌ Please provide either a token string or file path');
      return;
    }
    
    if (!options.name) {
      console.error('❌ Please provide a name for the token');
      return;
    }
    
    // Parse metadata if provided
    let metadata = {};
    if (options.metadata) {
      try {
        metadata = JSON.parse(options.metadata);
      } catch (error) {
        console.error(`❌ Error parsing metadata JSON: ${error.message}`);
        return;
      }
    }
    
    console.log(`🔒 Storing token '${options.name}' securely...`);
    const success = tokenStore.storeToken(options.name, tokenString, metadata);
    
    if (success) {
      console.log('✅ Token stored successfully!');
    } else {
      console.error('❌ Failed to store token.');
    }
  });

// secure-tokens command
program
  .command('secure-tokens')
  .description('Manage securely stored tokens')
  .option('-l, --list', 'List all secure tokens')
  .option('-g, --get <name>', 'Retrieve a secure token by name')
  .option('-d, --delete <name>', 'Delete a secure token by name')
  .option('-c, --clear', 'Delete all secure tokens')
  .action(async (options) => {
    // Initialize a token store
    const tokenStore = new TokenStore();
    
    // List tokens
    if (options.list) {
      console.log('🔑 Secure tokens:');
      const tokens = tokenStore.listTokens();
      
      if (tokens.length === 0) {
        console.log('  No secure tokens found');
      } else {
        tokens.forEach(token => {
          console.log(`- ${token.name}`);
          console.log(`  • Created: ${token.created}`);
          console.log(`  • Expires: ${token.expires}`);
          
          // Show metadata if available
          if (token.metadata && Object.keys(token.metadata).length > 0) {
            console.log(`  • Metadata: ${JSON.stringify(token.metadata)}`);
          }
          
          console.log();
        });
      }
      return;
    }
    
    // Get a token
    if (options.get) {
      const token = tokenStore.getToken(options.get);
      
      if (token) {
        console.log(`🔓 Token '${options.get}':`);
        console.log(token);
        
        // Try to verify the token
        try {
          const result = await verifyToken(token);
          if (result.isValid) {
            console.log('\n✅ Token is valid!');
            
            // Show expiration info
            const expiry = new Date(result.decoded.exp * 1000);
            const now = new Date();
            const timeRemaining = expiry > now 
              ? `${Math.round((expiry - now) / 1000 / 60)} minutes`
              : 'Expired';
            
            console.log(`\nExpires: ${expiry.toISOString()} (${timeRemaining})`);
            
            // Show payload summary
            if (result.decoded.userId) {
              console.log(`User ID: ${result.decoded.userId}`);
            }
            if (result.decoded.roles) {
              console.log(`Roles: ${result.decoded.roles.join(', ')}`);
            }
          } else {
            console.log(`\n⚠️ Token is not valid: ${result.error}`);
          }
        } catch (error) {
          console.error(`❌ Error verifying token: ${error.message}`);
        }
      } else {
        console.error(`❌ Token '${options.get}' not found or expired`);
      }
      return;
    }
    
    // Delete a token
    if (options.delete) {
      const success = tokenStore.deleteToken(options.delete);
      
      if (success) {
        console.log(`✅ Token '${options.delete}' deleted successfully`);
      } else {
        console.error(`❌ Failed to delete token '${options.delete}'`);
      }
      return;
    }
    
    // Clear all tokens
    if (options.clear) {
      console.log('⚠️ This will delete all secure tokens');
      console.log('Are you sure? (y/n)');
      
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        
        if (answer === 'y') {
          const success = tokenStore.deleteAllTokens();
          
          if (success) {
            console.log('✅ All tokens deleted successfully');
          } else {
            console.error('❌ Failed to delete all tokens');
          }
        } else {
          console.log('Operation canceled');
        }
        
        process.exit();
      });
      return;
    }
    
    // If no option provided, show help
    console.log('Please provide an option:');
    console.log('  --list (-l): List all secure tokens');
    console.log('  --get (-g) <name>: Retrieve a secure token by name');
    console.log('  --delete (-d) <name>: Delete a secure token by name');
    console.log('  --clear (-c): Delete all secure tokens');
  });

// check-env command
program
  .command('check-env')
  .description('Check required environment variables for token generation')
  .action(async () => {
    console.log('🔍 Checking token-related environment variables...');
    try {
      const { allPresent, results } = await secretChecker.checkTokenSecrets();
      
      console.log('\nEnvironment variable status:');
      for (const [key, value] of Object.entries(results)) {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Available' : 'Not available'}`);
      }
      
      if (allPresent) {
        console.log('\n✅ All required environment variables are available.');
      } else {
        console.log('\n❌ Some required environment variables are missing.');
        console.log('Required variables:');
        console.log('  - JWT_SECRET: Used to sign and verify JWT tokens');
        console.log('  - ADMIN_UUID: Used as the default user ID for admin tokens');
      }
    } catch (error) {
      console.error('❌ Error checking environment variables:', error.message);
    }
  });

// If no args, show help
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments and run
program.parse(process.argv);

// Export functions and classes for programmatic usage
export {
  generateToken,
  verifyToken,
  getJwtSecret,
  getAdminUuid,
  TokenStore,
  generateEncryptionKey
};