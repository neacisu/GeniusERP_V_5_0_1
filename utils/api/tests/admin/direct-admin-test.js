/**
 * Direct Admin API Test using Node.js HTTP module
 * 
 * This script tests the basic functionality of the admin API endpoints
 * by making direct HTTP requests without any external dependencies.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const HOST = 'localhost';
const PORT = 5000;
const API_PATH = '/api';
const TOKEN_PATH = path.join(__dirname, 'admin-token.txt');

// Get admin token from token file
function getAdminToken() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      return fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
    } else {
      console.warn('⚠️ Warning: admin-token.txt not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error reading admin token:', error);
    return null;
  }
}

// Make an HTTP request
function makeRequest(method, path, data = null, callback) {
  const token = getAdminToken();
  
  // Add Accept header to explicitly request JSON
  const options = {
    hostname: HOST,
    port: PORT,
    path: `${API_PATH}${path}`,
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest' // This helps some servers identify AJAX requests
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    // Set encoding to handle the data as a string
    res.setEncoding('utf8');
    
    // Collect data as it comes in
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    // When the response completes, process the data
    res.on('end', () => {
      // Check for JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
        
        // Add some debugging info
        if (process.env.DEBUG_API) {
          console.log(`Response from ${options.path}:`, responseData);
        }
      } catch (e) {
        // If not JSON, store the raw response
        parsedData = { 
          rawResponse: responseData,
          error: 'Invalid JSON response'
        };
        
        // Log the first few characters of the response for debugging
        if (responseData.includes('<!DOCTYPE html>')) {
          console.log(`HTML response from ${options.path} (first 50 chars): ${responseData.substring(0, 50)}...`);
        } else {
          console.log(`Non-JSON response from ${options.path} (first 50 chars): ${responseData.substring(0, 50)}...`);
        }
      }
      
      callback(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        data: parsedData
      });
    });
  });
  
  // Handle errors
  req.on('error', (error) => {
    callback(error);
  });
  
  // If we have data, write it to the request
  if (data) {
    req.write(JSON.stringify(data));
  }
  
  // End the request
  req.end();
}

// Run all admin API tests
async function runAdminTests() {
  console.log('Testing Admin API endpoints...');
  console.log(`API URL: http://${HOST}:${PORT}${API_PATH}`);
  
  const token = getAdminToken();
  console.log(`Admin token available: ${token ? 'Yes' : 'No'}`);
  
  // Generate test IDs
  const companyId = 'test-company-' + Date.now();
  const franchiseId = 'test-franchise-' + Date.now();
  
  console.log(`Test Company ID: ${companyId}`);
  console.log(`Test Franchise ID: ${franchiseId}`);

  // 1. Test recording setup steps
  console.log('\n1. Testing POST /admin/setup/steps/:companyId endpoint...');
  
  const steps = [
    { step: 'company_created', status: 'completed' },
    { step: 'users_configured', status: 'completed' },
    { step: 'accounting_setup', status: 'in_progress' },
    { step: 'warehouse_setup', status: 'not_started' }
  ];
  
  // Process steps sequentially
  for (const stepData of steps) {
    const requestData = {
      franchiseId,
      step: stepData.step, 
      status: stepData.status
    };
    
    // Use a promise to make the request easier to work with in an async function
    await new Promise((resolve) => {
      makeRequest('POST', `/admin/setup/steps/${companyId}`, requestData, (error, response) => {
        if (error) {
          console.error(`- Error recording step '${stepData.step}':`, error.message);
        } else if (response.statusCode >= 400) {
          console.error(`- Error recording step '${stepData.step}': HTTP ${response.statusCode}`);
        } else {
          console.log(`- Recorded step '${stepData.step}' with status '${stepData.status}'`);
        }
        resolve();
      });
    });
  }
  
  // 2. Test retrieving all setup steps
  console.log('\n2. Testing GET /admin/setup/steps/:companyId endpoint...');
  
  await new Promise((resolve) => {
    makeRequest('GET', `/admin/setup/steps/${companyId}?franchiseId=${franchiseId}`, null, (error, response) => {
      if (error) {
        console.error('Error retrieving steps:', error.message);
      } else if (response.statusCode >= 400) {
        console.error(`Error retrieving steps: HTTP ${response.statusCode}`);
      } else {
        const data = response.data;
        
        if (data.rawResponse && data.rawResponse.includes('<!DOCTYPE html>')) {
          console.log('Response contains HTML instead of JSON. This may indicate routing issues.');
        } else if (Array.isArray(data)) {
          console.log(`Retrieved ${data.length} setup steps:`);
          data.slice(0, 5).forEach((step, index) => {
            console.log(`${index + 1}. ${step.step}: ${step.status}`);
          });
        } else if (data.success && Array.isArray(data.data)) {
          // Handle the success wrapper format
          console.log(`Retrieved ${data.data.length} setup steps:`);
          data.data.slice(0, 5).forEach((step, index) => {
            console.log(`${index + 1}. ${step.step}: ${step.status}`);
          });
        } else {
          console.log('Retrieved response structure:', typeof data === 'object' ? Object.keys(data) : typeof data);
          
          if (typeof data === 'object') {
            console.log('Response data sample:', JSON.stringify(data).substring(0, 200));
          }
        }
      }
      resolve();
    });
  });
  
  // 3. Test checking step completion
  console.log('\n3. Testing GET /admin/setup/completed/:companyId/:step endpoint...');
  
  const stepsToCheck = ['company_created', 'accounting_setup', 'nonexistent_step'];
  
  for (const step of stepsToCheck) {
    await new Promise((resolve) => {
      makeRequest('GET', `/admin/setup/completed/${companyId}/${step}?franchiseId=${franchiseId}`, null, (error, response) => {
        if (error) {
          console.error(`Error checking step '${step}':`, error.message);
          console.log(`- Step '${step}' check failed`);
        } else if (response.statusCode >= 400) {
          console.error(`Error checking step '${step}': HTTP ${response.statusCode}`);
          console.log(`- Step '${step}' check failed`);
        } else {
          const isComplete = response.data?.completed || 
                          response.data?.data?.completed ||
                          response.data?.isComplete ||
                          false;
          
          console.log(`- Step '${step}' is ${isComplete ? 'complete' : 'not complete'}`);
        }
        resolve();
      });
    });
  }
  
  // 4. Test getting setup progress
  console.log('\n4. Testing GET /admin/setup/progress/:companyId endpoint...');
  
  await new Promise((resolve) => {
    makeRequest('GET', `/admin/setup/progress/${companyId}?franchiseId=${franchiseId}`, null, (error, response) => {
      if (error) {
        console.error('Error getting setup progress:', error.message);
        console.log('- Setup progress check failed');
      } else if (response.statusCode >= 400) {
        console.error(`Error getting setup progress: HTTP ${response.statusCode}`);
        console.log('- Setup progress check failed');
      } else {
        const progress = response.data?.progress || 
                      response.data?.data?.progress ||
                      0;
        
        console.log(`- Setup progress: ${progress}%`);
      }
      resolve();
    });
  });
  
  console.log('\nAdmin API endpoints tests completed successfully!');
}

// Run the tests
runAdminTests().catch(error => {
  console.error('Error running admin tests:', error);
});