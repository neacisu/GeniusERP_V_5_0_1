/**
 * Process COR Occupations from Excel
 * 
 * This script reads the CSV (already converted from Excel) and updates the COR database
 * through the API in batches to prevent timeouts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');
const BATCH_SIZE = 100;
const API_URL = 'http://localhost:5000/api/hr/cor';

// Generate a token for API authorization
function generateAdminToken() {
  const payload = {
    userId: 'admin-user-id',
    roles: ['admin', 'hr_admin'],
    email: 'admin@test.com',
    companyId: 'system'
  };

  // We're using the same JWT secret that's used in the application
  const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
  // Directly importing jsonwebtoken for token generation
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Function to read occupations from CSV
async function readOccupationsFromCsv() {
  console.log(`Reading occupations from ${CSV_FILE_PATH}`);
  
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
    
    // Parse CSV line
    let parts = line.split(',');
    let code, name;
    
    // Handle quoted strings for name (e.g., "name with, comma")
    if (parts.length > 2) {
      code = parts[0].trim();
      
      // If the name is in quotes and contains commas
      if (line.indexOf('"') !== -1) {
        const match = line.match(/^(\d+),\s*"(.+?)"$/);
        if (match) {
          code = match[1].trim();
          name = match[2].trim();
        } else {
          // Try an alternative approach
          name = parts.slice(1).join(',').trim();
          if (name.startsWith('"') && name.endsWith('"')) {
            name = name.substring(1, name.length - 1).trim();
          }
        }
      } else {
        // If there are commas but no quotes, just join everything after the code
        name = parts.slice(1).join(',').trim();
      }
    } else {
      code = parts[0].trim();
      name = parts[1] ? parts[1].trim() : '';
    }
    
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

// Function to process occupations in batches
async function processOccupationsInBatches(occupations) {
  const token = await generateAdminToken();
  console.log('Admin token generated for API authentication');
  
  // Get statistics before updating
  await getCorStats(token);
  
  const batches = [];
  for (let i = 0; i < occupations.length; i += BATCH_SIZE) {
    batches.push(occupations.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Divided ${occupations.length} occupations into ${batches.length} batches of size ${BATCH_SIZE}`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} occupations`);
    
    try {
      // Call the import-batch API endpoint
      const response = await fetch(`${API_URL}/import-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          occupations: batch
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        successCount += batch.length;
        console.log(`Batch ${i + 1} imported successfully`);
        
        if (result.data) {
          console.log(`Inserted: ${result.data.inserted || 0}, Updated: ${result.data.updated || 0}`);
        }
      } else {
        failCount += batch.length;
        console.error(`Batch ${i + 1} import failed:`, result.message || 'Unknown error');
      }
      
      // Add a small delay between batches to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      failCount += batch.length;
      console.error(`Error processing batch ${i + 1}:`, error.message);
    }
    
    // Log progress
    const progress = ((i + 1) / batches.length * 100).toFixed(2);
    console.log(`Progress: ${progress}% (${successCount} successful, ${failCount} failed)`);
  }
  
  console.log('\n===== Import Summary =====');
  console.log(`Total occupations processed: ${occupations.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Failed to import: ${failCount}`);
  
  // Get statistics after updating
  await getCorStats(token);
}

// Function to get COR statistics
async function getCorStats(token) {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('\n===== COR Statistics =====');
      console.log(`Major Groups: ${result.data.majorGroups}`);
      console.log(`Submajor Groups: ${result.data.submajorGroups}`);
      console.log(`Minor Groups: ${result.data.minorGroups}`);
      console.log(`Subminor Groups: ${result.data.subminorGroups}`);
      console.log(`Occupations: ${result.data.occupations}`);
      console.log(`Active Occupations: ${result.data.activeOccupations}`);
    } else {
      console.error('Failed to get COR statistics:', result.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error getting COR statistics:', error.message);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting COR occupation processing from CSV...');
    
    // Read occupations from CSV
    const occupations = await readOccupationsFromCsv();
    
    // Process occupations in batches
    await processOccupationsInBatches(occupations);
    
    console.log('\nCOR occupation processing completed successfully.');
  } catch (error) {
    console.error('Error in processing:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);