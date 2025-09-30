/**
 * Focused COR Import Tool
 * 
 * This script takes a focused approach to importing the remaining COR occupations:
 * 1. Retrieves current COR stats to understand progress
 * 2. Loads missing occupations from the missing-occupations.json file
 * 3. Processes occupations in manageable small batches with robust error handling
 * 4. Regularly reports progress and continues until complete
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 5; // Smaller batch size for reliability
const TOTAL_EXPECTED = 4547; // Total expected occupations

// Generate admin token with HR admin access
function generateToken() {
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

// API request with retries
async function apiRequest(method, endpoint, data = null, token = null, retries = 3) {
  let lastError = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const config = {
        method,
        url: `${API_URL}${endpoint}`,
        headers,
        timeout: 15000, // Longer timeout
        data: data ? data : undefined
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      lastError = error;
      console.log(`API request failed (attempt ${attempt + 1}/${retries}): ${error.message}`);
      
      if (attempt < retries - 1) {
        const delay = 2000 * (attempt + 1); // Exponential backoff
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError;
}

// Get COR statistics
async function getStats(token) {
  return apiRequest('get', '/stats', null, token);
}

// Import a batch of occupations
async function importBatch(occupations, token) {
  return apiRequest('post', '/import-batch', { occupations }, token);
}

// Load missing occupations from file
function loadMissingOccupations() {
  try {
    if (!fs.existsSync(MISSING_FILE)) {
      console.error(`Missing occupations file not found: ${MISSING_FILE}`);
      return [];
    }
    
    const data = fs.readFileSync(MISSING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading missing occupations:', error.message);
    return [];
  }
}

// Main function 
async function runFocusedImport() {
  console.log('====== FOCUSED COR IMPORT ======');
  console.log(`Time started: ${new Date().toISOString()}`);
  
  try {
    // Generate token
    const token = generateToken();
    console.log('Admin token generated successfully');
    
    // Get initial stats
    console.log('Fetching current COR statistics...');
    const initialStats = await getStats(token);
    if (!initialStats || !initialStats.success) {
      console.error('Failed to get initial stats. Aborting.');
      return;
    }
    
    let currentCount = initialStats.data.occupations;
    console.log('\nInitial COR Statistics:');
    console.log(`Major Groups: ${initialStats.data.majorGroups}`);
    console.log(`Submajor Groups: ${initialStats.data.submajorGroups}`);
    console.log(`Minor Groups: ${initialStats.data.minorGroups}`);
    console.log(`Subminor Groups: ${initialStats.data.subminorGroups}`);
    console.log(`Occupations: ${currentCount}`);
    console.log(`Current completion: ${((currentCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
    console.log(`Occupations remaining: ${TOTAL_EXPECTED - currentCount}`);
    
    // Load missing occupations
    console.log('\nLoading missing occupations...');
    const missingOccupations = loadMissingOccupations();
    if (!missingOccupations || missingOccupations.length === 0) {
      console.log('No missing occupations found. Import may be complete.');
      
      // Double-check with final stats
      const finalCheck = await getStats(token);
      console.log(`\nFinal occupation count: ${finalCheck.data.occupations}`);
      console.log(`Final completion: ${((finalCheck.data.occupations / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
      
      return;
    }
    
    console.log(`Loaded ${missingOccupations.length} missing occupations from file`);
    
    // Create batches
    const batches = [];
    for (let i = 0; i < missingOccupations.length; i += BATCH_SIZE) {
      batches.push(missingOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches of ${BATCH_SIZE} occupations each`);
    
    // Process batches with reliable control flow
    let batchesProcessed = 0;
    let occupationsInserted = 0;
    let occupationsUpdated = 0;
    let errors = 0;
    
    console.log('\n===== STARTING IMPORT PROCESS =====');
    const startTime = new Date();
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\nProcessing batch ${i+1}/${batches.length} (${batch.length} occupations):`);
      
      // List first occupation in batch for debug
      if (batch.length > 0) {
        console.log(`First occupation in batch: ${batch[0].code} - ${batch[0].name}`);
      }
      
      try {
        const result = await importBatch(batch, token);
        
        if (result && result.success) {
          const inserted = result.data?.inserted || 0;
          const updated = result.data?.updated || 0;
          const processed = result.data?.processed || 0;
          
          occupationsInserted += inserted;
          occupationsUpdated += updated;
          batchesProcessed++;
          
          console.log(`✅ Batch result: ${inserted} inserted, ${updated} updated, ${processed} processed`);
          
          // Progress report every 5 batches
          if (i > 0 && (i + 1) % 5 === 0) {
            const progressStats = await getStats(token);
            const newCount = progressStats.data.occupations;
            const progress = ((newCount / TOTAL_EXPECTED) * 100).toFixed(2);
            const elapsed = Math.round((new Date() - startTime) / 1000);
            
            console.log('\n----- PROGRESS UPDATE -----');
            console.log(`Batches completed: ${i+1}/${batches.length} (${((i+1)/batches.length*100).toFixed(1)}%)`);
            console.log(`Current occupation count: ${newCount}/${TOTAL_EXPECTED} (${progress}%)`);
            console.log(`Added since start: ${newCount - currentCount}`);
            console.log(`Elapsed time: ${Math.floor(elapsed/60)}m ${elapsed%60}s`);
            console.log('---------------------------\n');
            
            currentCount = newCount;
          }
        } else {
          console.log(`❌ Batch failed: ${result?.message || 'Unknown error'}`);
          errors++;
        }
      } catch (error) {
        console.log(`❌ Error processing batch: ${error.message}`);
        errors++;
        
        // If we've hit 3 consecutive errors, refresh the token
        if (errors >= 3) {
          console.log('Multiple errors detected. Refreshing authentication token...');
          token = generateToken();
          errors = 0; // Reset error counter
          await new Promise(r => setTimeout(r, 5000)); // Longer pause after token refresh
        }
      }
      
      // Small delay between batches to avoid overwhelming the server
      await new Promise(r => setTimeout(r, 1500));
    }
    
    // Final stats
    const finalStats = await getStats(token);
    const endTime = new Date();
    const elapsedSeconds = Math.round((endTime - startTime) / 1000);
    const elapsedMinutes = (elapsedSeconds / 60).toFixed(2);
    
    console.log('\n====== IMPORT SUMMARY ======');
    console.log(`Initial count: ${initialStats.data.occupations}`);
    console.log(`Final count: ${finalStats.data.occupations}`);
    console.log(`Added in this session: ${finalStats.data.occupations - initialStats.data.occupations}`);
    console.log(`Batches processed: ${batchesProcessed}/${batches.length}`);
    console.log(`Occupations inserted: ${occupationsInserted}`);
    console.log(`Occupations updated: ${occupationsUpdated}`);
    console.log(`Execution time: ${elapsedMinutes} minutes (${elapsedSeconds} seconds)`);
    console.log(`Final completion: ${((finalStats.data.occupations / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
    
    if (finalStats.data.occupations >= TOTAL_EXPECTED) {
      console.log('\n✅ IMPORT 100% COMPLETE!');
    } else if (finalStats.data.occupations >= 4500) {
      console.log('\n✅ IMPORT SUCCESSFUL (>= 99%)!');
    } else {
      console.log('\n⚠️ Import may be incomplete. Please check verification report.');
    }
    
    console.log(`\nImport finished at: ${endTime.toISOString()}`);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

// Run the import process
runFocusedImport();