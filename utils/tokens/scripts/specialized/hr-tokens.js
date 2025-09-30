#!/usr/bin/env node
/**
 * HR Token Generator
 * 
 * This script generates tokens for HR module access with appropriate roles
 * and permissions for different HR user types.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken } from '../../token-manager.js';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const GENERATED_DIR = path.join(__dirname, '../../generated');
const HR_ROLES = {
  ADMIN: 'hr_admin',
  MANAGER: 'hr_manager',
  SPECIALIST: 'hr_specialist',
  VIEWER: 'hr_viewer'
};

// Permission sets for HR roles
const HR_PERMISSIONS = {
  [HR_ROLES.ADMIN]: [
    'hr:read:all',
    'hr:write:all',
    'hr:delete:all',
    'contracts:read:all',
    'contracts:write:all',
    'payroll:read:all',
    'payroll:write:all',
    'employees:read:all',
    'employees:write:all',
    'employees:delete'
  ],
  [HR_ROLES.MANAGER]: [
    'hr:read:all',
    'hr:write:department',
    'contracts:read:all',
    'contracts:write:department',
    'payroll:read:department',
    'payroll:write:department',
    'employees:read:all',
    'employees:write:department'
  ],
  [HR_ROLES.SPECIALIST]: [
    'hr:read:assigned',
    'hr:write:assigned',
    'contracts:read:assigned',
    'contracts:write:assigned',
    'payroll:read:assigned',
    'employees:read:assigned'
  ],
  [HR_ROLES.VIEWER]: [
    'hr:read:department',
    'contracts:read:view',
    'employees:read:limited'
  ]
};

/**
 * Generate an HR token with the specified role
 * @param {string} role - HR role (from HR_ROLES)
 * @param {object} options - Additional token options
 * @returns {Promise<object>} Token generation result
 */
async function generateHrToken(role, options = {}) {
  if (!Object.values(HR_ROLES).includes(role)) {
    throw new Error(`Invalid HR role: ${role}. Valid roles are: ${Object.values(HR_ROLES).join(', ')}`);
  }
  
  const permissions = HR_PERMISSIONS[role] || [];
  const roles = ['hr', role];
  
  if (options.additionalRoles) {
    roles.push(...options.additionalRoles);
  }
  
  const tokenOptions = {
    type: 'hr',
    roles,
    permissions,
    expiresIn: options.expiresIn || '7d',
    output: options.output || path.join(GENERATED_DIR, `hr-${role}-token.txt`),
    additionalFields: {
      departmentId: options.departmentId || 'hr-department',
      ...options.additionalFields
    }
  };
  
  if (options.userId) {
    tokenOptions.userId = options.userId;
  }
  
  if (options.email) {
    tokenOptions.email = options.email;
  }
  
  return generateToken(tokenOptions);
}

/**
 * Generate all HR role tokens
 * @returns {Promise<Array>} Results of all token generations
 */
async function generateAllHrTokens() {
  const results = [];
  
  for (const role of Object.values(HR_ROLES)) {
    console.log(`\n🔑 Generating ${role} token...`);
    const result = await generateHrToken(role);
    console.log(`✅ Generated ${role} token: ${result.token.substring(0, 20)}...`);
    results.push(result);
  }
  
  return results;
}

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const role = process.argv[2] || 'all';
  
  if (role === 'all') {
    generateAllHrTokens()
      .then(() => {
        console.log('\n🎉 All HR tokens generated successfully!');
      })
      .catch(error => {
        console.error('\n❌ Error generating HR tokens:', error.message);
      });
  } else {
    generateHrToken(role)
      .then(result => {
        console.log(`\n✅ Generated ${role} token successfully!`);
        console.log(`Token: ${result.token.substring(0, 20)}...`);
        console.log(`\nRoles: ${result.payload.roles.join(', ')}`);
        console.log(`Permissions: ${result.payload.permissions.join(', ')}`);
      })
      .catch(error => {
        console.error(`\n❌ Error generating ${role} token:`, error.message);
      });
  }
}

// Export functions for programmatic usage
export {
  generateHrToken,
  generateAllHrTokens,
  HR_ROLES,
  HR_PERMISSIONS
};