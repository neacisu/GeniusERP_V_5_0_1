/**
 * Update Missing Occupations from Verification Report
 * 
 * This script updates the missing-occupations.json file using the verification report
 * to ensure we capture all missing occupations for import.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const VERIFICATION_REPORT = path.join(__dirname, 'cor-verification-report.json');
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const UPDATED_MISSING_FILE = path.join(__dirname, 'updated-missing-occupations.json');

// Extract occupation name from XML for a given code
function findOccupationNameInXml(xmlData, code) {
  // Look for the code followed by text in XML
  const codePattern = new RegExp(`\\b${code}\\b[^<]*<\\/w:t><\\/w:r><w:r[^>]*><w:t[^>]*>([^<]+)`, 'i');
  const match = xmlData.match(codePattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Alternative approach: look for the code and the next text content
  const codeIndex = xmlData.indexOf(code);
  if (codeIndex !== -1) {
    // Look for text after this code
    const afterCode = xmlData.substring(codeIndex + code.length, codeIndex + 500);
    const nameMatch = afterCode.match(/<w:t[^>]*>([^<]{5,100})<\/w:t>/);
    if (nameMatch && nameMatch[1]) {
      const name = nameMatch[1].trim();
      // Only use names that don't look like codes and aren't too short
      if (name.length > 3 && !/^\d+$/.test(name) && !name.includes('<') && !name.includes('>')) {
        return name;
      }
    }
  }
  
  // If all else fails, return a placeholder with the code
  return `Occupation ${code}`;
}

// Update missing occupations
async function updateMissingOccupations() {
  console.log('=== Updating Missing Occupations ===\n');
  
  // Check if verification report exists
  if (!fs.existsSync(VERIFICATION_REPORT)) {
    console.error(`Verification report not found at ${VERIFICATION_REPORT}`);
    return;
  }
  
  // Read verification report
  const verificationReport = JSON.parse(fs.readFileSync(VERIFICATION_REPORT, 'utf8'));
  const missingCodes = verificationReport.missingCodes;
  
  console.log(`Found ${missingCodes.length} missing occupation codes in verification report`);
  
  // Check if XML file exists
  if (!fs.existsSync(XML_FILE_PATH)) {
    console.error(`Word XML file not found at ${XML_FILE_PATH}`);
    return;
  }
  
  // Read XML data
  console.log(`Reading Word XML file from ${XML_FILE_PATH}`);
  const xmlData = fs.readFileSync(XML_FILE_PATH, 'utf8');
  
  // Build updated missing occupations list
  const updatedMissingOccupations = [];
  
  for (const code of missingCodes) {
    // Get occupation name from XML
    const name = findOccupationNameInXml(xmlData, code);
    
    // Add to updated missing occupations
    updatedMissingOccupations.push({
      code,
      name,
      subminorGroupCode: code.substring(0, 4)
    });
  }
  
  console.log(`Generated ${updatedMissingOccupations.length} updated missing occupation records`);
  
  // Save to updated missing occupations file
  fs.writeFileSync(UPDATED_MISSING_FILE, JSON.stringify(updatedMissingOccupations, null, 2));
  console.log(`Saved updated missing occupations to ${UPDATED_MISSING_FILE}`);
  
  // Backup original missing file if it exists
  if (fs.existsSync(MISSING_FILE)) {
    const backupPath = `${MISSING_FILE}.bak`;
    fs.copyFileSync(MISSING_FILE, backupPath);
    console.log(`Backed up original missing occupations file to ${backupPath}`);
    
    // Replace original with updated file
    fs.copyFileSync(UPDATED_MISSING_FILE, MISSING_FILE);
    console.log(`Updated main missing occupations file ${MISSING_FILE}`);
  } else {
    console.log(`Original missing file not found, using updated file only`);
  }
  
  // Remove progress file if it exists to start fresh
  const progressFile = path.join(__dirname, 'missing-import-progress.json');
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
    console.log(`Removed progress file ${progressFile} to start fresh import`);
  }
  
  console.log('\n=== Update Complete ===');
  console.log(`Run import-missing-occupations.js or run-missing-imports.js to import the updated list of ${updatedMissingOccupations.length} missing occupations`);
}

// Execute update
updateMissingOccupations();