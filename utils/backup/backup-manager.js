/**
 * Backup Manager Utility
 * 
 * This utility helps manage backups of code and data outside the main codebase.
 * It extracts backup directories and files to an external location.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

// Default configuration
const config = {
  backupDir: path.join(process.cwd(), '../backups'),
  timestamp: new Date().toISOString().replace(/:/g, '-'),
  verbose: true
};

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Backup manager for handling code and data backups
 */
class BackupManager {
  /**
   * Create a new backup manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...config, ...options };
    
    // Ensure the backup directory exists
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  /**
   * Find backup directories in the codebase
   * @returns {Array} List of backup directories
   */
  findBackupDirs() {
    console.log('Searching for backup directories...');
    
    // Use find command to locate backup directories
    const result = spawnSync('find', [
      '.',
      '-type', 'd',
      '-name', 'backup',
      '-o', '-name', '*_backup',
      '-o', '-name', 'old',
      '-o', '-name', '*_old',
      '-o', '-name', 'archive',
      '-o', '-name', '*_archive'
    ], { 
      encoding: 'utf8'
    });
    
    if (result.status !== 0) {
      console.error('Error searching for backup directories:', result.stderr);
      return [];
    }
    
    // Get directories and filter out unwanted paths
    const dirs = result.stdout.split('\n')
      .filter(dir => dir.trim())
      .filter(dir => !dir.includes('node_modules'));
    
    if (this.config.verbose) {
      console.log(`Found ${dirs.length} backup directories:`);
      dirs.forEach(dir => console.log(`- ${dir}`));
    }
    
    return dirs;
  }

  /**
   * Extract a backup directory to external location
   * @param {string} dirPath - Path to backup directory
   * @returns {boolean} Success status
   */
  extractBackupDir(dirPath) {
    const dirName = path.basename(dirPath);
    const parentDir = path.dirname(dirPath);
    const parentName = path.basename(parentDir);
    
    // Create target directory name with context
    const targetDirName = `${parentName}_${dirName}_${this.config.timestamp}`;
    const targetPath = path.join(this.config.backupDir, targetDirName);
    
    console.log(`Extracting ${dirPath} to ${targetPath}...`);
    
    // Create target directory
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    try {
      // Copy directory contents
      const copyResult = spawnSync('cp', [
        '-R',
        `${dirPath}/.`,
        targetPath
      ]);
      
      if (copyResult.status !== 0) {
        console.error(`Error copying ${dirPath}:`, copyResult.stderr);
        return false;
      }
      
      console.log(`✅ Successfully extracted ${dirPath} to ${targetPath}`);
      return true;
      
    } catch (error) {
      console.error(`Error extracting ${dirPath}:`, error.message);
      return false;
    }
  }

  /**
   * Remove a backup directory after extraction
   * @param {string} dirPath - Path to backup directory
   * @returns {boolean} Success status
   */
  removeBackupDir(dirPath) {
    console.log(`Removing ${dirPath}...`);
    
    try {
      // Remove directory
      const rmResult = spawnSync('rm', [
        '-rf',
        dirPath
      ]);
      
      if (rmResult.status !== 0) {
        console.error(`Error removing ${dirPath}:`, rmResult.stderr);
        return false;
      }
      
      console.log(`✅ Successfully removed ${dirPath}`);
      return true;
      
    } catch (error) {
      console.error(`Error removing ${dirPath}:`, error.message);
      return false;
    }
  }

  /**
   * Extract all backup directories
   * @param {boolean} removeAfter - Whether to remove directories after extraction
   * @returns {Object} Result of extraction
   */
  extractAllBackups(removeAfter = false) {
    const backupDirs = this.findBackupDirs();
    
    if (backupDirs.length === 0) {
      console.log('No backup directories found');
      return { success: true, extracted: 0, removed: 0 };
    }
    
    console.log(`Found ${backupDirs.length} backup directories to extract`);
    
    const results = {
      extracted: 0,
      extractFailed: 0,
      removed: 0,
      removeFailed: 0
    };
    
    // Extract each directory
    for (const dir of backupDirs) {
      const extracted = this.extractBackupDir(dir);
      
      if (extracted) {
        results.extracted++;
        
        // Remove directory if requested
        if (removeAfter) {
          const removed = this.removeBackupDir(dir);
          
          if (removed) {
            results.removed++;
          } else {
            results.removeFailed++;
          }
        }
      } else {
        results.extractFailed++;
      }
    }
    
    // Print summary
    console.log('\nExtraction Summary:');
    console.log(`Total directories: ${backupDirs.length}`);
    console.log(`Successfully extracted: ${results.extracted}`);
    console.log(`Failed to extract: ${results.extractFailed}`);
    
    if (removeAfter) {
      console.log(`Successfully removed: ${results.removed}`);
      console.log(`Failed to remove: ${results.removeFailed}`);
    }
    
    return {
      success: results.extractFailed === 0,
      ...results
    };
  }
}

// Export utilities
module.exports = {
  BackupManager
};

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new BackupManager();
  
  if (command === 'extract') {
    const removeAfter = args.includes('--remove');
    
    console.log(`Extracting backup directories${removeAfter ? ' and removing them after' : ''}...`);
    
    // Confirm before proceeding
    rl.question('Continue with extraction? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        manager.extractAllBackups(removeAfter);
      } else {
        console.log('Extraction aborted by user');
      }
      
      rl.close();
    });
    
  } else if (command === 'find') {
    const dirs = manager.findBackupDirs();
    console.log(`Found ${dirs.length} backup directories`);
    rl.close();
    
  } else {
    console.log('Backup Manager Usage:');
    console.log('  node backup-manager.js find - Find backup directories');
    console.log('  node backup-manager.js extract [--remove] - Extract backup directories');
    rl.close();
  }
}