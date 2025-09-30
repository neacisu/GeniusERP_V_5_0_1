/**
 * Custom Stripe Installation Script
 * 
 * This script installs the Stripe SDK directly without going through
 * the package.json file.
 */
import { exec } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Execute command and return a promise
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      
      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Check if package.json exists
if (!fs.existsSync('./package.json')) {
  console.error('package.json not found!');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Check if stripe is already in the dependencies
if (packageJson.dependencies && packageJson.dependencies.stripe) {
  console.log(`Stripe is already installed at version ${packageJson.dependencies.stripe}`);
  process.exit(0);
}

// Install stripe
console.log('Installing stripe...');
execPromise('npm install stripe --no-save')
  .then(() => {
    console.log('Stripe installed successfully!');
    
    // Update package.json manually
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies.stripe = '^13.1.0'; // Use latest compatible version
    
    // Write back to package.json
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    console.log('package.json updated with stripe dependency');
  })
  .catch(error => {
    console.error('Failed to install stripe:', error);
    process.exit(1);
  });