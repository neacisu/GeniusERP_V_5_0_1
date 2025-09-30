/**
 * Cleanup Utility for Temporary and Placeholder Files
 * 
 * This script identifies and optionally removes temporary and placeholder files
 * from the codebase to clean up clutter.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Patterns to match temporary and placeholder files
const tempPatterns = [
  /\.tmp$/i,
  /\.temp$/i,
  /temp\./i,
  /placeholder/i,
  /-placeholder/i,
  /placeholder-/i
];

// Directories to exclude
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build'
];

// File extensions to include (empty means all)
const includeExtensions = [
  '.ts',
  '.js',
  '.md',
  '.json'
];

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Check if a path should be excluded
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path should be excluded
 */
function shouldExclude(filePath) {
  return excludeDirs.some(dir => filePath.includes(`/${dir}/`));
}

/**
 * Check if a file is temporary or placeholder
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is temporary/placeholder
 */
function isTempFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Check if file matches any temp pattern
  return tempPatterns.some(pattern => pattern.test(fileName));
}

/**
 * Check if file extension should be included
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file extension should be included
 */
function shouldIncludeExtension(filePath) {
  // If no extensions are specified, include all
  if (includeExtensions.length === 0) {
    return true;
  }
  
  const ext = path.extname(filePath).toLowerCase();
  return includeExtensions.includes(ext);
}

/**
 * Find temporary and placeholder files recursively
 * @param {string} dir - Directory to start from
 * @param {Array} results - Accumulated results
 * @returns {Array} List of temporary/placeholder files
 */
function findTempFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (shouldExclude(filePath)) {
      continue;
    }
    
    if (stat.isDirectory()) {
      findTempFiles(filePath, results);
    } else if (stat.isFile() && isTempFile(filePath) && shouldIncludeExtension(filePath)) {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Remove files from the list
 * @param {Array} files - Files to remove
 */
function removeFiles(files) {
  let removed = 0;
  let failed = 0;
  
  for (const file of files) {
    try {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
      removed++;
    } catch (error) {
      console.error(`❌ Failed to remove ${file}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nRemoval complete: ${removed} files removed, ${failed} failed`);
}

/**
 * Main function to run the cleanup
 */
async function runCleanup() {
  console.log('Starting cleanup of temporary and placeholder files...\n');
  
  // Find temporary files
  const rootDir = path.resolve('./');
  console.log(`Scanning directory: ${rootDir}`);
  console.log('This may take a moment...\n');
  
  const tempFiles = findTempFiles(rootDir);
  
  if (tempFiles.length === 0) {
    console.log('No temporary or placeholder files found.');
    rl.close();
    return;
  }
  
  console.log(`Found ${tempFiles.length} temporary/placeholder files:`);
  tempFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });
  
  // Ask for confirmation
  rl.question('\nDo you want to remove these files? (y/n) ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      removeFiles(tempFiles);
    } else {
      console.log('Cleanup aborted by user');
    }
    
    rl.close();
  });
}

// Run the cleanup if executed directly
if (require.main === module) {
  runCleanup();
}