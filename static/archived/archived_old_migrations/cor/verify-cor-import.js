/**
 * COR Import Verification Script
 * 
 * This script verifies that all occupations from the XML file have been
 * successfully imported into the database by comparing codes.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const XML_FILE_PATH = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
const API_URL = 'http://localhost:5000/api/hr/cor';
const VERIFICATION_REPORT = path.join(__dirname, 'cor-verification-report.json');

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

// Extract occupation codes from XML
function extractOccupationCodesFromXml(xmlData) {
  console.log('Extracting occupation codes from XML content...');
  
  // Extract all 6-digit codes (occupation codes)
  const codeMatches = xmlData.match(/\b([0-9]{6})\b/g) || [];
  const uniqueCodes = Array.from(new Set(codeMatches));
  
  console.log(`Found ${uniqueCodes.length} unique occupation codes in XML`);
  
  return uniqueCodes;
}

// Verify COR import
async function verifyCorImport() {
  console.log('=== COR Import Verification ===\n');
  
  // Check if XML file exists
  if (!fs.existsSync(XML_FILE_PATH)) {
    console.error(`Word XML file not found at ${XML_FILE_PATH}`);
    return;
  }
  
  console.log(`Reading Word XML file from ${XML_FILE_PATH}`);
  const xmlData = fs.readFileSync(XML_FILE_PATH, 'utf8');
  
  // Extract occupation codes from XML
  const xmlCodes = extractOccupationCodesFromXml(xmlData);
  
  // Get existing occupations from database
  const dbOccupations = await getExistingOccupations();
  const dbCodes = new Set(dbOccupations.map(occ => occ.code));
  
  console.log('\nComparing XML codes with database codes...');
  
  // Find missing codes (in XML but not in DB)
  const missingCodes = xmlCodes.filter(code => !dbCodes.has(code));
  
  // Find extra codes (in DB but not in XML)
  const extraCodes = Array.from(dbCodes).filter(code => !xmlCodes.includes(code));
  
  // Calculate statistics
  const totalXmlCodes = xmlCodes.length;
  const totalDbCodes = dbCodes.size;
  const matchingCodes = totalXmlCodes - missingCodes.length;
  const percentImported = ((matchingCodes / totalXmlCodes) * 100).toFixed(2);
  
  // Print report
  console.log('\n=== Verification Results ===');
  console.log(`Total unique codes in XML: ${totalXmlCodes}`);
  console.log(`Total occupations in database: ${totalDbCodes}`);
  console.log(`Matching codes: ${matchingCodes} (${percentImported}%)`);
  console.log(`Missing codes (in XML but not in DB): ${missingCodes.length}`);
  console.log(`Extra codes (in DB but not in XML): ${extraCodes.length}`);
  
  // Save detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalXmlCodes,
      totalDbCodes,
      matchingCodes,
      percentImported,
      missingCount: missingCodes.length,
      extraCount: extraCodes.length
    },
    missingCodes,
    extraCodes
  };
  
  fs.writeFileSync(VERIFICATION_REPORT, JSON.stringify(report, null, 2));
  console.log(`\nDetailed verification report saved to ${VERIFICATION_REPORT}`);
  
  // Final assessment
  console.log('\n=== Final Assessment ===');
  if (missingCodes.length === 0) {
    console.log('✅ SUCCESS: All XML occupation codes are present in the database!');
  } else if (percentImported >= 99.5) {
    console.log('✅ MOSTLY COMPLETE: Over 99.5% of XML occupation codes are in the database.');
    console.log(`   Only ${missingCodes.length} codes are missing (see report for details).`);
  } else if (percentImported >= 95) {
    console.log('⚠️ PARTIALLY COMPLETE: Over 95% of XML occupation codes are in the database.');
    console.log(`   ${missingCodes.length} codes are still missing (see report for details).`);
  } else {
    console.log('❌ INCOMPLETE: Significant number of occupation codes are missing.');
    console.log(`   ${missingCodes.length} codes (${(100 - percentImported).toFixed(2)}%) are not imported.`);
  }
  
  // Return results for programmatic use
  return report;
}

// Execute verification
verifyCorImport();