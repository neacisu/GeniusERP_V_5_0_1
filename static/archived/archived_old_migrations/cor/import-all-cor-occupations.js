/**
 * Import All COR Occupations
 * 
 * This script ensures that ALL occupations from the Word XML file are imported
 * into the database. It tracks progress between runs and continues until complete.
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 25; // Smaller batch size for better reliability
const MAX_BATCHES_PER_RUN = 5; // Only process 5 batches per run to avoid timeouts
const API_URL = 'http://localhost:5000/api/hr/cor';
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const PROGRESS_FILE = path.join(__dirname, 'cor-import-progress.json');
const MAX_RETRIES = 3; // Maximum number of retries for failed batches

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

// Extract occupation codes and names from XML
async function extractOccupationsFromXml(xmlFilePath) {
  console.log(`Processing Word XML file to extract occupations from ${xmlFilePath}`);
  
  // Read the file content
  const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
  
  // Extract all 6-digit numbers (occupation codes) from the document
  const codeMatches = xmlData.match(/\b([0-9]{6})\b/g) || [];
  const uniqueCodes = Array.from(new Set(codeMatches));
  
  console.log(`Found ${uniqueCodes.length} unique occupation codes in Word XML`);
  
  // Extract text content that might contain occupation names
  const textMatches = xmlData.match(/<w:t>([^<]+)<\/w:t>/g) || [];
  const textContents = textMatches.map(match => {
    const content = match.replace(/<w:t>|<\/w:t>/g, '').trim();
    return content;
  }).filter(text => text.length > 0);
  
  // Build a map of occupation codes to names
  const occupationMap = new Map();
  
  // First approach: Extract occupation text chunks (code followed by name)
  for (let i = 0; i < textContents.length; i++) {
    const content = textContents[i];
    
    // Check if this content is a 6-digit code
    if (/^[0-9]{6}$/.test(content)) {
      const code = content;
      // Check if the next content exists and could be a name
      if (i + 1 < textContents.length && textContents[i + 1].length > 0) {
        const name = textContents[i + 1];
        occupationMap.set(code, name);
        i++; // Skip the name we just processed
      }
    }
  }
  
  // If we couldn't find enough pairs, try a different approach
  if (occupationMap.size < uniqueCodes.length / 2) {
    console.log(`First approach only found ${occupationMap.size} matches, trying alternative...`);
    occupationMap.clear();
    
    // For each unique code, try to find text that contains or follows that code
    for (const code of uniqueCodes) {
      // Find the index of this code in the original XML
      const codeIndex = xmlData.indexOf(code);
      if (codeIndex !== -1) {
        // Look for text after this code within a reasonable distance
        const afterCode = xmlData.substring(codeIndex + code.length, codeIndex + 500);
        const nameMatch = afterCode.match(/<w:t>([^<]{5,100})<\/w:t>/);
        if (nameMatch) {
          const name = nameMatch[1].trim();
          // Only use names that don't look like codes or XML tags
          if (name.length > 5 && !/^\d+$/.test(name) && !name.includes('<') && !name.includes('>')) {
            occupationMap.set(code, name);
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
        timeout: 30000 // 30 second timeout
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
      console.log(`Loaded progress: processed ${progress.processedBatches} of ${progress.totalBatches} batches`);
      return progress;
    } catch (error) {
      console.error('Error loading progress file:', error);
      return { processedBatches: 0, processedCodes: {}, successCount: 0, failureCount: 0, totalBatches: 0 };
    }
  }
  return { processedBatches: 0, processedCodes: {}, successCount: 0, failureCount: 0, totalBatches: 0 };
}

// Save progress to file
function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
    console.log(`Saved progress: processed ${progress.processedBatches} of ${progress.totalBatches} batches`);
  } catch (error) {
    console.error('Error saving progress file:', error);
  }
}

// Main function to import all occupations
async function importAllOccupations() {
  try {
    // Get initial COR stats
    const initialStats = await getCorStats();
    if (!initialStats) {
      console.error('Failed to get initial COR stats. Exiting.');
      return;
    }
    
    console.log('Initial COR statistics:');
    console.log(`- Major groups: ${initialStats.majorGroups}`);
    console.log(`- Submajor groups: ${initialStats.submajorGroups}`);
    console.log(`- Minor groups: ${initialStats.minorGroups}`);
    console.log(`- Subminor groups: ${initialStats.subminorGroups}`);
    console.log(`- Occupations: ${initialStats.occupations}`);
    console.log(`- Active occupations: ${initialStats.activeOccupations}`);
    
    // Generate admin token for authentication
    const token = generateAdminToken();
    
    // Check if the XML file exists
    if (!fs.existsSync(XML_FILE_PATH)) {
      console.error(`Word XML file not found at ${XML_FILE_PATH}`);
      return;
    }
    
    console.log(`Found Word XML file at ${XML_FILE_PATH}`);
    
    // Extract all occupations from the XML file
    const allOccupations = await extractOccupationsFromXml(XML_FILE_PATH);
    
    // Load previous progress
    let progress = loadProgress();
    
    // Calculate total number of batches
    const totalBatches = Math.ceil(allOccupations.length / BATCH_SIZE);
    progress.totalBatches = totalBatches;
    
    // Initialize processedCodes if not exists
    if (!progress.processedCodes) {
      progress.processedCodes = {};
    }
    
    console.log(`Processing ${allOccupations.length} occupations in ${totalBatches} batches`);
    console.log(`Already processed: ${Object.keys(progress.processedCodes).length} occupations`);
    
    // Filter out already processed occupations
    const pendingOccupations = allOccupations.filter(
      occupation => !progress.processedCodes[occupation.code]
    );
    
    console.log(`Remaining occupations to process: ${pendingOccupations.length}`);
    
    if (pendingOccupations.length === 0) {
      console.log('All occupations have already been processed!');
      
      // Verify final stats
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
    
    // Process remaining occupations in batches
    const batches = [];
    for (let i = 0; i < pendingOccupations.length; i += BATCH_SIZE) {
      batches.push(pendingOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches for remaining occupations`);
    
    let successCount = progress.successCount || 0;
    let failureCount = progress.failureCount || 0;
    
    // Calculate the starting batch index based on previous progress
    const startBatchIndex = progress.processedBatches || 0;
    const endBatchIndex = Math.min(startBatchIndex + MAX_BATCHES_PER_RUN, batches.length);
    
    console.log(`Processing batches ${startBatchIndex + 1} to ${endBatchIndex} (out of ${batches.length} total batches)`);
    
    for (let i = startBatchIndex; i < endBatchIndex; i++) {
      const batchNumber = i + 1;
      const batch = batches[i];
      console.log(`\nProcessing batch ${batchNumber}/${batches.length} (${batch.length} occupations)`);
      
      try {
        const result = await importBatch(batch, token);
        console.log(`Batch ${batchNumber} result:`, result);
        
        // Mark occupations as processed
        batch.forEach(occupation => {
          progress.processedCodes[occupation.code] = true;
        });
        
        // Update counters
        successCount += result.data?.processed || 0;
        progress.processedBatches += 1;
        progress.successCount = successCount;
        
        // Save progress after each batch
        saveProgress(progress);
        
      } catch (error) {
        console.error(`Failed to process batch ${batchNumber} after ${MAX_RETRIES} retries:`, error);
        failureCount += batch.length;
        progress.failureCount = failureCount;
        saveProgress(progress);
      }
      
      // Add a small delay between batches to prevent overloading
      if (i < endBatchIndex - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Provide progress information after this run
    if (endBatchIndex < batches.length) {
      console.log(`\n🔄 PARTIAL IMPORT COMPLETED: ${endBatchIndex} of ${batches.length} batches processed`);
      console.log(`Run this script again to continue importing the remaining batches.`);
    }
    
    console.log('\nImport summary:');
    console.log(`- Total occupations in XML: ${allOccupations.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed to import: ${failureCount}`);
    
    // Get COR stats after import
    const finalStats = await getCorStats();
    console.log('\nFinal COR statistics:');
    console.log(`- Major groups: ${finalStats.majorGroups}`);
    console.log(`- Submajor groups: ${finalStats.submajorGroups}`);
    console.log(`- Minor groups: ${finalStats.minorGroups}`);
    console.log(`- Subminor groups: ${finalStats.subminorGroups}`);
    console.log(`- Occupations: ${finalStats.occupations}`);
    console.log(`- Active occupations: ${finalStats.activeOccupations}`);
    
    // Check if we've added all occupations
    if (finalStats.occupations >= initialStats.occupations + pendingOccupations.length - failureCount) {
      console.log('\n✅ ALL OCCUPATIONS SUCCESSFULLY IMPORTED');
      
      // Import is complete, remove progress file
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
        console.log('Removed progress file - import complete');
      }
    } else {
      console.log('\n⚠️ Some occupations may not have been imported correctly.');
      console.log(`Expected at least ${initialStats.occupations + pendingOccupations.length - failureCount} occupations, but have ${finalStats.occupations}`);
    }
    
  } catch (error) {
    console.error('Error importing all occupations:', error);
  }
}

// Execute the import function
importAllOccupations();