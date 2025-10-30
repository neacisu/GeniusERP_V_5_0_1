/**
 * Verify COR Codes
 * 
 * This script checks specific COR codes to see if they exist in the database
 * and compares them with missing occupation data to identify potential issues.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const MISSING_FILE = path.join(__dirname, 'missing-occupations.json');
const API_URL = 'http://localhost:5000/api/hr/cor';

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

// Check if a specific occupation exists
async function checkOccupation(code, token) {
  try {
    const response = await axios.get(`${API_URL}/occupations/${code}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      exists: response.data && response.data.success,
      data: response.data?.data || null
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { exists: false, data: null };
    }
    
    console.error(`Error checking occupation ${code}:`, error.message);
    return { exists: false, error: error.message };
  }
}

// Load missing occupations from file
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

// Sample random occupations from the missing occupations file
function getSampleOccupations(occupations, count = 10) {
  if (occupations.length <= count) {
    return occupations;
  }
  
  const sample = [];
  const indices = new Set();
  
  while (sample.length < count) {
    const randomIndex = Math.floor(Math.random() * occupations.length);
    
    if (!indices.has(randomIndex)) {
      indices.add(randomIndex);
      sample.push(occupations[randomIndex]);
    }
  }
  
  return sample;
}

// Main verification function
async function verifyCorCodes() {
  console.log('===== VERIFYING COR CODES =====');
  
  try {
    // Generate token
    const token = generateToken();
    console.log('Admin token generated');
    
    // Load missing occupations
    const missingOccupations = loadMissingOccupations();
    if (!missingOccupations || missingOccupations.length === 0) {
      console.log('No missing occupations found');
      return;
    }
    
    console.log(`Loaded ${missingOccupations.length} occupations from missing-occupations.json`);
    
    // Print first 5 occupations from the missing list
    console.log('\nFirst 5 occupations from missing list:');
    missingOccupations.slice(0, 5).forEach(occ => {
      console.log(`- ${occ.code}: ${occ.name}`);
    });
    
    // Get a random sample of occupations to check
    const sampleOccupations = getSampleOccupations(missingOccupations, 10);
    
    console.log('\nVerifying 10 random occupations from missing list:');
    
    // Check each occupation
    for (const occ of sampleOccupations) {
      const result = await checkOccupation(occ.code, token);
      
      if (result.exists) {
        console.log(`✅ ${occ.code}: EXISTS in database as "${result.data?.name || 'Unknown'}"`);
        console.log(`   In missing file as: "${occ.name}"`);
      } else {
        console.log(`❌ ${occ.code}: MISSING from database`);
      }
    }
    
    // Try checking some specific occupations that should be common
    console.log('\nChecking specific occupation codes:');
    
    const specificCodes = ['242204', '251201', '214401', '332201', '411001'];
    
    for (const code of specificCodes) {
      const result = await checkOccupation(code, token);
      
      if (result.exists) {
        console.log(`✅ ${code}: EXISTS in database as "${result.data?.name || 'Unknown'}"`);
      } else {
        console.log(`❌ ${code}: MISSING from database`);
      }
    }
    
    // Check if missing-occupations.json contains records that already exist
    console.log('\nVerifying occupation state in database vs. missing file:');
    
    let existingCount = 0;
    let missingCount = 0;
    let errorCount = 0;
    
    // Check a subset of 30 occupations to avoid timeout
    const verificationSample = getSampleOccupations(missingOccupations, 30);
    
    for (const occ of verificationSample) {
      try {
        const result = await checkOccupation(occ.code, token);
        
        if (result.exists) {
          existingCount++;
        } else {
          missingCount++;
          console.log(`- Missing occupation: ${occ.code} (${occ.name})`);
        }
      } catch (error) {
        errorCount++;
        console.log(`- Error checking ${occ.code}: ${error.message}`);
      }
    }
    
    console.log('\nVerification Summary:');
    console.log(`Total sample size: ${verificationSample.length}`);
    console.log(`Already in database: ${existingCount} (${((existingCount / verificationSample.length) * 100).toFixed(2)}%)`);
    console.log(`Missing from database: ${missingCount} (${((missingCount / verificationSample.length) * 100).toFixed(2)}%)`);
    console.log(`Errors during check: ${errorCount}`);
    
    if (existingCount === verificationSample.length) {
      console.log('\n⚠️ All occupations in the "missing" file appear to already exist in the database.');
      console.log('This may explain why we see "updates" but no "inserts" during the import process.');
    }
    
    console.log('\nVerification complete!');
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

// Run the verification
verifyCorCodes();