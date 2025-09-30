/**
 * Admin API Test Runner
 * 
 * This script provides a command-line interface to run the different 
 * Admin API test scripts.
 */

import { exec } from 'child_process';
import fs from 'fs';

// Available test options
const testOptions = [
  { id: 1, name: 'Direct Service Test', command: 'node direct-service-test.js' },
  { id: 2, name: 'Direct HTTP Test', command: 'node direct-http-test.js' },
  { id: 3, name: 'API Routes Test', command: 'node test-api-routes.js' },
  { id: 4, name: 'HTTP API Test', command: 'node run-direct-test.js' },
  { id: 5, name: 'cURL Test', command: './test-admin-curl.sh' },
  { id: 6, name: 'View README', command: 'cat README.md' }
];

// Print usage
console.log('\nADMIN API TEST RUNNER');
console.log('====================');
console.log('Available tests:');

testOptions.forEach(option => {
  console.log(`${option.id}. ${option.name}`);
});

console.log('\nUsage: node run-tests.js <test-number>');
console.log('Example: node run-tests.js 1');

// Get the test number from command line args
const testNumber = process.argv[2] ? parseInt(process.argv[2], 10) : null;

if (!testNumber) {
  console.log('\nNo test number provided. Please specify a test number.');
  process.exit(0);
}

// Find the requested test
const selectedTest = testOptions.find(test => test.id === testNumber);

if (!selectedTest) {
  console.error(`\nInvalid test number: ${testNumber}`);
  console.log(`Please choose a number between 1 and ${testOptions.length}`);
  process.exit(1);
}

// Run the selected test
console.log(`\nRunning: ${selectedTest.name}`);
console.log('-'.repeat(50));

// Make the curl script executable if needed
if (selectedTest.command.includes('curl') && !fs.statSync('test-admin-curl.sh').mode & 0o111) {
  console.log('Making curl script executable...');
  fs.chmodSync('test-admin-curl.sh', 0o755);
}

const child = exec(selectedTest.command);

// Pipe output to console
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// Handle completion
child.on('exit', (code) => {
  console.log('-'.repeat(50));
  console.log(`Test completed with exit code: ${code}`);
});