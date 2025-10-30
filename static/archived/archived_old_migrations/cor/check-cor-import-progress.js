/**
 * Check COR Import Progress
 * 
 * This script tracks the progress of the COR import by querying the stats endpoint
 * periodically and displaying the occupation count.
 */

import fetch from 'node-fetch';
import readline from 'readline';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/hr';
const POLL_INTERVAL = 5000; // 5 seconds
const EXPECTED_TOTAL = 4247; // Expected total occupations from CSV

// Function to generate a simple token for authentication
function generateAdminToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId: 'admin-user-id',
    username: 'admin',
    roles: ['admin']
  };
  
  // Base64 encode the header and payload
  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const base64UrlPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Add a dummy signature
  return `${base64UrlHeader}.${base64UrlPayload}.dummy-signature`;
}

// Function to get COR database statistics
async function getCorStats() {
  try {
    // Generate admin token for authentication
    const token = generateAdminToken();
    
    const response = await fetch(`${API_BASE_URL}/cor/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error);
    return {
      majorGroups: 0,
      submajorGroups: 0,
      minorGroups: 0,
      subminorGroups: 0,
      occupations: 0,
      activeOccupations: 0
    };
  }
}

// Function to draw progress bar
function drawProgressBar(current, total, width = 40) {
  const percentage = Math.min(100, Math.floor((current / total) * 100));
  const filledWidth = Math.floor((width * current) / total);
  const emptyWidth = width - filledWidth;
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  return `${filled}${empty} ${percentage}% (${current}/${total})`;
}

// Function to monitor import progress
async function monitorImportProgress() {
  console.log('Starting COR import progress monitor...');
  console.log(`Expected total: ${EXPECTED_TOTAL} occupations\n`);
  
  let lastCount = 0;
  let startTime = Date.now();
  let lastUpdateTime = startTime;
  
  // Clear terminal and move cursor to home position
  const clearTerminal = () => {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  };
  
  // Monitor loop
  while (true) {
    try {
      // Get current stats
      const stats = await getCorStats();
      const currentCount = stats.occupations;
      const currentTime = Date.now();
      
      // Calculate metrics
      const imported = currentCount - lastCount;
      const elapsed = (currentTime - lastUpdateTime) / 1000;
      const totalElapsed = (currentTime - startTime) / 1000;
      const rate = imported > 0 ? imported / elapsed : 0;
      const overallRate = currentCount > 0 ? currentCount / totalElapsed : 0;
      
      // Calculate estimated time remaining
      const remaining = EXPECTED_TOTAL - currentCount;
      const etaSeconds = overallRate > 0 ? remaining / overallRate : 0;
      
      // Format time for display
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
      };
      
      // Update terminal display
      clearTerminal();
      
      console.log('===== COR Import Progress Monitor =====');
      console.log(`Time elapsed: ${formatTime(totalElapsed)}`);
      console.log(`Progress: ${drawProgressBar(currentCount, EXPECTED_TOTAL)}`);
      console.log(`\nMajor Groups: ${stats.majorGroups}`);
      console.log(`Submajor Groups: ${stats.submajorGroups}`);
      console.log(`Minor Groups: ${stats.minorGroups}`);
      console.log(`Subminor Groups: ${stats.subminorGroups}`);
      console.log(`Occupations: ${currentCount}`);
      console.log(`Active Occupations: ${stats.activeOccupations}`);
      
      console.log(`\nImport rate: ${rate.toFixed(2)} occupations/second`);
      console.log(`Overall rate: ${overallRate.toFixed(2)} occupations/second`);
      
      if (imported > 0) {
        console.log(`Last update: +${imported} occupations in ${elapsed.toFixed(1)}s`);
      }
      
      if (remaining > 0 && overallRate > 0) {
        console.log(`Estimated time remaining: ${formatTime(etaSeconds)}`);
      }
      
      // Update trackers
      lastCount = currentCount;
      lastUpdateTime = currentTime;
      
      // Exit if import is complete
      if (currentCount >= EXPECTED_TOTAL) {
        console.log('\nImport complete! All occupations have been imported.');
        break;
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    } catch (error) {
      console.error('Error monitoring progress:', error);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

// Run the monitor
monitorImportProgress().catch(console.error);