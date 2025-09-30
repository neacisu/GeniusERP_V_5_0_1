/**
 * Execute COR SQL Import Script
 * 
 * This script executes the generated SQL files in the correct order.
 * It first imports the group hierarchy and then the occupation data
 * in batches, providing progress updates.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connect to the database
async function connectToDatabase() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();
  console.log('Connected to database');
  return client;
}

// Function to execute a SQL file
async function executeSqlFile(client, filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    await client.query(sql);
    console.log(`Successfully executed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error executing SQL file ${filePath}:`, error);
    return false;
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
      ['system', action, 'COR', 'SQL_IMPORT', JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Error logging audit entry:', error);
    // Don't throw the error to avoid failing the import
  }
}

// Main function
async function main() {
  let client;
  
  try {
    console.log('Starting COR SQL execution...');
    
    // Connect to the database
    client = await connectToDatabase();
    
    // Get initial stats
    console.log('Getting initial COR database statistics...');
    const initialStats = await getCorStats(client);
    
    // First, execute the groups SQL file to create hierarchy
    const groupsSuccess = await executeSqlFile(client, path.resolve(__dirname, 'cor-groups.sql'));
    
    if (!groupsSuccess) {
      console.error('Failed to execute groups SQL file. Aborting.');
      process.exit(1);
    }
    
    console.log('Successfully imported COR group hierarchy.');
    
    // Find all batch files
    const files = fs.readdirSync(__dirname);
    const batchFiles = files.filter(file => /^cor-occupations-batch\d+\.sql$/.test(file));
    
    // Sort the batch files numerically
    batchFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/batch(\d+)/)[1], 10);
      const bNum = parseInt(b.match(/batch(\d+)/)[1], 10);
      return aNum - bNum;
    });
    
    console.log(`Found ${batchFiles.length} occupation batch files.`);
    
    // Execute batch files one by one
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < batchFiles.length; i++) {
      const batchFile = batchFiles[i];
      const batchNumber = i + 1;
      
      console.log(`Processing batch ${batchNumber}/${batchFiles.length}: ${batchFile}`);
      
      const success = await executeSqlFile(client, path.resolve(__dirname, batchFile));
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Log audit entry for this batch
      await logAuditEntry(client, 'SQL_BATCH_IMPORT', {
        batchFile,
        batchNumber,
        success
      });
      
      // Pause briefly between batches to reduce database load
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Get final stats
    console.log('Getting final COR database statistics...');
    const finalStats = await getCorStats(client);
    
    // Display summary
    console.log('\n===== Import Summary =====');
    console.log(`Total batch files: ${batchFiles.length}`);
    console.log(`Successfully executed: ${successCount}`);
    console.log(`Failed to execute: ${failCount}`);
    console.log('\n===== Database Statistics =====');
    console.log(`Initial occupations count: ${initialStats.occupations}`);
    console.log(`Final occupations count: ${finalStats.occupations}`);
    console.log(`Difference: ${finalStats.occupations - initialStats.occupations}`);
    console.log(`Major groups: ${finalStats.majorGroups}`);
    console.log(`Submajor groups: ${finalStats.submajorGroups}`);
    console.log(`Minor groups: ${finalStats.minorGroups}`);
    console.log(`Subminor groups: ${finalStats.subminorGroups}`);
    
    // Log final audit entry
    await logAuditEntry(client, 'SQL_IMPORT_COMPLETED', {
      totalBatches: batchFiles.length,
      successCount,
      failCount,
      initialCount: initialStats.occupations,
      finalCount: finalStats.occupations
    });
    
    console.log('\nCOR SQL execution completed.');
  } catch (error) {
    console.error('Error in SQL execution process:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (client) {
      await client.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the main function
main().catch(console.error);