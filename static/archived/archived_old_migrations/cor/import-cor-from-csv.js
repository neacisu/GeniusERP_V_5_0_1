/**
 * COR Occupation Import Script
 * 
 * This script reads COR occupations from the CSV file and imports them in batches of 100.
 * It uses the API endpoint /api/hr/cor/import-batch to import the occupations.
 */

// Required modules
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');
const API_BASE_URL = 'http://localhost:3000/api/hr';
const BATCH_SIZE = 100;

// Function to generate a JWT token for admin authentication
function generateAdminToken() {
  // In a real implementation, this would be a proper JWT generation
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId: 'admin-user-id',
    username: 'admin',
    roles: ['admin', 'hr_admin'],
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiration
  };
  
  // Base64Url encode the header and payload
  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const base64UrlPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Add a dummy signature (this would be properly signed in production)
  const signature = 'dummy-signature-for-testing-only';
  
  return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
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
    
    // Parse CSV line (simple split by comma, assuming no commas in the data)
    const [code, name] = line.split(',').map(item => item.trim());
    
    // Validate data
    if (!code || !name) {
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
      name,
      subminorGroupCode
    });
  }
  
  console.log(`Loaded ${occupations.length} occupations from CSV file`);
  return occupations;
}

// Function to import a batch of occupations
async function importBatch(occupations, token) {
  try {
    console.log(`Importing batch of ${occupations.length} occupations...`);
    
    const response = await fetch(`${API_BASE_URL}/cor/import-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ occupations })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Batch import result: ${JSON.stringify(result.data)}`);
    return result;
  } catch (error) {
    console.error('Error importing occupation batch:', error);
    throw error;
  }
}

// Function to get COR database statistics
async function getCorStats(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/cor/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`COR statistics: ${JSON.stringify(result.data)}`);
    return result.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error);
    throw error;
  }
}

// Main function
async function importCsvOccupations() {
  try {
    console.log('Starting COR occupations import from CSV...');
    
    // Generate admin token for authentication
    const token = generateAdminToken();
    
    // Get initial stats
    console.log('Getting initial COR database statistics...');
    const initialStats = await getCorStats(token);
    
    // Load occupations from CSV file
    const occupations = await loadCsvFile();
    
    // Import occupations in batches
    console.log(`Processing ${occupations.length} occupations in batches of ${BATCH_SIZE}...`);
    
    let totalImported = 0;
    let totalBatches = 0;
    let totalInserts = 0;
    let totalUpdates = 0;
    
    for (let i = 0; i < occupations.length; i += BATCH_SIZE) {
      const batch = occupations.slice(i, i + BATCH_SIZE);
      const batchNumber = totalBatches + 1;
      
      console.log(`Processing batch ${batchNumber} (${batch.length} occupations)...`);
      
      try {
        const result = await importBatch(batch, token);
        
        if (result.success) {
          totalImported += batch.length;
          totalBatches++;
          totalInserts += result.data.inserted;
          totalUpdates += result.data.updated;
          
          console.log(`Batch ${batchNumber} completed: ${result.data.inserted} inserted, ${result.data.updated} updated`);
        } else {
          console.error(`Batch ${batchNumber} failed: ${result.message}`);
        }
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
      }
      
      // Pause briefly between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Get final stats
    console.log('Getting final COR database statistics...');
    const finalStats = await getCorStats(token);
    
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
    
    console.log('\nCOR occupations import completed.');
  } catch (error) {
    console.error('Error in import process:', error);
    process.exit(1);
  }
}

// Run the import function
importCsvOccupations().catch(console.error);