#!/usr/bin/env node
/**
 * Legacy Token Generator
 * 
 * This is a legacy token generator maintained for backward compatibility.
 * New code should use the token-manager.js CLI instead.
 * 
 * This script will print a deprecation warning and redirect to the new token manager.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken } from '../../token-manager.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DEFAULT_OUTPUT = path.join(__dirname, '../../generated/legacy-token.txt');

/**
 * Show deprecation warning
 */
function showDeprecationWarning() {
  console.log('\n⚠️  DEPRECATION WARNING ⚠️');
  console.log('----------------------------');
  console.log('This legacy token generator is maintained only for backward compatibility.');
  console.log('Please use the new token manager CLI for all token operations:');
  console.log('  node utils/tokens/token-manager.js generate [options]');
  console.log('\nContinuing with legacy operation...\n');
}

/**
 * Generate a token using legacy parameters but with the new token manager
 * @param {object} options - Legacy options
 * @returns {Promise<object>} - Token generation result
 */
async function generateLegacyToken(options = {}) {
  showDeprecationWarning();
  
  // Map legacy parameters to new format
  const newOptions = {
    type: options.type || 'admin',
    userId: options.userId,
    email: options.email,
    expiresIn: options.expiresIn || '24h',
    output: options.output || DEFAULT_OUTPUT
  };
  
  // Handle legacy role format
  if (options.role) {
    newOptions.roles = [options.role];
  }
  
  console.log('Redirecting to new token manager with the following options:');
  console.log(JSON.stringify(newOptions, null, 2));
  
  return generateToken(newOptions);
}

// Parse command line arguments in legacy format
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' || arg === '-t') {
      options.type = args[++i];
    } else if (arg === '--role' || arg === '-r') {
      options.role = args[++i];
    } else if (arg === '--userId' || arg === '-u') {
      options.userId = args[++i];
    } else if (arg === '--email' || arg === '-e') {
      options.email = args[++i];
    } else if (arg === '--expires' || arg === '-x') {
      options.expiresIn = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    }
  }
  
  return options;
}

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArgs();
  
  generateLegacyToken(options)
    .then(result => {
      console.log('\n✅ Legacy token generated successfully!');
      console.log(`Token: ${result.token.substring(0, 20)}...`);
      console.log('\nToken saved to:', options.output || DEFAULT_OUTPUT);
    })
    .catch(error => {
      console.error('\n❌ Error generating legacy token:', error.message);
    });
}

// Export for programmatic usage
export default generateLegacyToken;