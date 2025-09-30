/**
 * Direct Admin API Tests Runner
 * 
 * This script runs the direct admin API tests using Node's native HTTP module.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running Direct Admin API tests...');

// Execute the tests using Node directly since it's a plain JS file (no TypeScript)
exec('node direct-admin-test.js', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing admin tests: ${error.message}`);
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Test errors: ${stderr}`);
  }
  
  console.log(stdout);
  console.log('Direct Admin API tests completed');
});