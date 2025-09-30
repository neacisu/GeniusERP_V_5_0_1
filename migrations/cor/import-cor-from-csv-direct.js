/**
 * Direct COR Occupation Import Script
 * 
 * This script directly imports COR occupations from the CSV file into the database,
 * bypassing the API. It imports occupations in batches of 100.
 */

// Required modules
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');
const BATCH_SIZE = 100;

// Connect to the database
async function connectToDatabase() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();
  console.log('Connected to database');
  return client;
}

// Function to load the CSV file
async function loadCsvFile() {
  console.log(`Loading CSV file from ${CSV_FILE_PATH}`);
  
  const fileStream = fs.createReadStream(CSV_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const occupations = [];
  let isFirstLine = true;
  
  for await (const line of rl) {
    // Skip the header
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    
    // Parse CSV line (simple split by comma, assuming no quotes or escaped commas)
    const [code, name] = line.split(',').map(item => item.trim());
    
    // Handle quoted strings for name (e.g., "name with, comma")
    let parsedName = name;
    if (name && name.startsWith('"') && name.endsWith('"')) {
      parsedName = name.substring(1, name.length - 1);
    }
    
    // Validate data
    if (!code || !parsedName) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }
    
    // Validate occupation code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      console.warn(`Skipping occupation with invalid code format: ${code}`);
      continue;
    }
    
    // Calculate the subminor group code (first 4 digits of the occupation code)
    const subminorGroupCode = code.substring(0, 4);
    
    occupations.push({
      code,
      name: parsedName,
      subminorGroupCode
    });
  }
  
  console.log(`Loaded ${occupations.length} occupations from CSV file`);
  return occupations;
}

// Function to ensure parent group hierarchy exists
async function ensureParentGroupsExist(client, subminorCode) {
  try {
    const majorCode = subminorCode.substring(0, 1);
    const submajorCode = subminorCode.substring(0, 2);
    const minorCode = subminorCode.substring(0, 3);
    
    // Check if major group exists
    const majorGroupResult = await client.query(
      'SELECT * FROM cor_major_groups WHERE code = $1 LIMIT 1',
      [majorCode]
    );
    
    if (majorGroupResult.rows.length === 0) {
      // Create major group
      await client.query(
        'INSERT INTO cor_major_groups (code, name, description) VALUES ($1, $2, $3)',
        [majorCode, `Grupa majora ${majorCode}`, `Grupa majora ${majorCode}`]
      );
    }
    
    // Check if submajor group exists
    const submajorGroupResult = await client.query(
      'SELECT * FROM cor_submajor_groups WHERE code = $1 LIMIT 1',
      [submajorCode]
    );
    
    if (submajorGroupResult.rows.length === 0) {
      // Create submajor group
      await client.query(
        'INSERT INTO cor_submajor_groups (code, name, description, major_group_code) VALUES ($1, $2, $3, $4)',
        [submajorCode, `Subgrupa majora ${submajorCode}`, `Subgrupa majora ${submajorCode}`, majorCode]
      );
    }
    
    // Check if minor group exists
    const minorGroupResult = await client.query(
      'SELECT * FROM cor_minor_groups WHERE code = $1 LIMIT 1',
      [minorCode]
    );
    
    if (minorGroupResult.rows.length === 0) {
      // Create minor group
      await client.query(
        'INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) VALUES ($1, $2, $3, $4)',
        [minorCode, `Grupa minora ${minorCode}`, `Grupa minora ${minorCode}`, submajorCode]
      );
    }
    
    // Check if subminor group exists
    const subminorGroupResult = await client.query(
      'SELECT * FROM cor_subminor_groups WHERE code = $1 LIMIT 1',
      [subminorCode]
    );
    
    if (subminorGroupResult.rows.length === 0) {
      // Create subminor group
      await client.query(
        'INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) VALUES ($1, $2, $3, $4)',
        [subminorCode, `Subgrupa minora ${subminorCode}`, `Subgrupa minora ${subminorCode}`, minorCode]
      );
    }
  } catch (error) {
    console.error(`Error ensuring parent groups for ${subminorCode}:`, error);
    throw error;
  }
}

// Function to import a batch of occupations
async function importBatch(client, occupations) {
  let insertCount = 0;
  let updateCount = 0;
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    for (const occupation of occupations) {
      // Check if the occupation exists
      const existingResult = await client.query(
        'SELECT * FROM cor_occupations WHERE code = $1 LIMIT 1',
        [occupation.code]
      );
      
      if (existingResult.rows.length === 0) {
        // Insert new occupation
        await client.query(
          'INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) VALUES ($1, $2, $3, $4, $5)',
          [occupation.code, occupation.name, '', occupation.subminorGroupCode, true]
        );
        insertCount++;
      } else {
        // Update existing occupation
        await client.query(
          'UPDATE cor_occupations SET name = $1, updated_at = NOW() WHERE code = $2',
          [occupation.name, occupation.code]
        );
        updateCount++;
      }
      
      // Ensure parent groups exist
      await ensureParentGroupsExist(client, occupation.subminorGroupCode);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    return { insertCount, updateCount };
  } catch (error) {
    // Rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error importing batch:', error);
    throw error;
  }
}

// Function to get COR database statistics
async function getCorStats(client) {
  try {
    const majorGroups = await client.query('SELECT COUNT(*) FROM cor_major_groups');
    const submajorGroups = await client.query('SELECT COUNT(*) FROM cor_submajor_groups');
    const minorGroups = await client.query('SELECT COUNT(*) FROM cor_minor_groups');
    const subminorGroups = await client.query('SELECT COUNT(*) FROM cor_subminor_groups');
    const occupations = await client.query('SELECT COUNT(*) FROM cor_occupations');
    const activeOccupations = await client.query('SELECT COUNT(*) FROM cor_occupations WHERE is_active = true');
    
    return {
      majorGroups: parseInt(majorGroups.rows[0].count, 10),
      submajorGroups: parseInt(submajorGroups.rows[0].count, 10),
      minorGroups: parseInt(minorGroups.rows[0].count, 10),
      subminorGroups: parseInt(subminorGroups.rows[0].count, 10),
      occupations: parseInt(occupations.rows[0].count, 10),
      activeOccupations: parseInt(activeOccupations.rows[0].count, 10)
    };
  } catch (error) {
    console.error('Error fetching COR stats:', error);
    throw error;
  }
}

// Function to add audit log entry
async function logAuditEntry(client, action, details) {
  try {
    await client.query(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)',
      ['system', action, 'COR', 'BATCH_IMPORT', JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging audit entry:', error);
    // Don't throw the error to avoid failing the import
  }
}

// Main function
async function importCsvOccupations() {
  let client;
  
  try {
    console.log('Starting direct COR occupations import from CSV...');
    
    // Connect to the database
    client = await connectToDatabase();
    
    // Get initial stats
    console.log('Getting initial COR database statistics...');
    const initialStats = await getCorStats(client);
    
    // Load occupations from CSV file
    const occupations = await loadCsvFile();
    
    // Import occupations in batches
    console.log(`Processing ${occupations.length} occupations in batches of ${BATCH_SIZE}...`);
    
    let totalBatches = 0;
    let totalInserts = 0;
    let totalUpdates = 0;
    
    for (let i = 0; i < occupations.length; i += BATCH_SIZE) {
      const batch = occupations.slice(i, i + BATCH_SIZE);
      const batchNumber = totalBatches + 1;
      
      console.log(`Processing batch ${batchNumber} (${batch.length} occupations)...`);
      
      try {
        const { insertCount, updateCount } = await importBatch(client, batch);
        
        totalBatches++;
        totalInserts += insertCount;
        totalUpdates += updateCount;
        
        console.log(`Batch ${batchNumber} completed: ${insertCount} inserted, ${updateCount} updated`);
        
        // Log audit entry for this batch
        await logAuditEntry(client, 'BATCH_IMPORT', {
          batchNumber,
          batchSize: batch.length,
          inserted: insertCount,
          updated: updateCount
        });
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
      }
      
      // Pause briefly between batches to reduce database load
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Get final stats
    console.log('Getting final COR database statistics...');
    const finalStats = await getCorStats(client);
    
    // Display summary
    console.log('\n===== Import Summary =====');
    console.log(`Total occupations processed: ${occupations.length}`);
    console.log(`Total batches processed: ${totalBatches}`);
    console.log(`Total occupations inserted: ${totalInserts}`);
    console.log(`Total occupations updated: ${totalUpdates}`);
    console.log('\n===== Database Statistics =====');
    console.log(`Initial occupations count: ${initialStats.occupations}`);
    console.log(`Final occupations count: ${finalStats.occupations}`);
    console.log(`Difference: ${finalStats.occupations - initialStats.occupations}`);
    
    // Log final audit entry
    await logAuditEntry(client, 'IMPORT_COMPLETED', {
      totalProcessed: occupations.length,
      totalBatches,
      totalInserts,
      totalUpdates,
      initialCount: initialStats.occupations,
      finalCount: finalStats.occupations
    });
    
    console.log('\nCOR occupations import completed successfully.');
  } catch (error) {
    console.error('Error in import process:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (client) {
      await client.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the import function
importCsvOccupations().catch(console.error);