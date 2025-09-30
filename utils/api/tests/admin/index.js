/**
 * Admin API Testing Index
 * 
 * This file documents the available test scripts and provides a simple
 * command-line interface to run them.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TESTS = [
  {
    name: 'Direct Service Test',
    description: 'Test Admin Setup Service directly (bypasses HTTP)',
    script: 'direct-service-test.js',
    command: 'node direct-service-test.js'
  },
  {
    name: 'HTTP API Test',
    description: 'Test Admin API endpoints using HTTP requests',
    script: 'direct-admin-test.js',
    command: 'node run-direct-test.js'
  },
  {
    name: 'cURL Test',
    description: 'Test Admin API endpoints using curl commands',
    script: 'test-admin-curl.sh',
    command: './test-admin-curl.sh'
  }
];

/**
 * Print the list of available tests
 */
function printTestList() {
  console.log('Available Admin API Tests:');
  console.log('==========================');
  
  TESTS.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Command: ${test.command}`);
    console.log();
  });
  
  console.log('Usage:');
  console.log('  node index.js [test-number]');
  console.log('  Example: node index.js 1');
}

/**
 * Run a specific test by index
 * @param {number} index Test index (1-based)
 */
function runTest(index) {
  const testIndex = index - 1;
  
  if (testIndex < 0 || testIndex >= TESTS.length) {
    console.error(`Error: Invalid test number (${index}). Choose between 1 and ${TESTS.length}.`);
    return;
  }
  
  const test = TESTS[testIndex];
  console.log(`Running test: ${test.name}`);
  console.log(`Command: ${test.command}`);
  console.log('='.repeat(50));
  
  const args = test.command.split(' ').slice(1);
  const testProcess = spawn(test.command.split(' ')[0], args, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    console.log('='.repeat(50));
    console.log(`Test finished with code: ${code}`);
  });
}

// Main execution
const testNumber = process.argv[2] ? parseInt(process.argv[2], 10) : null;

if (testNumber) {
  runTest(testNumber);
} else {
  printTestList();
}