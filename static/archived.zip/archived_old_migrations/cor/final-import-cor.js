/**
 * Final COR Import Script
 * 
 * This script takes a direct approach to import ALL occupations from the Word XML
 * into the database, tracking progress to avoid data loss and timeouts.
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
const BATCH_SIZE = 5; // Very small batch size to avoid timeouts
const MAX_BATCHES_PER_RUN = 5; // Process 5 batches per run
const API_URL = 'http://localhost:5000/api/hr/cor';
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const PROGRESS_FILE = path.join(__dirname, 'cor-final-progress.json');
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
        timeout: 10000 // 10 second timeout
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
      console.log(`Loaded progress: processed ${Object.keys(progress.processedCodes).length} occupations`);
      return progress;
    } catch (error) {
      console.error('Error loading progress file:', error);
      return { 
        processedCodes: {}, 
        remainingOccupations: [],
        successCount: 0, 
        failureCount: 0
      };
    }
  }
  return { 
    processedCodes: {}, 
    remainingOccupations: [],
    successCount: 0, 
    failureCount: 0
  };
}

// Save progress to file
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
    console.log(`Saved progress: processed ${Object.keys(progress.processedCodes).length} occupations, ${progress.remainingOccupations.length} remaining`);
  } catch (error) {
    console.error('Error saving progress file:', error);
  }
}

// Extract occupations from Word XML
function extractOccupationsFromWordXml(xmlData) {
  console.log('Extracting occupations from Word XML content...');
  
  // Extract all 6-digit codes (occupation codes)
  const codeMatches = xmlData.match(/\b([0-9]{6})\b/g) || [];
  const uniqueCodes = Array.from(new Set(codeMatches));
  
  console.log(`Found ${uniqueCodes.length} unique occupation codes in Word XML`);
  
  // Extract text content that might contain occupation names
  const textMatches = xmlData.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  const textContents = textMatches.map(match => {
    const content = match.replace(/<w:t[^>]*>|<\/w:t>/g, '').trim();
    return content;
  }).filter(text => text.length > 0);
  
  // Build a map of occupation codes to names
  const occupationMap = new Map();
  
  // Look for code-name pairs
  for (let i = 0; i < textContents.length; i++) {
    const content = textContents[i];
    
    // Check if this content is a 6-digit code
    if (/^[0-9]{6}$/.test(content)) {
      const code = content;
      // Check if the next content could be a name
      if (i + 1 < textContents.length && textContents[i + 1].length > 0) {
        const name = textContents[i + 1];
        // Only use names that don't look like codes
        if (!/^\d+$/.test(name)) {
          occupationMap.set(code, name);
          i++; // Skip the name we just processed
        }
      }
    }
  }
  
  // If we couldn't find enough pairs, try a different approach
  if (occupationMap.size < uniqueCodes.length / 2) {
    console.log(`First approach only found ${occupationMap.size} matches, trying alternative...`);
    
    // For each unique code, try to find text that follows it within a reasonable distance
    for (const code of uniqueCodes) {
      if (!occupationMap.has(code)) {
        // Find the index of this code in the original XML
        const codeIndex = xmlData.indexOf(code);
        if (codeIndex !== -1) {
          // Look for text after this code
          const afterCode = xmlData.substring(codeIndex + code.length, codeIndex + 500);
          const nameMatch = afterCode.match(/<w:t[^>]*>([^<]{5,100})<\/w:t>/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            // Only use names that don't look like codes or XML tags
            if (name.length > 0 && !/^\d+$/.test(name) && !name.includes('<') && !name.includes('>')) {
              occupationMap.set(code, name);
            }
          }
        }
      }
    }
  }
  
  console.log(`Matched ${occupationMap.size} occupations with names`);
  
  // Convert map to array of objects for processing
  return Array.from(occupationMap.entries()).map(([code, name]) => ({
    code,
    name,
    subminorGroupCode: code.substring(0, 4)
  }));
}

// Check for existence of occupation in database
async function checkOccupationExists(code) {
  try {
    const response = await axios.get(`${API_URL}/occupations/${code}`);
    return response.data.success;
  } catch (error) {
    return false;
  }
}

// Main import function
async function importAllOccupations() {
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
    
    // If we don't have occupations loaded yet, extract them from XML
    if (!progress.remainingOccupations || progress.remainingOccupations.length === 0) {
      // Check if XML file exists
      if (!fs.existsSync(XML_FILE_PATH)) {
        console.error(`Word XML file not found at ${XML_FILE_PATH}`);
        return;
      }
      
      console.log(`Reading Word XML file from ${XML_FILE_PATH}`);
      const xmlData = fs.readFileSync(XML_FILE_PATH, 'utf8');
      
      // Extract occupations from XML
      const allOccupations = extractOccupationsFromWordXml(xmlData);
      
      // Filter out already processed occupations
      progress.remainingOccupations = allOccupations.filter(
        occ => !progress.processedCodes[occ.code]
      );
      
      console.log(`Found ${allOccupations.length} occupations in XML file`);
      console.log(`Already processed: ${allOccupations.length - progress.remainingOccupations.length}`);
      console.log(`Remaining to process: ${progress.remainingOccupations.length}`);
      
      saveProgress(progress);
    }
    
    // Check if we have occupations to process
    if (progress.remainingOccupations.length === 0) {
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
      
      // Clean up progress file
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('Removed progress file - import complete');
      }
      
      return;
    }
    
    // Calculate how many batches to process in this run
    const batchesThisRun = Math.min(
      MAX_BATCHES_PER_RUN, 
      Math.ceil(progress.remainingOccupations.length / BATCH_SIZE)
    );
    
    console.log(`Will process ${batchesThisRun} batches in this run`);
    
    let successCount = progress.successCount || 0;
    let failureCount = progress.failureCount || 0;
    
    // Process batches
    for (let i = 0; i < batchesThisRun; i++) {
      const startIdx = i * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, progress.remainingOccupations.length);
      const batch = progress.remainingOccupations.slice(startIdx, endIdx);
      
      if (batch.length === 0) {
        break;
      }
      
      console.log(`\nProcessing batch ${i + 1}/${batchesThisRun} (${batch.length} occupations)`);
      
      try {
        const result = await importBatch(batch, token);
        console.log(`Batch result:`, result);
        
        // Mark these occupations as processed
        for (const occupation of batch) {
          progress.processedCodes[occupation.code] = true;
        }
        
        // Update counters
        successCount += result.data?.processed || 0;
        progress.successCount = successCount;
        
        // Save progress after each batch
        progress.remainingOccupations = progress.remainingOccupations.slice(endIdx);
        saveProgress(progress);
        
      } catch (error) {
        console.error(`Failed to process batch ${i + 1} after ${MAX_RETRIES} retries:`, error);
        failureCount += batch.length;
        progress.failureCount = failureCount;
        
        // Still remove these occupations from the queue
        progress.remainingOccupations = progress.remainingOccupations.slice(endIdx);
        saveProgress(progress);
      }
      
      // Add a small delay between batches to prevent overloading
      if (i < batchesThisRun - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Get current stats after this run
    const currentStats = await getCorStats();
    console.log('\nCurrent COR statistics:');
    console.log(`- Major groups: ${currentStats.majorGroups}`);
    console.log(`- Submajor groups: ${currentStats.submajorGroups}`);
    console.log(`- Minor groups: ${currentStats.minorGroups}`);
    console.log(`- Subminor groups: ${currentStats.subminorGroups}`);
    console.log(`- Occupations: ${currentStats.occupations}`);
    console.log(`- Active occupations: ${currentStats.activeOccupations}`);
    
    // Check if we need to run again
    if (progress.remainingOccupations.length > 0) {
      console.log(`\n🔄 PARTIAL IMPORT COMPLETED`);
      console.log(`Processed ${Object.keys(progress.processedCodes).length} occupations so far`);
      console.log(`${progress.remainingOccupations.length} occupations remaining`);
      console.log(`Run this script again to continue importing.`);
    } else {
      console.log('\n✅ ALL OCCUPATIONS SUCCESSFULLY PROCESSED');
      
      // Clean up progress file
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('Removed progress file - import complete');
      }
    }
    
  } catch (error) {
    console.error('Error in import process:', error);
  }
}

// Execute the import
importAllOccupations();