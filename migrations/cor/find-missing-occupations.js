/**
 * Find Missing Occupations
 * 
 * This script compares occupations in the XML file with those in the database
 * to find occupations that are missing from the database.
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
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const API_URL = 'http://localhost:5000/api/hr/cor';
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const BATCH_SIZE = 5;

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

// Get all occupations from database
async function getExistingOccupations() {
  try {
    console.log('Fetching all occupations from database...');
    const response = await axios.get(`${API_URL}/occupations`, {
      params: { limit: 5000 },
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success && response.data.data) {
      const occupations = response.data.data;
      console.log(`Retrieved ${occupations.length} occupations from database`);
      return occupations;
    } else {
      throw new Error('Failed to retrieve occupations from database');
    }
  } catch (error) {
    console.error('Error getting occupations:', error.response?.data || error.message);
    return [];
  }
}

// Extract occupations from XML
function extractOccupationsFromXml(xmlData) {
  console.log('Extracting occupations from XML content...');
  
  // Extract all 6-digit codes (occupation codes)
  const codeMatches = xmlData.match(/\b([0-9]{6})\b/g) || [];
  const uniqueCodes = Array.from(new Set(codeMatches));
  
  console.log(`Found ${uniqueCodes.length} unique occupation codes in XML`);
  
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
  
  console.log(`Matched ${occupationMap.size} occupations with names in XML`);
  
  // Convert map to array of objects for processing
  return Array.from(occupationMap.entries()).map(([code, name]) => ({
    code,
    name,
    subminorGroupCode: code.substring(0, 4)
  }));
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
        timeout: 10000 // 10 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    throw error;
  }
}

// Find missing occupations
async function findMissingOccupations() {
  try {
    // Check if XML file exists
    if (!fs.existsSync(XML_FILE_PATH)) {
      console.error(`Word XML file not found at ${XML_FILE_PATH}`);
      return;
    }
    
    console.log(`Reading Word XML file from ${XML_FILE_PATH}`);
    const xmlData = fs.readFileSync(XML_FILE_PATH, 'utf8');
    
    // Get existing occupations from database
    const existingOccupations = await getExistingOccupations();
    const existingCodes = new Set(existingOccupations.map(occ => occ.code));
    
    // Extract occupations from XML
    const xmlOccupations = extractOccupationsFromXml(xmlData);
    
    // Find missing occupations
    const missingOccupations = xmlOccupations.filter(
      occ => !existingCodes.has(occ.code)
    );
    
    console.log(`Found ${missingOccupations.length} occupations in XML that are missing from database`);
    
    // Save missing occupations to file
    fs.writeFileSync(MISSING_FILE, JSON.stringify(missingOccupations, null, 2));
    console.log(`Saved missing occupations to ${MISSING_FILE}`);
    
    // If there are missing occupations, ask if we should import them
    if (missingOccupations.length > 0) {
      console.log('\nWould you like to import these missing occupations now? (y/n)');
      
      // For this script, we'll automatically import them
      console.log('Auto-importing missing occupations...');
      
      // Generate admin token
      const token = generateAdminToken();
      
      // Process in batches
      const batches = [];
      for (let i = 0; i < missingOccupations.length; i += BATCH_SIZE) {
        batches.push(missingOccupations.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Created ${batches.length} batches for import`);
      
      let insertCount = 0;
      let updateCount = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} occupations)`);
        
        try {
          const result = await importBatch(batch, token);
          console.log(`Batch result:`, result);
          
          insertCount += result.data?.inserted || 0;
          updateCount += result.data?.updated || 0;
          
        } catch (error) {
          console.error(`Failed to process batch ${i + 1}:`, error);
        }
        
        // Add a small delay between batches
        if (i < batches.length - 1) {
          console.log('Waiting before next batch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('\nImport summary:');
      console.log(`- Total missing occupations: ${missingOccupations.length}`);
      console.log(`- Successfully inserted: ${insertCount}`);
      console.log(`- Updated: ${updateCount}`);
    }
    
  } catch (error) {
    console.error('Error finding missing occupations:', error);
  }
}

// Execute the function
findMissingOccupations();