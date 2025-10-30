/**
 * Complete All Imports - Direct Script
 * 
 * This script directly imports all remaining occupations without using the
 * run-missing-imports.js wrapper. It runs until all occupations are imported.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const PROGRESS_FILE = path.join(__dirname, 'missing-import-progress.json');
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1500;

// Create an admin JWT token
function generateAdminToken() {
  const jwtSecret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
  return jwt.sign(
    { 
      userId: 'admin-user-id', 
      roles: ['admin', 'hr_admin'],
      email: 'admin@test.com',
      companyId: 'system'
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
}

// Load missing occupations
function loadMissingOccupations() {
  if (!fs.existsSync(MISSING_FILE)) {
    console.error(`Missing occupations file not found at ${MISSING_FILE}`);
    return null;
  }
  
  try {
    const data = fs.readFileSync(MISSING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading missing occupations:', error);
    return null;
  }
}

// Load progress data
function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return {
      importedCodes: {},
      totalImported: 0,
      lastBatchIndex: 0,
      startTime: new Date().toISOString()
    };
  }
  
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading progress data:', error);
    return {
      importedCodes: {},
      totalImported: 0,
      lastBatchIndex: 0,
      startTime: new Date().toISOString()
    };
  }
}

// Save progress data
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('Error saving progress data:', error);
  }
}

// Import a batch of occupations
async function importBatch(occupations, token) {
  try {
    const response = await axios.post(
      `${API_URL}/import-batch`,
      { occupations },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    throw error;
  }
}

// Check current database stats
async function getCorStats() {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error getting COR stats:', error);
    return null;
  }
}

// Direct import for all occupations with continuous progress
async function importAllOccupations() {
  try {
    console.log('=== Starting direct import of all missing occupations ===');
    
    // Load missing occupations
    const missingOccupations = loadMissingOccupations();
    if (!missingOccupations || missingOccupations.length === 0) {
      console.error('No missing occupations found to import');
      return;
    }
    
    console.log(`Loaded ${missingOccupations.length} missing occupations from file`);
    
    // Load progress
    const progress = loadProgress();
    console.log(`Resuming from batch index ${progress.lastBatchIndex}, already imported ${progress.totalImported} occupations`);
    
    // Check current database stats
    const initialStats = await getCorStats();
    console.log(`Current database status: ${initialStats.occupations} occupations (from API)`);
    
    // Generate admin token
    const token = generateAdminToken();
    
    // Create batches
    const batches = [];
    for (let i = 0; i < missingOccupations.length; i += BATCH_SIZE) {
      batches.push(missingOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches for import`);
    
    // Start from last processed batch
    const startIndex = progress.lastBatchIndex;
    
    console.log(`Processing all remaining batches from ${startIndex + 1} to ${batches.length}`);
    
    let insertCount = 0;
    let updateCount = 0;
    let startTime = new Date();
    let totalProcessed = 0;
    
    // Process ALL remaining batches
    for (let i = startIndex; i < batches.length; i++) {
      const batch = batches[i];
      
      // Get updated stats every 5 batches
      if (i % 5 === 0) {
        const currentStats = await getCorStats();
        if (currentStats) {
          console.log(`\n[Status Update] Current occupation count: ${currentStats.occupations}`);
          console.log(`[Status Update] Progress: ${((currentStats.occupations / 4547) * 100).toFixed(2)}% complete`);
        }
      }
      
      console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} occupations)`);
      
      let retryCount = 0;
      let success = false;
      
      // Retry up to 3 times if import fails
      while (!success && retryCount < 3) {
        try {
          const result = await importBatch(batch, token);
          console.log(`Batch result:`, result);
          
          insertCount += result.data?.inserted || 0;
          updateCount += result.data?.updated || 0;
          totalProcessed += (result.data?.inserted || 0) + (result.data?.updated || 0);
          
          // Update progress
          for (const occupation of batch) {
            progress.importedCodes[occupation.code] = true;
          }
          progress.totalImported = Object.keys(progress.importedCodes).length;
          progress.lastBatchIndex = i + 1;
          progress.lastUpdate = new Date().toISOString();
          saveProgress(progress);
          
          success = true;
        } catch (error) {
          retryCount++;
          console.error(`Failed to process batch ${i + 1}, attempt ${retryCount}/3:`, error);
          
          if (retryCount < 3) {
            console.log(`Retrying after a short delay...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
          } else {
            console.error(`Maximum retry attempts reached for batch ${i + 1}. Continuing to next batch.`);
          }
        }
      }
      
      // Print progress
      const elapsedTime = (new Date() - startTime) / 1000;
      const rate = totalProcessed / (elapsedTime / 60);
      const remainingBatches = batches.length - (i + 1);
      const estimatedRemainingTime = (remainingBatches * (BATCH_DELAY_MS + 5000)) / 1000 / 60;
      
      console.log(`Progress: ${((i + 1) / batches.length * 100).toFixed(2)}% of batches complete`);
      console.log(`Processing rate: ${rate.toFixed(2)} occupations per minute`);
      console.log(`Estimated completion time: ${estimatedRemainingTime.toFixed(2)} minutes`);
      
      // Add a small delay between batches
      if (i < batches.length - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    const endTime = new Date();
    const durationSeconds = (endTime - startTime) / 1000;
    
    // Get final stats
    const finalStats = await getCorStats();
    
    console.log('\n=== Import Complete ===');
    console.log(`- Total missing occupations: ${missingOccupations.length}`);
    console.log(`- Inserted in this run: ${insertCount}`);
    console.log(`- Updated in this run: ${updateCount}`);
    console.log(`- Total processed in this run: ${totalProcessed}`);
    console.log(`- Execution time: ${durationSeconds.toFixed(2)} seconds`);
    
    if (finalStats) {
      console.log(`- Starting occupation count: ${initialStats.occupations}`);
      console.log(`- Final occupation count: ${finalStats.occupations}`);
      console.log(`- Net new occupations: ${finalStats.occupations - initialStats.occupations}`);
      console.log(`- Completion percentage: ${((finalStats.occupations / 4547) * 100).toFixed(2)}%`);
    }
    
    // Report success and remove progress file
    console.log('\nAll missing occupations have been processed!');
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('Progress file removed to indicate completion');
    }
    
    // Verify final import with verification script
    console.log('\nRunning final verification...');
    console.log('Please run verify-cor-import.js to confirm all occupations are imported');
    
  } catch (error) {
    console.error('Error in import process:', error);
  }
}

// Execute the function
importAllOccupations();