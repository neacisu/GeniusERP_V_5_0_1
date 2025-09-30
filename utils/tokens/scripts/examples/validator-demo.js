#!/usr/bin/env node
/**
 * Token Validator Demo Script
 * 
 * This example demonstrates how to use the token validator for advanced
 * token validation scenarios including role and permission checking.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateToken } from '../../token-manager.js';
import tokenValidator from '../../verify/token-validator.js';
import { generateHrToken, HR_ROLES } from '../specialized/hr-tokens.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DEMO_TOKEN_PATH = path.join(__dirname, '../../generated/validator-demo-token.txt');

/**
 * Run the token validator demonstration
 */
async function runValidatorDemo() {
  console.log('🚀 Running token validator demo...\n');
  
  // Step 1: Generate a token with specific roles and permissions for testing
  console.log('Step 1: Generating a demo token with specific roles and permissions');
  
  try {
    const tokenOptions = {
      type: 'validator-demo',
      roles: ['user', 'admin', 'reporting'],
      permissions: ['read:users', 'write:reports', 'delete:own-data'],
      expiresIn: '15m', // Short expiration to demonstrate expiration checking
      output: DEMO_TOKEN_PATH,
      additionalFields: {
        purpose: 'validator-demonstration',
        demo_id: 'validator-123'
      }
    };
    
    const result = await generateToken(tokenOptions);
    const token = result.token;
    
    console.log('✅ Token generated successfully!');
    console.log(`Token (first 20 chars): ${token.substring(0, 20)}...`);
    console.log('\n');
    
    // Step 2: Perform basic role checking
    console.log('Step 2: Checking for required roles');
    
    console.log('2.1: Checking for roles that exist in the token:');
    const presentRolesCheck = await tokenValidator.checkRoles(token, ['user', 'admin']);
    
    if (presentRolesCheck.hasRoles) {
      console.log('✅ Token has all required roles!');
    } else {
      console.log('❌ Token is missing roles:', presentRolesCheck.missingRoles.join(', '));
    }
    
    console.log('\n2.2: Checking for roles that do not exist in the token:');
    const missingRolesCheck = await tokenValidator.checkRoles(token, ['user', 'finance']);
    
    if (missingRolesCheck.hasRoles) {
      console.log('✅ Token has all required roles!');
    } else {
      console.log('❌ Token is missing roles:', missingRolesCheck.missingRoles.join(', '));
    }
    console.log('\n');
    
    // Step 3: Perform permission checking
    console.log('Step 3: Checking for required permissions');
    
    console.log('3.1: Checking for permissions that exist in the token:');
    const presentPermissionsCheck = await tokenValidator.checkPermissions(token, ['read:users', 'write:reports']);
    
    if (presentPermissionsCheck.hasPermissions) {
      console.log('✅ Token has all required permissions!');
    } else {
      console.log('❌ Token is missing permissions:', presentPermissionsCheck.missingPermissions.join(', '));
    }
    
    console.log('\n3.2: Checking for permissions that do not exist in the token:');
    const missingPermissionsCheck = await tokenValidator.checkPermissions(token, ['read:users', 'admin:system']);
    
    if (missingPermissionsCheck.hasPermissions) {
      console.log('✅ Token has all required permissions!');
    } else {
      console.log('❌ Token is missing permissions:', missingPermissionsCheck.missingPermissions.join(', '));
    }
    console.log('\n');
    
    // Step 4: Check token expiration status
    console.log('Step 4: Checking token expiration status');
    
    console.log('4.1: Checking with default warning threshold (60 minutes):');
    const expirationCheck1 = await tokenValidator.checkExpiration(token);
    
    console.log(`Token status: ${expirationCheck1.status}`);
    console.log(`Minutes remaining: ${expirationCheck1.minutesRemaining}`);
    
    console.log('\n4.2: Checking with custom warning threshold (20 minutes):');
    const expirationCheck2 = await tokenValidator.checkExpiration(token, 20);
    
    console.log(`Token status: ${expirationCheck2.status}`);
    console.log(`Minutes remaining: ${expirationCheck2.minutesRemaining}`);
    console.log('\n');
    
    // Step 5: Perform complete validation
    console.log('Step 5: Performing complete token validation');
    
    const validationResult = await tokenValidator.validateToken(token, {
      requiredRoles: ['user', 'finance'],
      requiredPermissions: ['read:users', 'admin:system'],
      warningThresholdMinutes: 20
    });
    
    console.log('Complete validation result:');
    console.log(JSON.stringify(validationResult, null, 2));
    console.log('\n');
    
    // Step 6: Generate and validate an HR token
    console.log('Step 6: Validating a specialized HR token');
    
    // Generate an HR manager token
    const hrToken = await generateHrToken(HR_ROLES.MANAGER, {
      expiresIn: '1h',
      departmentId: 'hr-validation-demo'
    });
    
    // Validate the HR token
    const hrValidation = await tokenValidator.validateToken(hrToken.token, {
      requiredRoles: ['hr', HR_ROLES.MANAGER],
      requiredPermissions: ['hr:read:all', 'payroll:read:department'],
      warningThresholdMinutes: 30
    });
    
    console.log('HR token validation result:');
    console.log(JSON.stringify(hrValidation, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error during validator demo:', error.message);
    return false;
  }
}

// Run the demo
runValidatorDemo()
  .then(success => {
    if (success) {
      console.log('\n🎉 Token validator demo completed successfully!');
    } else {
      console.log('\n❌ Token validator demo failed. See errors above.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });