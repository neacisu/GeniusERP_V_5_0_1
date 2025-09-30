/**
 * Admin API Tests Runner
 * 
 * This script runs the admin API tests with proper environment setup
 * and token authentication.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running Admin API tests...');

// Execute the tests using tsx to handle TypeScript files with ESM
exec('npx tsx test-admin-api.ts', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing admin tests: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Test errors: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Admin API tests completed');
});