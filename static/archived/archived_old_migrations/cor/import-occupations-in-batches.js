/**
 * Import COR Occupations from Word XML file in batches
 * 
 * This script processes the Word XML file and imports occupations in smaller batches
 * to prevent timeouts and ensure all data is imported successfully.
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
const BATCH_SIZE = 100; // Number of occupations to process in each batch
const API_URL = 'http://localhost:5000/api/hr/cor';
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');

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
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to import occupations in batches
async function importOccupationsInBatches() {
  try {
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
    
    // Calculate total number of batches
    const totalBatches = Math.ceil(allOccupations.length / BATCH_SIZE);
    console.log(`Processing ${allOccupations.length} occupations in ${totalBatches} batches`);
    
    // Process occupations in batches
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < allOccupations.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const batch = allOccupations.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} occupations)`);
      
      try {
        const result = await importBatch(batch, token);
        console.log(`Batch ${batchNumber} result:`, result);
        successCount += result.data?.processed || 0;
      } catch (error) {
        console.error(`Failed to process batch ${batchNumber}:`, error);
        failureCount += batch.length;
      }
      
      // Add a small delay between batches to let the server breathe
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\nImport summary:');
    console.log(`- Total occupations: ${allOccupations.length}`);
    console.log(`- Successfully imported: ${successCount}`);
    console.log(`- Failed to import: ${failureCount}`);
    
    // Get COR stats after import
    try {
      const statsResponse = await axios.get(
        `${API_URL}/stats`,
        { 
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      console.log('\nCOR statistics after import:', statsResponse.data);
    } catch (error) {
      console.error('Error fetching COR stats:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Error importing occupations in batches:', error);
  }
}

// Execute the import function
importOccupationsInBatches();