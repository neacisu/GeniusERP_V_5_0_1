/**
 * COR Occupation Complete Import Script
 * 
 * This script coordinates the entire COR import process from CSV to database.
 * It extracts data, generates SQL files, and executes the SQL imports.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');
const EXPECTED_TOTAL = 4247;
const LOG_FILE = path.resolve(__dirname, 'cor_full_import.log');

// Create or clear log file
fs.writeFileSync(LOG_FILE, '');

// Function to log to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Function to run a script and return a promise
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    log(`Running script: ${scriptPath} ${args.join(' ')}`);
    
    const process = spawn('node', [scriptPath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      log(`[OUT] ${output.trim()}`);
    });
    
    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      log(`[ERR] ${output.trim()}`);
    });
    
    process.on('close', (code) => {
      log(`Script ${scriptPath} completed with exit code: ${code}`);
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Script ${scriptPath} failed with exit code ${code}\n${stderr}`));
      }
    });
    
    process.on('error', (err) => {
      log(`Error executing ${scriptPath}: ${err.message}`);
      reject(err);
    });
  });
}

// Main function
async function importCorData() {
  try {
    log('===== Starting COR complete import process =====');
    log(`${new Date().toISOString()}`);
    log(`Expected total occupations: ${EXPECTED_TOTAL}`);
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found: ${CSV_FILE_PATH}`);
    }
    
    log(`CSV file found: ${CSV_FILE_PATH}`);
    
    // Step 1: Extract CSV data and generate SQL files
    log('\n===== Step 1: Extracting CSV data and generating SQL files =====');
    await runScript('./extract-cor-csv.js');
    
    // Verify SQL files were created
    const groupsFile = path.resolve(__dirname, 'cor-groups.sql');
    if (!fs.existsSync(groupsFile)) {
      throw new Error('Groups SQL file was not generated');
    }
    
    const sqlBatchFiles = fs.readdirSync(__dirname)
      .filter(file => /^cor-occupations-batch\d+\.sql$/.test(file));
    
    log(`Generated ${sqlBatchFiles.length} SQL batch files`);
    
    // Step 2: Execute SQL files
    log('\n===== Step 2: Executing SQL files =====');
    await runScript('./execute-cor-sql.js');
    
    // Step 3: Generate verification report
    log('\n===== Step 3: Generating verification report =====');
    await runScript('./cor-import-status.js');
    
    // Final summary
    log('\n===== COR import process completed successfully =====');
    log(`${new Date().toISOString()}`);
    log('Check cor-verification-report.json for detailed status');
    
  } catch (error) {
    log(`\n===== ERROR: Import process failed =====`);
    log(`Error: ${error.message}`);
    log(`Stack trace: ${error.stack}`);
    
    // Attempt to recover or provide guidance
    log('\nRecovery options:');
    log('1. Run ./execute-cor-sql.js directly to continue SQL file execution');
    log('2. Run ./direct-batch-import.js for an API-based import approach');
    log('3. Run ./import-cor-from-csv-direct.js for direct database approach');
    
    process.exit(1);
  }
}

// Start the import process
importCorData().catch(error => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});