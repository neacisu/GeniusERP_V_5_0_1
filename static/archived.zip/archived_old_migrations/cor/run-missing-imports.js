/**
 * Run Missing Imports - Runner Script
 * 
 * This script runs the import-missing-occupations.js script repeatedly
 * until all the missing occupations are imported (progress file removed).
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROGRESS_FILE = path.join(__dirname, 'missing-import-progress.json');
const IMPORT_SCRIPT = 'import-missing-occupations.js';
const MAX_ATTEMPTS = 50;
const WAIT_BETWEEN_ATTEMPTS_MS = 5000;

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run a command and wait for completion
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
    
    // Pipe output to console
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

// Run until complete
async function runUntilComplete() {
  console.log('Starting continuous import process...');
  
  let attempts = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    
    console.log(`\n=== Run attempt ${attempts}/${MAX_ATTEMPTS} ===`);
    
    try {
      // Run the import script
      await runCommand(`node ${IMPORT_SCRIPT}`);
      
      // Check if progress file exists
      if (!fs.existsSync(PROGRESS_FILE)) {
        console.log('\n🎉 Import process completed successfully!');
        break;
      }
      
      console.log(`\nProgress file still exists, more imports needed`);
      console.log(`Waiting ${WAIT_BETWEEN_ATTEMPTS_MS/1000} seconds before next attempt...`);
      await sleep(WAIT_BETWEEN_ATTEMPTS_MS);
      
    } catch (error) {
      console.error(`Error in run attempt ${attempts}:`, error);
      console.log(`Waiting ${WAIT_BETWEEN_ATTEMPTS_MS/1000} seconds before retrying...`);
      await sleep(WAIT_BETWEEN_ATTEMPTS_MS);
    }
  }
  
  if (attempts >= MAX_ATTEMPTS) {
    console.log('\n⚠️ Reached maximum number of attempts');
    console.log('Please check for errors and run the script again if needed');
  }
  
  // Check final stats
  try {
    console.log('\n=== Final COR statistics ===');
    await runCommand('curl http://localhost:5000/api/hr/cor/stats');
  } catch (error) {
    console.error('Error getting final stats:', error);
  }
}

// Execute the function
runUntilComplete();