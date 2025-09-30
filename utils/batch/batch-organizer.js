/**
 * Batch File Organizer
 * 
 * This utility organizes batch files into structured directories
 * and provides tools for managing batch processing.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Default configuration
const config = {
  sourcePattern: /^([a-z-]+)-batch(\d+)\.sql$/i,
  destinationDir: './imports/{type}/batches',
  createIndex: true,
  verbose: true
};

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Batch file organizer for managing batch files
 */
class BatchOrganizer {
  /**
   * Create a new batch organizer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...config, ...options };
  }

  /**
   * Find batch files in the codebase
   * @param {string} rootDir - Directory to start from
   * @param {Object} options - Search options
   * @returns {Object} Found batch files grouped by type
   */
  findBatchFiles(rootDir = '.', options = {}) {
    const {
      pattern = this.config.sourcePattern,
      excludeDirs = ['node_modules', '.git', 'dist', 'build']
    } = options;
    
    console.log(`Searching for batch files in ${rootDir}...`);
    
    const batchFiles = {};
    
    const processDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !excludeDirs.includes(file)) {
          processDir(filePath);
        } else if (stat.isFile()) {
          const match = file.match(pattern);
          
          if (match) {
            const [, type, batchNum] = match;
            
            // Initialize type group if not exists
            if (!batchFiles[type]) {
              batchFiles[type] = [];
            }
            
            batchFiles[type].push({
              path: filePath,
              name: file,
              type,
              batchNum: parseInt(batchNum, 10)
            });
          }
        }
      }
    };
    
    processDir(rootDir);
    
    // Sort batch files by batch number
    for (const type in batchFiles) {
      batchFiles[type].sort((a, b) => a.batchNum - b.batchNum);
    }
    
    if (this.config.verbose) {
      console.log('Found batch files:');
      for (const type in batchFiles) {
        console.log(`- ${type}: ${batchFiles[type].length} files`);
      }
    }
    
    return batchFiles;
  }

  /**
   * Organize batch files into structured directories
   * @param {Object} batchFiles - Batch files to organize
   * @returns {Object} Organization results
   */
  organizeBatchFiles(batchFiles) {
    const results = {
      organized: 0,
      skipped: 0,
      failed: 0,
      types: {}
    };
    
    for (const type in batchFiles) {
      const files = batchFiles[type];
      
      // Create type-specific results
      results.types[type] = {
        organized: 0,
        skipped: 0,
        failed: 0,
        batches: files.length
      };
      
      // Create destination directory
      const destDir = this.config.destinationDir.replace('{type}', type);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        
        if (this.config.verbose) {
          console.log(`Created directory: ${destDir}`);
        }
      }
      
      // Process each batch file
      for (const file of files) {
        const destPath = path.join(destDir, file.name);
        
        // Skip if file already exists in destination
        if (fs.existsSync(destPath)) {
          results.skipped++;
          results.types[type].skipped++;
          
          if (this.config.verbose) {
            console.log(`Skipped (already exists): ${file.path} -> ${destPath}`);
          }
          
          continue;
        }
        
        try {
          // Copy file to destination
          fs.copyFileSync(file.path, destPath);
          
          results.organized++;
          results.types[type].organized++;
          
          if (this.config.verbose) {
            console.log(`Organized: ${file.path} -> ${destPath}`);
          }
        } catch (error) {
          results.failed++;
          results.types[type].failed++;
          
          console.error(`Failed to organize ${file.path}:`, error.message);
        }
      }
      
      // Create index file if requested
      if (this.config.createIndex) {
        this.createIndexFile(type, files, destDir);
      }
    }
    
    return results;
  }

  /**
   * Create an index file for batch files
   * @param {string} type - Batch type
   * @param {Array} files - Batch files
   * @param {string} destDir - Destination directory
   * @returns {boolean} Success status
   */
  createIndexFile(type, files, destDir) {
    const indexPath = path.join(destDir, 'index.js');
    
    try {
      let indexContent = `/**
 * ${type.toUpperCase()} Batch Files Index
 * 
 * This file provides utilities for working with ${type} batch files.
 */

const fs = require('fs');
const path = require('path');

// Batch files metadata
const batchFiles = [
`;
      
      // Add metadata for each batch file
      for (const file of files) {
        indexContent += `  {
    name: '${file.name}',
    batchNum: ${file.batchNum},
    path: path.join(__dirname, '${file.name}')
  },
`;
      }
      
      indexContent += `];

/**
 * Get SQL content from a batch file
 * @param {number} batchNum - Batch number
 * @returns {string|null} SQL content or null if not found
 */
function getBatchSQL(batchNum) {
  const batchFile = batchFiles.find(file => file.batchNum === batchNum);
  
  if (!batchFile) {
    return null;
  }
  
  return fs.readFileSync(batchFile.path, 'utf8');
}

/**
 * Get all batch files SQL content
 * @returns {Array} Array of SQL content from all batch files
 */
function getAllBatchesSQL() {
  return batchFiles.map(file => ({
    batchNum: file.batchNum,
    sql: fs.readFileSync(file.path, 'utf8')
  }));
}

// Export utilities
module.exports = {
  batchFiles,
  getBatchSQL,
  getAllBatchesSQL
};
`;
      
      // Write index file
      fs.writeFileSync(indexPath, indexContent);
      
      if (this.config.verbose) {
        console.log(`Created index file: ${indexPath}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to create index file for ${type}:`, error.message);
      return false;
    }
  }

  /**
   * Run the batch file organization
   * @param {string} rootDir - Directory to start from
   * @returns {Object} Organization results
   */
  run(rootDir = '.') {
    // Find batch files
    const batchFiles = this.findBatchFiles(rootDir);
    
    // Organize batch files
    const results = this.organizeBatchFiles(batchFiles);
    
    // Print summary
    console.log('\nBatch File Organization Summary:');
    console.log(`Total types: ${Object.keys(results.types).length}`);
    console.log(`Total files: ${results.organized + results.skipped + results.failed}`);
    console.log(`Organized: ${results.organized}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Failed: ${results.failed}`);
    
    return results;
  }
}

// Export utilities
module.exports = {
  BatchOrganizer
};

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const organizer = new BatchOrganizer();
  
  if (command === 'find') {
    const rootDir = args[1] || '.';
    const batchFiles = organizer.findBatchFiles(rootDir);
    
    // Print detailed results
    for (const type in batchFiles) {
      console.log(`\n${type.toUpperCase()} Batch Files:`);
      
      for (const file of batchFiles[type]) {
        console.log(`- Batch ${file.batchNum}: ${file.path}`);
      }
    }
    
    rl.close();
    
  } else if (command === 'organize') {
    const rootDir = args[1] || '.';
    
    console.log(`Organizing batch files from ${rootDir}...`);
    
    // Confirm before proceeding
    rl.question('Continue with organization? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        organizer.run(rootDir);
      } else {
        console.log('Organization aborted by user');
      }
      
      rl.close();
    });
    
  } else {
    console.log('Batch Organizer Usage:');
    console.log('  node batch-organizer.js find [rootDir] - Find batch files');
    console.log('  node batch-organizer.js organize [rootDir] - Organize batch files');
    rl.close();
  }
}