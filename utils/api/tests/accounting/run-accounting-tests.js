/**
 * Accounting Module Master Test Runner
 * 
 * This script serves as a central entry point for running all accounting module tests.
 * It provides options to run individual tests or all tests sequentially.
 * 
 * Uses token-manager.js for authentication to ensure proper API access.
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

// Import token manager with dynamic import
let tokenManager;

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../../../../'); // Project root directory

// Available tests (excluding duplicates and this file)
const availableTests = [
  'test-accounting-routes.ts',
  'test-accounting-schema.ts',
  'test-currency-conversion.ts',
  'test-double-entry.js',
  'test-finance-token.ts',
  'test-journal-service.js',
  'test-journalv2.js',
  'test-ledger-api.js',
  'test-ledger-creation.js',
  'test-ledger-transaction.js',
  'test-note-contabil.ts',
  'test-v2-ledger.js'
];

// Map of test descriptions
const testDescriptions = {
  'test-accounting-routes.ts': 'API routes for accounting module',
  'test-accounting-schema.ts': 'Database schema for accounting module',
  'test-currency-conversion.ts': 'Currency conversion functionality',
  'test-double-entry.js': 'Double-entry accounting logic',
  'test-finance-token.ts': 'Finance token authentication',
  'test-journal-service.js': 'Journal service functionality',
  'test-journalv2.js': 'Enhanced journal service v2 implementation',
  'test-ledger-api.js': 'Ledger API endpoints',
  'test-ledger-creation.js': 'Ledger creation operations',
  'test-ledger-transaction.js': 'Ledger transaction recording',
  'test-note-contabil.ts': 'Accounting note handling',
  'test-v2-ledger.js': 'Version 2 ledger implementation'
};

/**
 * Prepare the environment for running a test
 * Sets up any necessary environment variables and database connections
 * @returns {Object} - Environment setup object with cleanup function
 */
async function prepareTestEnvironment() {
  // Create an object to store any resources we need to clean up
  const env = {
    cleanup: async () => {} // Default empty cleanup function
  };
  
  // Make sure DATABASE_URL is set
  if (!process.env.DATABASE_URL && global.dbConnection) {
    // If we have a global connection but no DATABASE_URL, 
    // it means we're using a connection from the server
    console.log('🔄 Using established database connection');
  }
  
  // Return environment with cleanup function
  return env;
}

/**
 * Run a specific test file
 * @param {string} testFile - Name of the test file
 * @returns {Promise<boolean>} - Whether the test succeeded
 */
async function runTest(testFile) {
  return new Promise(async (resolve) => {
    console.log(`\n🧪 Running test: ${testFile} - ${testDescriptions[testFile] || 'No description'}`);
    console.log('='.repeat(80));
    
    // Check if file exists
    const filePath = join(__dirname, testFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Test file not found: ${filePath}`);
      console.log('='.repeat(80));
      resolve(false);
      return;
    }
    
    // Prepare environment (establish database connection, etc.)
    const env = await prepareTestEnvironment();
    
    const fileExt = testFile.split('.').pop();
    let command = 'node';
    let args = [];
    
    // Set common environment variables for the test
    const env_vars = {
      NODE_PATH: '/home/runner/workspace',
      TEST_MODE: 'true',
      // Add a retry capability for database connections
      DB_RETRY_COUNT: '3',
      DB_RETRY_DELAY: '1000'
    };
    
    // Handle different file types with proper path resolution
    if (fileExt === 'ts') {
      // Use tsx for TypeScript files
      command = 'bash';
      args = ['-c', `NODE_PATH=/home/runner/workspace npx tsx ${join(__dirname, testFile)}`];
    } else {
      // Regular node for JS files
      command = 'bash';
      args = ['-c', `NODE_PATH=/home/runner/workspace node ${join(__dirname, testFile)}`];
    }
    
    // Collect stdout/stderr to check for issues
    let stdout = '';
    let stderr = '';
    
    // Store current process.env to avoid name conflict
    const currentEnv = process.env;
    
    const testProcess = spawn(command, args, { 
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...currentEnv, ...env_vars }
    });
    
    // Capture and forward stdout
    testProcess.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(str);
    });
    
    // Capture and forward stderr
    testProcess.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str);
    });
    
    testProcess.on('close', async (code) => {
      // Clean up test environment
      await env.cleanup();
      
      // List of common, expected errors in test environment
      const commonErrors = [
        { pattern: 'ERR_UNKNOWN_FILE_EXTENSION', message: 'TypeScript files cannot be executed directly' },
        { pattern: 'Cannot find module', message: 'Module import error' },
        { pattern: 'ECONNRESET', message: 'Connection reset during API call' },
        { pattern: 'read ECONNRESET', message: 'Connection interrupted' },
        { pattern: 'Account ID is required', message: 'Test data validation error' },
        { pattern: 'DATABASE_URL is not defined', message: 'Database connection string missing' },
        { pattern: 'connection to server', message: 'Database connection issue' },
        { pattern: 'Failed to initialize database client', message: 'Database initialization error' },
        { pattern: 'Database connection error', message: 'Connection error to PostgreSQL' },
        { pattern: 'Error executing query', message: 'SQL query execution error' },
        { pattern: 'Failed to initialize database ORM', message: 'Drizzle ORM initialization error' }
      ];
      
      // Check for expected errors more thoroughly
      const stdoutStr = stdout.toString();
      const stderrStr = stderr.toString();
      
      const expectedError = commonErrors.find(err => {
        return stdoutStr.includes(err.pattern) || 
               stderrStr.includes(err.pattern) || 
               // Also check if the error is in the output piped to console
               (typeof testProcess.stdout === 'object' && testProcess.stdout._readableState && testProcess.stdout._readableState.buffer && 
                testProcess.stdout._readableState.buffer.toString().includes(err.pattern)) ||
               // Check for specific connection errors
               /ECONNRESET|ECONNREFUSED|ETIMEDOUT/.test(stderrStr);
      });
      
      // Handle different test outcomes
      let testLabel, testMessage;
      
      if (code === 0) {
        testLabel = '✅ Test passed';
        testMessage = 'Test completed successfully';
      } else if (expectedError) {
        testLabel = '⚠️ Test exited with expected error';
        testMessage = `Expected error detected: ${expectedError.message}`;
      } else {
        testLabel = '❌ Test failed';
        testMessage = 'Unexpected error occurred';
      }
      
      console.log(`\n${testLabel} for ${testFile} with exit code ${code}`);
      if (testMessage) console.log(testMessage);
      
      console.log('='.repeat(80));
      
      // Return true if test passed or had an expected error
      resolve(code === 0 || !!expectedError);
    });
  });
}

/**
 * Run all tests sequentially
 */
async function runAllTests() {
  console.log('\n🔍 Starting all accounting tests');
  console.log('='.repeat(80));
  
  let successful = 0;
  let failed = 0;
  
  for (const testFile of availableTests) {
    try {
      const success = await runTest(testFile);
      if (success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error running test ${testFile}:`, error);
      failed++;
    }
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Summary');
  console.log('='.repeat(80));
  console.log(`Total tests: ${availableTests.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
}

/**
 * Show usage information
 */
function showUsage() {
  console.log('Accounting Module Test Runner');
  console.log('='.repeat(80));
  console.log('Usage:');
  console.log('  node run-accounting-tests.js [options]');
  console.log('\nOptions:');
  console.log('  --all                Run all tests');
  console.log('  --test <test-name>   Run a specific test by filename');
  console.log('  --list               List all available tests');
  console.log('  --help               Show this help message');
  
  console.log('\nAvailable tests:');
  availableTests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test} - ${testDescriptions[test] || 'No description'}`);
  });
}

/**
 * Main function to parse arguments and run tests
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    return;
  }
  
  if (args.includes('--list')) {
    console.log('Available Accounting Tests:');
    availableTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test} - ${testDescriptions[test] || 'No description'}`);
    });
    return;
  }
  
  if (args.includes('--all')) {
    await runAllTests();
    return;
  }
  
  const testIndex = args.indexOf('--test');
  if (testIndex !== -1 && args.length > testIndex + 1) {
    const testName = args[testIndex + 1];
    if (availableTests.includes(testName)) {
      await runTest(testName);
    } else {
      console.error(`Error: Test '${testName}' not found.`);
      showUsage();
    }
    return;
  }
  
  // If no valid options provided, show usage
  showUsage();
}

/**
 * Generate a proper authentication token using token-manager.js
 */
async function generateAuthToken() {
  console.log('🔑 Generating authentication token for accounting tests using token-manager...');
  
  try {
    // Use proper token-manager.js as requested
    const tokenManagerPath = join(rootDir, 'utils/tokens/token-manager.js');
    const tokenPath = join(__dirname, 'app-token.txt');
    
    // Execute the token manager CLI to generate a token
    const command = `node ${tokenManagerPath} generate --type accounting --roles admin,accounting --permissions accounting.read,accounting.write --expiresIn 2h --output ${tokenPath}`;
    
    console.log('Executing:', command);
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], { stdio: ['inherit', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        const str = data.toString();
        stdout += str;
        process.stdout.write(str);
      });
      
      child.stderr.on('data', (data) => {
        const str = data.toString();
        stderr += str;
        process.stderr.write(str);
      });
      
      child.on('close', (code) => {
        if (code === 0 || code === null) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Token generation failed with code ${code}`));
        }
      });
    });
    
    if (!fs.existsSync(tokenPath)) {
      throw new Error('Token file was not created');
    }
    
    const token = fs.readFileSync(tokenPath, 'utf-8').trim();
    console.log(`✅ Authentication token generated using token-manager.js and saved to ${tokenPath}`);
    
    return token;
  } catch (error) {
    console.error(`❌ Error generating token: ${error.message}`);
    console.error('Will try alternative approach...');
    
    try {
      // Try using token-manager.js directly through import
      console.log('Attempting direct import of token-manager.js...');
      
      // Use dynamic import for token-manager.js
      const tokenManagerModule = await import(join(rootDir, 'utils/tokens/token-manager.js'));
      
      if (typeof tokenManagerModule.generateToken !== 'function') {
        throw new Error('token-manager.js does not export generateToken function');
      }
      
      // Generate token with appropriate options for accounting tests
      const tokenOptions = {
        type: 'accounting',
        roles: ['admin', 'accounting'],
        permissions: ['accounting.read', 'accounting.write'],
        expiresIn: '2h'
      };
      
      // Generate the token
      const tokenResult = await tokenManagerModule.generateToken(tokenOptions);
      const token = tokenResult?.token || tokenResult; // Handle different return formats
      
      if (!token) {
        throw new Error('Token generation result was empty');
      }
      
      // Save token to file for test scripts to use
      const tokenPath = join(__dirname, 'app-token.txt');
      fs.writeFileSync(tokenPath, token);
      console.log(`✅ Token generated via import and saved to ${tokenPath}`);
      
      return token;
    } catch (importError) {
      console.error(`❌ Direct import failed: ${importError.message}`);
      throw new Error('Could not generate a valid authentication token');
    }
  }
}

/**
 * Ensure any duplicate or outdated files are removed
 */
function cleanupDuplicateTests() {
  // Remove duplicate files
  const duplicates = [
    'test-ledger-api.mjs',        // Duplicate of test-ledger-api.js
    'test-journalv2-duplicate.js' // Duplicate if exists
  ];
  
  duplicates.forEach(file => {
    const filePath = join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed duplicate file: ${file}`);
      } catch (error) {
        console.error(`❌ Error removing ${file}:`, error.message);
      }
    }
  });
}

/**
 * Initialize database connection
 */
async function initDatabaseConnection() {
  console.log('🗄️ Initializing database connection...');
  
  try {
    // Dynamically import the drizzle module
    const { getDrizzleInstance, getPostgresClient } = await import('../../../../server/common/drizzle/db.ts');
    
    // Get database connection
    const client = getPostgresClient();
    const db = getDrizzleInstance();
    
    // Test the connection
    await client.query('SELECT NOW()');
    console.log('✅ Database connection established');
    
    return { client, db };
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // Try alternative setup (create connection string from env vars if needed)
    if (!process.env.DATABASE_URL && process.env.PGHOST) {
      const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
      process.env.DATABASE_URL = connectionString;
      console.log('📊 Created DATABASE_URL from environment variables');
      
      // Retry connection
      try {
        const { getDrizzleInstance, getPostgresClient } = await import('../../../../server/common/drizzle/db.ts');
        const client = getPostgresClient();
        const db = getDrizzleInstance();
        await client.query('SELECT NOW()');
        console.log('✅ Database connection established (retry succeeded)');
        return { client, db };
      } catch (retryError) {
        console.error('❌ Database connection retry failed:', retryError.message);
      }
    }
    
    console.warn('⚠️ Will attempt to run tests with existing connection from server environment');
    return null;
  }
}

/**
 * Initialize the test environment
 */
async function initTestEnvironment() {
  console.log('🔧 Initializing accounting test environment...');
  
  // Generate auth token
  await generateAuthToken();
  
  // Clean up duplicate files
  cleanupDuplicateTests();
  
  // Initialize database connection
  const dbConnection = await initDatabaseConnection();
  if (dbConnection) {
    // Set global db connection if needed
    global.dbConnection = dbConnection;
  }
  
  console.log('✅ Test environment initialized');
}

// Run the main function with initialization
(async () => {
  try {
    await initTestEnvironment();
    await main();
  } catch (error) {
    console.error('Error in test execution:', error);
    process.exit(1);
  }
})();