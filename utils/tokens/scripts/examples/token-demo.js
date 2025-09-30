#!/usr/bin/env node
/**
 * Token Manager Demo Script
 * 
 * This example demonstrates how to use the token manager programmatically.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateToken, verifyToken } from '../../token-manager.js';
import secretChecker from '../../verify/secret-check.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DEMO_TOKEN_PATH = path.join(__dirname, '../../generated/demo-token.txt');

/**
 * Run a complete token management demo
 */
async function runTokenDemo() {
  console.log('🚀 Running token manager demo...\n');
  
  // Step 1: Check environment
  console.log('Step 1: Checking environment variables');
  const { allPresent, results } = await secretChecker.checkTokenSecrets();
  
  if (!allPresent) {
    console.error('❌ Missing required environment variables. Demo cannot continue.');
    console.log('Required variables:');
    
    for (const [key, exists] of Object.entries(results)) {
      console.log(`${exists ? '✅' : '❌'} ${key}`);
    }
    
    return false;
  }
  
  console.log('✅ All required environment variables are available.\n');
  
  // Step 2: Generate a token
  console.log('Step 2: Generating a demo token');
  try {
    const tokenOptions = {
      type: 'demo',
      roles: ['user', 'demo'],
      permissions: ['read:demo', 'write:demo'],
      expiresIn: '1h',
      output: DEMO_TOKEN_PATH,
      additionalFields: {
        purpose: 'demonstration',
        demo_id: 'demo-123',
        created_by: 'token-demo.js'
      }
    };
    
    console.log('Token options:', JSON.stringify(tokenOptions, null, 2));
    const result = await generateToken(tokenOptions);
    
    console.log('✅ Token generated successfully!');
    console.log('Token (first 20 chars):', result.token.substring(0, 20) + '...');
    console.log('Payload:', JSON.stringify(result.payload, null, 2));
    console.log('\n');
    
    // Step 3: Verify the token
    console.log('Step 3: Verifying the generated token');
    const verificationResult = await verifyToken(result.token);
    
    if (verificationResult.isValid) {
      console.log('✅ Token verification successful!');
      
      // Show expiration info
      const expiry = new Date(verificationResult.decoded.exp * 1000);
      const now = new Date();
      const timeRemaining = Math.round((expiry - now) / 1000 / 60);
      
      console.log(`Token expires in ${timeRemaining} minutes`);
      console.log('Decoded payload:', JSON.stringify(verificationResult.decoded, null, 2));
    } else {
      console.error('❌ Token verification failed:', verificationResult.error);
      return false;
    }
    
    console.log('\n');
    
    // Step 4: Show usage example
    console.log('Step 4: Token usage example');
    console.log('To use this token with curl:');
    console.log(`curl -X GET -H "Authorization: Bearer ${result.token}" http://localhost:5000/api/examples/protected`);
    
    return true;
  } catch (error) {
    console.error('❌ Error during token demo:', error.message);
    return false;
  }
}

// Run the demo
runTokenDemo()
  .then(success => {
    if (success) {
      console.log('\n🎉 Token manager demo completed successfully!');
    } else {
      console.log('\n❌ Token manager demo failed. See errors above.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });