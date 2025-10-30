/**
 * Continuous COR Import Script
 * 
 * This script imports COR occupations in very small batches to avoid timeouts.
 * It runs until all occupations are processed, with a limit on batches per run.
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 10; // Very small batch size to avoid timeouts
const MAX_BATCHES_PER_RUN = 10; // Process 10 batches per run
const API_URL = 'http://localhost:5000/api/hr/cor';
const PROGRESS_FILE = path.join(__dirname, 'cor-import-continuous-progress.json');
const OCCUPATION_FILE = path.join(__dirname, 'cor-occupations-list.json');
const MAX_RETRIES = 3;

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

// Get current COR statistics
async function getCorStats() {
  try {
    const response = await axios.get(
      `${API_URL}/stats`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error.response?.data || error.message);
    return null;
  }
}

// Import a batch of occupations
async function importBatch(occupations, token, retryCount = 0) {
  try {
    const response = await axios.post(
      `${API_URL}/import-batch`,
      { occupations },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 15000 // 15 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    
    // Retry logic for failed batches
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying batch (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      return importBatch(occupations, token, retryCount + 1);
    }
    
    throw error;
  }
}

// Load progress from file
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const progressData = fs.readFileSync(PROGRESS_FILE, 'utf8');
      const progress = JSON.parse(progressData);
      console.log(`Loaded progress: processed ${progress.processedCount} of ${progress.totalOccupations} occupations`);
      return progress;
    } catch (error) {
      console.error('Error loading progress file:', error);
      return { 
        processedCount: 0, 
        processedCodes: {}, 
        successCount: 0, 
        failureCount: 0, 
        totalOccupations: 0,
        occupationsToProcess: []
      };
    }
  }
  return { 
    processedCount: 0, 
    processedCodes: {}, 
    successCount: 0, 
    failureCount: 0, 
    totalOccupations: 0,
    occupationsToProcess: []
  };
}

// Save progress to file
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
    console.log(`Saved progress: processed ${progress.processedCount} of ${progress.totalOccupations} occupations`);
  } catch (error) {
    console.error('Error saving progress file:', error);
  }
}

// Prepare occupation list in a separate file
async function prepareOccupationList() {
  // Check if occupation list already exists
  if (fs.existsSync(OCCUPATION_FILE)) {
    try {
      const data = fs.readFileSync(OCCUPATION_FILE, 'utf8');
      const occupations = JSON.parse(data);
      console.log(`Loaded ${occupations.length} occupations from existing file`);
      return occupations;
    } catch (error) {
      console.error('Error reading occupation file:', error);
    }
  }
  
  // If we get here, we need to get the occupation list from the server
  console.log('Getting complete occupation list from server...');
  try {
    const response = await axios.get(`${API_URL}/occupations`, {
      params: { limit: 5000 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success && response.data.data) {
      const occupations = response.data.data;
      console.log(`Retrieved ${occupations.length} occupations from server`);
      
      // Save to file for future use
      fs.writeFileSync(OCCUPATION_FILE, JSON.stringify(occupations, null, 2));
      
      return occupations;
    } else {
      throw new Error('Failed to retrieve occupations from server');
    }
  } catch (error) {
    console.error('Error getting occupations:', error.response?.data || error.message);
    return [];
  }
}

// Import process in continuous mode
async function importContinuously() {
  try {
    // Get initial stats
    const initialStats = await getCorStats();
    if (!initialStats) {
      console.error('Failed to get COR stats. Exiting.');
      return;
    }
    
    console.log('Current COR statistics:');
    console.log(`- Major groups: ${initialStats.majorGroups}`);
    console.log(`- Submajor groups: ${initialStats.submajorGroups}`);
    console.log(`- Minor groups: ${initialStats.minorGroups}`);
    console.log(`- Subminor groups: ${initialStats.subminorGroups}`);
    console.log(`- Occupations: ${initialStats.occupations}`);
    console.log(`- Active occupations: ${initialStats.activeOccupations}`);
    
    // Generate token
    const token = generateAdminToken();
    
    // Load progress
    let progress = loadProgress();
    
    // If we don't have occupations to process yet, prepare them
    if (!progress.occupationsToProcess || progress.occupationsToProcess.length === 0) {
      const allOccupations = await prepareOccupationList();
      progress.totalOccupations = allOccupations.length;
      
      // Filter out already processed occupations
      progress.occupationsToProcess = allOccupations.filter(
        occ => !progress.processedCodes || !progress.processedCodes[occ.code]
      );
      
      // Initialize processedCodes if not exists
      if (!progress.processedCodes) {
        progress.processedCodes = {};
      }
      
      progress.processedCount = progress.totalOccupations - progress.occupationsToProcess.length;
      
      console.log(`Prepared ${progress.occupationsToProcess.length} occupations for processing`);
      console.log(`Already processed: ${progress.processedCount}`);
      
      saveProgress(progress);
    }
    
    // Check if we have occupations to process
    if (progress.occupationsToProcess.length === 0) {
      console.log('All occupations have already been processed!');
      
      // Get final stats
      const finalStats = await getCorStats();
      console.log('\nFinal COR statistics:');
      console.log(`- Major groups: ${finalStats.majorGroups}`);
      console.log(`- Submajor groups: ${finalStats.submajorGroups}`);
      console.log(`- Minor groups: ${finalStats.minorGroups}`);
      console.log(`- Subminor groups: ${finalStats.subminorGroups}`);
      console.log(`- Occupations: ${finalStats.occupations}`);
      console.log(`- Active occupations: ${finalStats.activeOccupations}`);
      
      return;
    }
    
    // Calculate batches for this run
    const batchCount = Math.min(
      MAX_BATCHES_PER_RUN,
      Math.ceil(progress.occupationsToProcess.length / BATCH_SIZE)
    );
    
    console.log(`Will process ${batchCount} batches in this run`);
    
    let successCount = progress.successCount || 0;
    let failureCount = progress.failureCount || 0;
    
    // Process batches
    for (let i = 0; i < batchCount; i++) {
      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, progress.occupationsToProcess.length);
      const batch = progress.occupationsToProcess.slice(startIdx, endIdx);
      
      if (batch.length === 0) {
        break; // No more occupations to process
      }
      
      console.log(`\nProcessing batch ${i + 1}/${batchCount} (${batch.length} occupations)`);
      
      try {
        const result = await importBatch(batch, token);
        console.log(`Batch result:`, result);
        
        // Mark occupations as processed
        for (const occupation of batch) {
          progress.processedCodes[occupation.code] = true;
        }
        
        // Update counters
        successCount += result.data?.processed || 0;
        progress.successCount = successCount;
        progress.processedCount += batch.length;
        
        // Remove processed occupations
        progress.occupationsToProcess = progress.occupationsToProcess.slice(endIdx);
        
        // Save progress after each batch
        saveProgress(progress);
        
      } catch (error) {
        console.error(`Failed to process batch ${i + 1} after ${MAX_RETRIES} retries:`, error);
        failureCount += batch.length;
        progress.failureCount = failureCount;
        
        // Still need to remove the attempted occupations
        progress.occupationsToProcess = progress.occupationsToProcess.slice(endIdx);
        
        saveProgress(progress);
      }
      
      // Add a small delay between batches
      if (i < batchCount - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Get stats after this run
    const currentStats = await getCorStats();
    console.log('\nCurrent COR statistics:');
    console.log(`- Major groups: ${currentStats.majorGroups}`);
    console.log(`- Submajor groups: ${currentStats.submajorGroups}`);
    console.log(`- Minor groups: ${currentStats.minorGroups}`);
    console.log(`- Subminor groups: ${currentStats.subminorGroups}`);
    console.log(`- Occupations: ${currentStats.occupations}`);
    console.log(`- Active occupations: ${currentStats.activeOccupations}`);
    
    // Check if more occupations to process
    if (progress.occupationsToProcess.length > 0) {
      console.log(`\n🔄 PARTIAL IMPORT COMPLETED`);
      console.log(`Processed ${progress.processedCount} of ${progress.totalOccupations} occupations`);
      console.log(`${progress.occupationsToProcess.length} occupations remaining`);
      console.log(`Run this script again to continue importing.`);
    } else {
      console.log('\n✅ ALL OCCUPATIONS SUCCESSFULLY PROCESSED');
      
      // Final cleanup
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('Removed progress file - import complete');
      }
    }
    
  } catch (error) {
    console.error('Error in continuous import process:', error);
  }
}

// Execute the import function
importContinuously();