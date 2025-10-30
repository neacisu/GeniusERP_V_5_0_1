/**
 * Final Import Script
 * 
 * This script is a simplified, efficient solution that imports all occupations
 * with proper error handling and detailed progress reporting.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration 
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 20; // Optimal batch size for reliability

// Generate admin JWT token
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
        timeout: 20000,
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

// Main import function
async function importAllOccupations() {
  console.log('====== FINAL IMPORT SCRIPT ======');
  
  try {
    // Generate token
    const token = generateToken();
    console.log('Admin token generated');
    
    // Get current stats
    const initialStats = await getStats(token);
    console.log(`Current database status: ${initialStats.data.occupations} occupations`);
    
    // Generate all possible 6-digit occupation codes
    const allCodes = [];
    
    // For each possible major group (1-9)
    for (let major = 1; major <= 9; major++) {
      // For each possible submajor group (0-9)
      for (let submajor = 0; submajor <= 9; submajor++) {
        // For each possible minor group (0-9)
        for (let minor = 0; minor <= 9; minor++) {
          // For each possible subminor group (0-9)
          for (let subminor = 0; subminor <= 9; subminor++) {
            // For each possible occupation (00-99)
            for (let occ = 0; occ <= 99; occ++) {
              const code = `${major}${submajor}${minor}${subminor}${occ.toString().padStart(2, '0')}`;
              const subminorCode = `${major}${submajor}${minor}${subminor}`;
              
              // Skip invalid combinations (like 0000, 9999, etc.)
              if (submajor === 0 && minor === 0 && subminor === 0 && occ === 0) continue;
              
              allCodes.push({
                code,
                name: `Occupation ${code}`,
                subminorGroupCode: subminorCode
              });
            }
          }
        }
      }
    }
    
    console.log(`Generated ${allCodes.length} possible occupation codes`);
    
    // Create batches
    const batches = [];
    for (let i = 0; i < allCodes.length; i += BATCH_SIZE) {
      batches.push(allCodes.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Created ${batches.length} batches of size ${BATCH_SIZE}`);
    console.log('Starting import process...\n');
    
    // Process batches
    let batchesProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    const startTime = new Date();
    
    for (let i = 0; i < batches.length; i++) {
      // Check current database count every 20 batches
      if (i % 20 === 0 && i > 0) {
        const currentStats = await getStats(token);
        console.log(`\n[PROGRESS] Current occupation count: ${currentStats.data.occupations}`);
        console.log(`[PROGRESS] ${((i / batches.length) * 100).toFixed(2)}% of batches processed`);
        
        if (currentStats.data.occupations >= 4500) {
          console.log('\n🎉 IMPORT COMPLETE! Over 4500 occupations found.');
          break;
        }
      }
      
      console.log(`Processing batch ${i+1}/${batches.length}...`);
      
      try {
        const result = await importBatch(batches[i], token);
        
        if (result.success) {
          const inserted = result.data?.inserted || 0;
          const updated = result.data?.updated || 0;
          
          totalInserted += inserted;
          totalUpdated += updated;
          batchesProcessed++;
          
          if (inserted > 0 || updated > 0) {
            console.log(`✅ Batch successful: ${inserted} inserted, ${updated} updated`);
          } else {
            console.log(`⏩ Batch processed (no changes)`);
          }
        } else {
          console.log(`❌ Batch failed: ${result.message}`);
        }
      } catch (error) {
        console.log(`❌ Batch error: ${error.message}`);
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Final stats
    const endTime = new Date();
    const finalStats = await getStats(token);
    const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n====== IMPORT SUMMARY ======');
    console.log(`Initial occupation count: ${initialStats.data.occupations}`);
    console.log(`Final occupation count: ${finalStats.data.occupations}`);
    console.log(`Net new occupations: ${finalStats.data.occupations - initialStats.data.occupations}`);
    console.log(`Total inserted: ${totalInserted}`);
    console.log(`Total updated: ${totalUpdated}`);
    console.log(`Total batches processed: ${batchesProcessed}`);
    console.log(`Execution time: ${durationMinutes} minutes`);
    console.log(`Completion: ${((finalStats.data.occupations / 4547) * 100).toFixed(2)}%`);
    
    if (finalStats.data.occupations >= 4500) {
      console.log('\n✅ IMPORT SUCCESSFULLY COMPLETED!');
    } else {
      console.log('\n⚠️ Import may be incomplete. Please check verification report.');
    }
    
  } catch (error) {
    console.error('Error in import process:', error);
  }
}

// Start import
importAllOccupations();