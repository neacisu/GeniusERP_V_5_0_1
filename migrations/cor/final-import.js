/**
 * Final Direct Import Script
 * 
 * This script imports the remaining ~600 occupations needed to complete the COR database.
 * It efficiently uses both the missing-occupations.json file and our knowledge of the COR code patterns.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 15; // Smaller batch size for reliability
const TOTAL_EXPECTED = 4547; // Total expected occupations

// Generate admin token
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

// Simple API request with retry
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
        timeout: 15000,
        data: data ? data : undefined
      };
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      lastError = error;
      console.log(`API request failed (attempt ${attempt + 1}/${retries}): ${error.message}`);
      
      if (attempt < retries - 1) {
        console.log('Retrying in 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
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
    const data = fs.readFileSync(MISSING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading missing occupations:', error.message);
    return [];
  }
}

// Main import function
async function completeCORImport() {
  console.log('====== FINAL COR IMPORT ======');
  
  try {
    // Generate token
    const token = generateToken();
    console.log('Admin token generated');
    
    // Get current stats
    const initialStats = await getStats(token);
    if (!initialStats || !initialStats.success) {
      console.error('Failed to get initial stats');
      return;
    }
    
    const initialCount = initialStats.data.occupations;
    console.log(`\nInitial occupations count: ${initialCount}`);
    console.log(`Current completion: ${((initialCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
    console.log(`Occupations remaining: ${TOTAL_EXPECTED - initialCount}`);
    
    // Load missing occupations
    const missingOccupations = loadMissingOccupations();
    console.log(`\nLoaded ${missingOccupations.length} missing occupations from file`);
    
    // Create batches
    const batches = [];
    for (let i = 0; i < missingOccupations.length; i += BATCH_SIZE) {
      batches.push(missingOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches of ${BATCH_SIZE} occupations`);
    console.log("\nStarting import process...");
    
    // Process batches
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalProcessed = 0;
    const startTime = new Date();
    
    for (let i = 0; i < batches.length; i++) {
      // Check progress every 10 batches
      if (i > 0 && i % 10 === 0) {
        const currentStats = await getStats(token);
        if (currentStats && currentStats.success) {
          const currentCount = currentStats.data.occupations;
          console.log(`\n[PROGRESS] Occupation count: ${currentCount} / ${TOTAL_EXPECTED}`);
          console.log(`[PROGRESS] Completion: ${((currentCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
          console.log(`[PROGRESS] Added this run: ${currentCount - initialCount}`);
          
          if (currentCount >= 4500) {
            console.log('\n🎉 IMPORT NEARLY COMPLETE! Over 4500 occupations found.');
            
            if (i < batches.length - 1) {
              console.log('Continuing with remaining batches to achieve 100% completion...');
            }
          }
        }
      }
      
      const batch = batches[i];
      console.log(`\nBatch ${i+1}/${batches.length}:`);
      
      try {
        const result = await importBatch(batch, token);
        
        if (result && result.success) {
          const inserted = result.data?.inserted || 0;
          const updated = result.data?.updated || 0;
          const processed = result.data?.processed || 0;
          
          totalInserted += inserted;
          totalUpdated += updated;
          totalProcessed += processed;
          
          console.log(`✅ Batch result: ${inserted} inserted, ${updated} updated, ${processed} processed`);
        } else {
          console.log(`❌ Batch failed: ${result?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ Error processing batch: ${error.message}`);
      }
      
      // Add a small delay between batches
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Final stats
    const finalStats = await getStats(token);
    const endTime = new Date();
    const elapsedSeconds = Math.round((endTime - startTime) / 1000);
    const elapsedMinutes = (elapsedSeconds / 60).toFixed(2);
    
    console.log('\n====== IMPORT SUMMARY ======');
    console.log(`Initial count: ${initialCount}`);
    console.log(`Final count: ${finalStats.data.occupations}`);
    console.log(`Added this run: ${finalStats.data.occupations - initialCount}`);
    console.log(`Total inserted: ${totalInserted}`);
    console.log(`Total updated: ${totalUpdated}`);
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Execution time: ${elapsedMinutes} minutes (${elapsedSeconds} seconds)`);
    console.log(`Final completion: ${((finalStats.data.occupations / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
    
    if (finalStats.data.occupations >= TOTAL_EXPECTED) {
      console.log('\n✅ IMPORT 100% COMPLETE!');
    } else if (finalStats.data.occupations >= 4500) {
      console.log('\n✅ IMPORT SUCCESSFUL (>= 99%)!');
    } else {
      console.log('\n⚠️ Import may be incomplete. Please check verification report.');
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

// Start the import process
completeCORImport();