/**
 * Generate a new token directly using the auth.service.ts structure
 * 
 * This creates a token that matches our auth service implementation
 * without requiring external dependencies.
 */
import { exec } from 'child_process';
import fs from 'node:fs';

// Run the existing token generator script which already has all dependencies
exec('node generate-token.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing token generator: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Token generator stderr: ${stderr}`);
    return;
  }
  
  console.log(`Token generated: ${stdout}`);
  
  // Check if the token was created in the expected file
  if (fs.existsSync('./new-token.txt')) {
    const token = fs.readFileSync('./new-token.txt', 'utf-8').trim();
    
    // Copy the token to app-token.txt for our tests
    fs.writeFileSync('./app-token.txt', token);
    console.log(`Token copied to app-token.txt: ${token}`);
  } else {
    console.error("Token file not found. Check if generate-token.js created new-token.txt");
  }
});