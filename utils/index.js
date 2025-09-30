/**
 * Utility Tools Index
 * 
 * This file provides a single entry point for all utility tools.
 */

// Import all utilities
const { generateToken, verifyToken } = require('./token-generator');
const { TestSuite, ApiTester } = require('./testing/test-framework');
const { MigrationManager, moduleManagers } = require('./migration-manager');
const { BackupManager } = require('./backup-manager');
const { BatchOrganizer } = require('./batch-organizer');
const { TokenStore } = require('./tokens/token-manager.js');

// Import manager is in a different directory
const importManager = require('../imports/import-manager');

/**
 * Run a utility by name
 * @param {string} utilityName - Name of the utility to run
 * @param {Array} args - Arguments to pass to the utility
 */
function runUtility(utilityName, args = []) {
  switch (utilityName) {
    case 'token-generator':
      require('./token-generator');
      break;
    case 'test-framework':
      require('./testing/test-framework');
      break;
    case 'cleanup-temp-files':
      require('./cleanup/cleanup-temp-files.js');
      break;
    case 'migration-manager':
      require('./migration-manager');
      break;
    case 'backup-manager':
      require('./backup-manager');
      break;
    case 'batch-organizer':
      require('./batch-organizer');
      break;
    case 'token-store':
    case 'token-manager':
      require('./tokens/token-manager.js');
      break;
    case 'import-manager':
      require('../imports/import-manager');
      break;
    default:
      console.error(`Unknown utility: ${utilityName}`);
      console.log('Available utilities:');
      console.log('- token-generator');
      console.log('- test-framework');
      console.log('- cleanup-temp-files');
      console.log('- migration-manager');
      console.log('- backup-manager');
      console.log('- batch-organizer');
      console.log('- token-manager');
      console.log('- token-store (alias for token-manager)');
      console.log('- import-manager');
      break;
  }
}

// Export all utilities
module.exports = {
  // Token utilities
  generateToken,
  verifyToken,
  TokenStore,
  
  // Testing utilities
  TestSuite,
  ApiTester,
  
  // Migration utilities
  MigrationManager,
  moduleManagers,
  
  // Import utilities
  ImportManager: importManager.ImportManager,
  corImporter: importManager.corImporter,
  
  // File management utilities
  BackupManager,
  BatchOrganizer,
  
  // Helper function to run a utility
  runUtility
};

// If run directly, show usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const utilityName = args[0];
  
  if (!utilityName) {
    console.log('Usage: node utils [utility-name] [args...]');
    console.log('Available utilities:');
    console.log('- token-generator');
    console.log('- test-framework');
    console.log('- cleanup-temp-files');
    console.log('- migration-manager');
    console.log('- backup-manager');
    console.log('- batch-organizer');
    console.log('- token-manager');
    console.log('- token-store (alias for token-manager)');
    console.log('- import-manager');
  } else {
    runUtility(utilityName, args.slice(1));
  }
}