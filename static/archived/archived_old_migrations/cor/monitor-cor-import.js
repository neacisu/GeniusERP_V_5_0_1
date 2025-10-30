/**
 * Monitor COR Import Progress
 * 
 * This script periodically checks the current COR statistics and calculates
 * the progress of the import process.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration
const API_URL = 'http://localhost:5000/api/hr/cor';
const TOTAL_EXPECTED = 4547;
const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_CHECKS = 100; // Limit to avoid infinite running

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

// Get COR statistics
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

// Display progress bar
function progressBar(percentage, length = 30) {
  const filledLength = Math.round(length * (percentage / 100));
  const emptyLength = length - filledLength;
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  return `${filled}${empty} ${percentage.toFixed(2)}%`;
}

// Main monitoring function
async function monitorImport() {
  console.log('===== COR IMPORT PROGRESS MONITOR =====');
  console.log(`Total expected occupations: ${TOTAL_EXPECTED}`);
  console.log(`Checking every ${CHECK_INTERVAL/1000} seconds...`);
  console.log('---------------------------------------');
  
  const token = generateToken();
  let initialStats = null;
  let lastStats = null;
  let checkCount = 0;
  let startTime = new Date();
  
  // Get initial stats
  initialStats = await getStats(token);
  if (!initialStats) {
    console.error('Failed to get initial stats. Exiting monitor.');
    return;
  }
  
  lastStats = initialStats;
  
  console.log(`Initial occupation count: ${initialStats.occupations}`);
  console.log(`Initial completion: ${((initialStats.occupations / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
  console.log('---------------------------------------');
  
  // Start monitoring loop
  const monitoringInterval = setInterval(async () => {
    checkCount++;
    
    // Get latest stats
    const stats = await getStats(token);
    if (!stats) {
      console.log(`Check #${checkCount}: Failed to get stats`);
      
      // Generate a new token after several failures
      if (checkCount % 5 === 0) {
        console.log('Refreshing authentication token...');
        token = generateToken();
      }
      
      return;
    }
    
    // Calculate progress
    const currentCount = stats.occupations;
    const completion = (currentCount / TOTAL_EXPECTED) * 100;
    const addedSinceStart = currentCount - initialStats.occupations;
    const addedSinceLastCheck = currentCount - lastStats.occupations;
    const elapsedSeconds = Math.round((new Date() - startTime) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const remainingSeconds = elapsedSeconds % 60;
    
    // Calculate rate and ETA
    let rate = 0;
    let etaMinutes = 'Unknown';
    
    if (elapsedSeconds > 0) {
      rate = addedSinceStart / (elapsedSeconds / 60); // occupations per minute
      
      if (rate > 0) {
        const remaining = TOTAL_EXPECTED - currentCount;
        const estimatedMinutes = remaining / rate;
        etaMinutes = estimatedMinutes.toFixed(1);
      }
    }
    
    // Display current status
    console.log(`\nCheck #${checkCount} (${elapsedMinutes}m ${remainingSeconds}s elapsed):`);
    console.log(`Occupations: ${currentCount} / ${TOTAL_EXPECTED}`);
    console.log(`Progress: ${progressBar(completion)}`);
    console.log(`Added since start: ${addedSinceStart}`);
    
    if (addedSinceLastCheck > 0) {
      console.log(`Added since last check: +${addedSinceLastCheck}`);
      console.log(`Current rate: ${rate.toFixed(2)} occupations/minute`);
      console.log(`Estimated time remaining: ~${etaMinutes} minutes`);
    } else {
      console.log('No new occupations since last check');
    }
    
    // Update last stats
    lastStats = stats;
    
    // Check if import is complete or monitor reached max checks
    if (currentCount >= TOTAL_EXPECTED || checkCount >= MAX_CHECKS) {
      clearInterval(monitoringInterval);
      
      console.log('\n===== MONITORING COMPLETE =====');
      console.log(`Final occupation count: ${currentCount} / ${TOTAL_EXPECTED}`);
      console.log(`Final completion: ${((currentCount / TOTAL_EXPECTED) * 100).toFixed(2)}%`);
      console.log(`Total added: ${currentCount - initialStats.occupations}`);
      console.log(`Total monitoring time: ${elapsedMinutes}m ${remainingSeconds}s`);
      
      // Final status
      if (currentCount >= TOTAL_EXPECTED) {
        console.log('\n🎉 IMPORT 100% COMPLETE!');
      } else if (currentCount >= 4500) {
        console.log('\n✅ IMPORT SUCCESSFUL (≥ 99%)!');
      } else {
        console.log('\n⏳ Import still in progress...');
      }
    }
  }, CHECK_INTERVAL);
}

// Start monitoring
monitorImport();