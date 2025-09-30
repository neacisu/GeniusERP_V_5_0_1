/**
 * COR Occupation Data Updater
 * 
 * This script:
 * 1. Extracts occupation data from both Word XML and Excel XML formats
 * 2. Verifies data against existing database records
 * 3. Creates an update file containing correct occupation names
 * 4. Optionally sends update requests to the API
 * 
 * It specifically addresses the issue where occupations exist but have
 * "Unknown" names or are missing proper data.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WORD_XML_FILE = path.join(__dirname, 'attached_assets/isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const EXCEL_XML_FILE = path.join(__dirname, 'attached_assets/cor-grupe-ocupationale.xml');
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const UPDATES_FILE = path.join(__dirname, 'occupation-updates.json');
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 5;

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

/**
 * Get current COR statistics
 */
async function getStats(token) {
  try {
    const response = await axios.get(`${API_URL}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      console.error('Failed to get stats:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    return null;
  }
}

/**
 * Extract occupation data from Word XML
 */
async function extractFromWordXml() {
  console.log('Extracting occupations from Word XML file...');
  
  try {
    // Read the XML file
    const xmlData = fs.readFileSync(WORD_XML_FILE, 'utf8');
    
    // Use regex to find patterns where an occupation code is followed by a name
    const occupationMap = new Map();
    
    // Look for patterns: <w:t>CODE</w:t> ... <w:t>NAME</w:t>
    const codeRegex = /<w:t>(\d{6})<\/w:t>/g;
    let match;
    let matches = 0;
    
    while ((match = codeRegex.exec(xmlData)) !== null) {
      matches++;
      const code = match[1];
      
      // Search for the occupation name in the text following the code
      const position = match.index + match[0].length;
      const subsequent = xmlData.substring(position, position + 500);
      
      // Look for the first <w:t> tag after the code, which contains the name
      const nameMatch = subsequent.match(/<w:t>([^<]+)<\/w:t>/);
      
      if (nameMatch && nameMatch[1]) {
        // Clean the name and add to our map
        const name = nameMatch[1].trim();
        occupationMap.set(code, name);
      }
    }
    
    console.log(`Found ${matches} code occurrences in Word XML`);
    console.log(`Extracted ${occupationMap.size} valid occupations with names`);
    
    return occupationMap;
  } catch (error) {
    console.error('Error extracting from Word XML:', error.message);
    return new Map();
  }
}

/**
 * Extract occupation data from Excel XML
 */
async function extractFromExcelXml() {
  console.log('Extracting occupations from Excel XML file...');
  
  try {
    // Read the XML file
    const xmlData = fs.readFileSync(EXCEL_XML_FILE, 'utf8');
    
    // Look for patterns that represent rows with occupation data
    const occupationMap = new Map();
    
    // Excel XML format has a specific pattern for cells with data
    const rowRegex = /<Row>([\s\S]*?)<\/Row>/g;
    let rowMatch;
    let validRows = 0;
    
    while ((rowMatch = rowRegex.exec(xmlData)) !== null) {
      const rowContent = rowMatch[1];
      
      // Check if the row has at least 2 cells (code and name)
      const cells = rowContent.match(/<Cell[^>]*>[\s\S]*?<\/Cell>/g);
      
      if (cells && cells.length >= 2) {
        // Extract data from the first cell (code)
        const codeMatch = cells[0].match(/<Data[^>]*>([^<]+)<\/Data>/);
        
        // Extract data from the second cell (name)
        const nameMatch = cells[1].match(/<Data[^>]*>([^<]+)<\/Data>/);
        
        if (codeMatch && nameMatch) {
          const codeValue = codeMatch[1].trim();
          const nameValue = nameMatch[1].trim();
          
          // Check if this looks like a 6-digit occupation code
          if (/^\d{6}$/.test(codeValue)) {
            occupationMap.set(codeValue, nameValue);
            validRows++;
          }
        }
      }
    }
    
    console.log(`Found ${validRows} valid occupation entries in Excel XML`);
    
    return occupationMap;
  } catch (error) {
    console.error('Error extracting from Excel XML:', error.message);
    return new Map();
  }
}

/**
 * Load missing occupations from file
 */
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

/**
 * Update a batch of occupations
 */
async function updateBatch(batch, token) {
  try {
    const response = await axios.post(
      `${API_URL}/import-batch`,
      { occupations: batch },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating batch:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('===== COR OCCUPATION DATA UPDATER =====');
  
  // Check if files exist
  if (!fs.existsSync(WORD_XML_FILE)) {
    console.error(`Word XML file not found: ${WORD_XML_FILE}`);
    return;
  }
  
  if (!fs.existsSync(EXCEL_XML_FILE)) {
    console.error(`Excel XML file not found: ${EXCEL_XML_FILE}`);
    return;
  }
  
  try {
    // Get current database stats
    const token = generateToken();
    const stats = await getStats(token);
    
    if (!stats) {
      console.error('Failed to get database stats. Exiting.');
      return;
    }
    
    console.log('\nCurrent Database Stats:');
    console.log(`Occupations: ${stats.occupations}`);
    console.log(`Major Groups: ${stats.majorGroups}`);
    console.log(`Submajor Groups: ${stats.submajorGroups}`);
    console.log(`Minor Groups: ${stats.minorGroups}`);
    console.log(`Subminor Groups: ${stats.subminorGroups}`);
    
    // Extract occupations from both sources
    const wordOccupations = await extractFromWordXml();
    const excelOccupations = await extractFromExcelXml();
    
    console.log('\nExtraction Results:');
    console.log(`Word XML: ${wordOccupations.size} occupations`);
    console.log(`Excel XML: ${excelOccupations.size} occupations`);
    
    // Combine the data (prioritizing Word XML where we have both)
    const combinedOccupations = new Map([...excelOccupations, ...wordOccupations]);
    console.log(`Combined: ${combinedOccupations.size} unique occupations`);
    
    // Load missing occupations list
    const missingOccupations = loadMissingOccupations();
    console.log(`Missing occupations file: ${missingOccupations.length} entries`);
    
    // Create updates by matching missing occupation codes with our extracted data
    const updates = [];
    const notFound = [];
    
    for (const missing of missingOccupations) {
      const code = missing.code;
      const subminorGroupCode = missing.subminorGroupCode;
      
      if (combinedOccupations.has(code)) {
        // We have a proper name for this occupation code
        updates.push({
          code,
          name: combinedOccupations.get(code),
          subminorGroupCode
        });
      } else {
        // We don't have this occupation in our extracted data
        notFound.push(code);
      }
    }
    
    console.log(`\nFound updates for ${updates.length} occupations`);
    console.log(`Could not find ${notFound.length} occupations in XML files`);
    
    // Save the updates to a file
    fs.writeFileSync(UPDATES_FILE, JSON.stringify(updates, null, 2));
    console.log(`\nUpdates saved to ${UPDATES_FILE}`);
    
    // Ask whether to apply the updates to the database
    const shouldUpdate = true; // In a real script, this would be a prompt
    
    if (shouldUpdate && updates.length > 0) {
      console.log('\nApplying updates to database...');
      
      // Create batches for processing
      const batches = [];
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        batches.push(updates.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`Created ${batches.length} batches of up to ${BATCH_SIZE} occupations each`);
      
      // Process each batch
      let batchesProcessed = 0;
      let updatedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\nProcessing batch ${i+1}/${batches.length} (${batch.length} occupations)...`);
        
        try {
          const result = await updateBatch(batch, token);
          
          if (result && result.success) {
            const updated = result.data?.updated || 0;
            updatedCount += updated;
            batchesProcessed++;
            
            console.log(`✅ Batch updated: ${updated} occupations`);
          } else {
            console.log(`❌ Batch failed: ${result?.message || 'Unknown error'}`);
            errorCount++;
          }
        } catch (error) {
          console.log(`❌ Error processing batch: ${error.message}`);
          errorCount++;
          
          // Pause briefly before continuing
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      // Final stats
      const finalStats = await getStats(token);
      
      console.log('\n===== UPDATE SUMMARY =====');
      console.log(`Batches processed: ${batchesProcessed}/${batches.length}`);
      console.log(`Occupations updated: ${updatedCount}`);
      console.log(`Errors encountered: ${errorCount}`);
      
      if (finalStats) {
        console.log(`\nFinal database occupation count: ${finalStats.occupations}`);
      }
    }
    
    console.log('\nProcess complete!');
    
  } catch (error) {
    console.error('Error during processing:', error.message);
  }
}

// Run the updater
main();