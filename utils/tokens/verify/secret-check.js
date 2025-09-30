/**
 * Secret Checker Utility
 * 
 * This utility checks for the presence of token-related secrets in the environment.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a secret is present in the environment
 * @param {string} secretName - The name of the secret to check
 * @returns {Promise<boolean>} - Whether the secret is present
 */
async function checkSecret(secretName) {
  try {
    const { stdout } = await execAsync(`echo $${secretName}`);
    const value = stdout.trim();
    return !!value; // Convert to boolean
  } catch (error) {
    console.error(`Error checking secret ${secretName}:`, error.message);
    return false;
  }
}

/**
 * Check all required token secrets
 * @returns {Promise<{allPresent: boolean, results: {[key: string]: boolean}}>} - Results of the check
 */
async function checkTokenSecrets() {
  const requiredSecrets = ['JWT_SECRET', 'ADMIN_UUID'];
  const results = {};
  
  // Check each secret
  for (const secret of requiredSecrets) {
    results[secret] = await checkSecret(secret);
  }
  
  // Check if all secrets are present
  const allPresent = Object.values(results).every(Boolean);
  
  return { allPresent, results };
}

export default {
  checkSecret,
  checkTokenSecrets
};