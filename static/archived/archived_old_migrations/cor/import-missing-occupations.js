/**
 * Import Missing Occupations
 * 
 * This script uses the list of missing occupations to import them in batches
 * with a progress tracker to resume after interruptions.
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
const BATCH_SIZE = 25; // Increased from 5 to 25 per batch as requested
const BATCH_DELAY_MS = 1500; // Increased slightly to give more processing time between larger batches
const MAX_BATCHES_PER_RUN = 30; // Adjusted to process similar number of total occupations per run

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
        timeout: 30000 // 30 second timeout to handle larger batches of 25 occupations
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

// Import remaining missing occupations
async function importMissingOccupations() {
  try {
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
    const endIndex = Math.min(startIndex + MAX_BATCHES_PER_RUN, batches.length);
    
    console.log(`Processing batches ${startIndex + 1} to ${endIndex} (of ${batches.length})`);
    
    let insertCount = 0;
    let updateCount = 0;
    let startTime = new Date();
    
    for (let i = startIndex; i < endIndex; i++) {
      const batch = batches[i];
      console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} occupations)`);
      
      try {
        const result = await importBatch(batch, token);
        console.log(`Batch result:`, result);
        
        insertCount += result.data?.inserted || 0;
        updateCount += result.data?.updated || 0;
        
        // Update progress
        for (const occupation of batch) {
          progress.importedCodes[occupation.code] = true;
        }
        progress.totalImported = Object.keys(progress.importedCodes).length;
        progress.lastBatchIndex = i + 1;
        progress.lastUpdate = new Date().toISOString();
        saveProgress(progress);
        
      } catch (error) {
        console.error(`Failed to process batch ${i + 1}:`, error);
        // Don't update progress on error
      }
      
      // Add a small delay between batches
      if (i < endIndex - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }
    
    const endTime = new Date();
    const durationSeconds = (endTime - startTime) / 1000;
    
    // Get final stats
    const finalStats = await getCorStats();
    
    console.log('\nImport summary:');
    console.log(`- Total missing occupations: ${missingOccupations.length}`);
    console.log(`- Imported in this run: ${insertCount}`);
    console.log(`- Updated in this run: ${updateCount}`);
    console.log(`- Total imported so far: ${progress.totalImported}`);
    console.log(`- Execution time: ${durationSeconds.toFixed(2)} seconds`);
    
    if (finalStats) {
      console.log(`- Starting occupation count: ${initialStats.occupations}`);
      console.log(`- Final occupation count: ${finalStats.occupations}`);
      console.log(`- Net new occupations: ${finalStats.occupations - initialStats.occupations}`);
    }
    
    // Report completion status
    if (progress.lastBatchIndex >= batches.length) {
      console.log('\nAll missing occupations have been processed!');
      // Remove progress file to indicate completion
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('Progress file removed to indicate completion');
      }
    } else {
      console.log(`\nProcessed ${progress.lastBatchIndex} of ${batches.length} batches`);
      console.log(`Run the script again to continue with the next ${MAX_BATCHES_PER_RUN} batches`);
    }
    
  } catch (error) {
    console.error('Error importing missing occupations:', error);
  }
}

// Execute the function
importMissingOccupations();