/**
 * Complete COR Import Runner
 * 
 * This script runs the final COR import script repeatedly until all occupations are imported.
 * It uses the existence of the progress file to determine if more runs are needed.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const PROGRESS_FILE = path.resolve(__dirname, 'cor-import-progress.json');
const EXPECTED_OCCUPATIONS = 4247;
const SCRIPT_NAME = './direct-batch-import.js'; // Script to execute repeatedly
const CHECK_INTERVAL = 2000; // 2 seconds

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to run the import script repeatedly until complete
async function runUntilComplete() {
  console.log(`Starting continuous COR import process using ${SCRIPT_NAME}...`);
  console.log(`Will continue running until all ${EXPECTED_OCCUPATIONS} occupations are imported.`);
  
  let runCount = 0;
  let lastCount = 0;
  
  while (true) {
    runCount++;
    console.log(`\n=== Starting import run #${runCount} ===`);
    
    try {
      // Run the script as a child process
      const process = spawn('node', [SCRIPT_NAME], {
        stdio: 'inherit'
      });
      
      // Wait for the process to complete
      await new Promise((resolve, reject) => {
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            console.error(`Import process exited with code ${code}`);
            resolve(); // Continue despite error
          }
        });
        
        process.on('error', (err) => {
          console.error('Error executing import script:', err);
          resolve(); // Continue despite error
        });
      });
      
      // Check if we have a progress file
      let currentCount = 0;
      if (fs.existsSync(PROGRESS_FILE)) {
        try {
          const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
          currentCount = progress.imported || 0;
          
          console.log(`Current progress: ${currentCount}/${EXPECTED_OCCUPATIONS} occupations imported`);
          
          if (currentCount === lastCount) {
            console.log('No new occupations imported in this run. Checking if complete...');
          } else {
            console.log(`Imported ${currentCount - lastCount} new occupations in this run`);
          }
          
          lastCount = currentCount;
          
          // Check if we've imported all occupations
          if (currentCount >= EXPECTED_OCCUPATIONS) {
            console.log('\n=== COR import process complete! ===');
            console.log(`Successfully imported ${currentCount} occupations in ${runCount} runs.`);
            
            // Clean up progress file
            fs.unlinkSync(PROGRESS_FILE);
            console.log('Cleaned up progress file.');
            
            break;
          }
        } catch (error) {
          console.error('Error reading progress file:', error);
        }
      } else {
        console.log('Progress file not found. Will continue with next run.');
      }
      
      // Wait a bit before starting the next run
      console.log(`Waiting ${CHECK_INTERVAL/1000} seconds before next run...`);
      await sleep(CHECK_INTERVAL);
    } catch (error) {
      console.error('Error in run loop:', error);
      await sleep(CHECK_INTERVAL);
    }
  }
  
  console.log('\nCOR import process has been completed successfully.');
}

// Start the continuous import process
runUntilComplete().catch(console.error);