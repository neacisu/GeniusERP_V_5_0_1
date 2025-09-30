/**
 * Run Until Complete Script
 * 
 * This script will repeatedly run the import process 
 * in small chunks until the database is complete.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 10; // Smaller batch size for better reliability
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
        timeout: 10000,
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

// Process a small set of batches
async function processChunk(startBatchIndex, endBatchIndex, batches, token) {
  console.log(`Processing chunk: batches ${startBatchIndex+1} to ${endBatchIndex}`);
  
  let totalInserted = 0;
  let totalUpdated = 0;
  
  for (let i = startBatchIndex; i < endBatchIndex && i < batches.length; i++) {
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
        
        console.log(`✅ Batch result: ${inserted} inserted, ${updated} updated, ${processed} processed`);
      } else {
        console.log(`❌ Batch failed: ${result?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Error processing batch: ${error.message}`);
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return { inserted: totalInserted, updated: totalUpdated };
}

// Main function to run the import in chunks until complete
async function runUntilComplete() {
  console.log('====== COR IMPORT - RUN UNTIL COMPLETE ======');
  
  try {
    // Generate token
    const token = generateToken();
    console.log('Admin token generated');
    
    // Get initial stats
    const initialStats = await getStats(token);
    if (!initialStats || !initialStats.success) {
      console.error('Failed to get initial stats');
      return;
    }
    
    let currentCount = initialStats.data.occupations;
    console.log(`\nInitial occupations count: ${currentCount}`);
    console.log(`Current completion: ${((currentCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
    console.log(`Occupations remaining: ${TOTAL_EXPECTED - currentCount}`);
    
    // Load missing occupations
    const missingOccupations = loadMissingOccupations();
    console.log(`\nLoaded ${missingOccupations.length} missing occupations from file`);
    
    // Create batches
    const batches = [];
    for (let i = 0; i < missingOccupations.length; i += BATCH_SIZE) {
      batches.push(missingOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches of ${BATCH_SIZE} occupations`);
    
    // Process in chunks of 5 batches
    const CHUNK_SIZE = 5;
    let startBatchIndex = 0;
    let totalRuns = 0;
    let complete = false;
    
    const startTime = new Date();
    
    while (!complete && startBatchIndex < batches.length) {
      totalRuns++;
      console.log(`\n===== RUN ${totalRuns} =====`);
      
      // Process a small chunk of batches
      const endBatchIndex = Math.min(startBatchIndex + CHUNK_SIZE, batches.length);
      await processChunk(startBatchIndex, endBatchIndex, batches, token);
      
      // Update progress
      const currentStats = await getStats(token);
      if (currentStats && currentStats.success) {
        const newCount = currentStats.data.occupations;
        console.log(`\n[PROGRESS] Current occupation count: ${newCount} / ${TOTAL_EXPECTED}`);
        console.log(`[PROGRESS] Completion: ${((newCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
        console.log(`[PROGRESS] Added this session: ${newCount - currentCount}`);
        console.log(`[PROGRESS] Batches processed: ${endBatchIndex} / ${batches.length}`);
        
        currentCount = newCount;
        
        if (newCount >= TOTAL_EXPECTED) {
          console.log('\n🎉 IMPORT 100% COMPLETE!');
          complete = true;
        } else if (newCount >= 4500 && endBatchIndex >= batches.length) {
          console.log('\n✅ IMPORT SUCCESSFUL (>= 99%)!');
          complete = true;
        }
      }
      
      // Move to next chunk
      startBatchIndex = endBatchIndex;
      
      // Brief pause between chunks
      if (!complete && startBatchIndex < batches.length) {
        console.log('\nTaking a short break before next chunk...');
        await new Promise(r => setTimeout(r, 3000));
      }
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

// Run the import process
runUntilComplete();