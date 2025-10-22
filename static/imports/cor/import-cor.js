/**
 * COR Occupations Import Script
 * 
 * This script imports Romanian Classification of Occupations (COR) 
 * data into the database using the unified import manager.
 */

const path = require('path');
const fs = require('fs');
const { corImporter } = require('../import-manager');
const { generateToken } = require('../../utils/token-generator');

// Configuration
const CSV_FILE = path.join(__dirname, '../../Coduri COR - occupations.csv');
const TOKEN_FILE = path.join(__dirname, '../../tokens/cor-import-token.txt');

/**
 * Main import function
 */
async function importCorOccupations() {
  console.log('Starting COR Occupations Import');
  console.log('===============================');
  
  // Ensure tokens directory exists
  if (!fs.existsSync('../../tokens')) {
    fs.mkdirSync('../../tokens', { recursive: true });
  }
  
  // Generate admin token for import
  console.log('Generating admin token for import...');
  const token = generateToken({
    type: 'admin',
    roles: ['admin', 'HR_ADMIN'],
    outputFile: TOKEN_FILE
  });
  
  // Load occupations from CSV
  console.log(`Loading occupations from ${CSV_FILE}...`);
  const occupations = corImporter.loadFromCsv(CSV_FILE);
  console.log(`Loaded ${occupations.length} occupations`);
  
  // Run the import
  console.log('Starting import process...');
  try {
    const result = await corImporter.importOccupations(occupations, token);
    
    console.log('\nImport Summary:');
    console.log(`Total: ${result.total}`);
    console.log(`Imported: ${result.imported}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Start time: ${result.startTime}`);
    console.log(`End time: ${result.endTime}`);
    
    console.log('\nCOR Occupations import completed successfully!');
  } catch (error) {
    console.error('Import process failed:', error.message);
    process.exit(1);
  }
}

// Run the import if script is executed directly
if (require.main === module) {
  importCorOccupations().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });
}