/**
 * Direct HTTP Test for Admin API
 * 
 * This script tests the Admin API endpoints by making direct HTTP requests
 * to the backend server, bypassing any fetch wrappers or middleware.
 * 
 * It uses Node.js standard http module to make requests.
 * 
 * Note: This approach may not work if the Vite middleware is intercepting
 * API responses and returning HTML instead of JSON.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  host: process.env.API_HOST || 'localhost',
  port: process.env.API_PORT || 5000,
  useHttps: process.env.API_USE_HTTPS === 'true',
  tokenFile: process.env.API_TOKEN_FILE || './admin-token.txt',
  timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
};

// Base URL for API requests
const baseUrl = `http${config.useHttps ? 's' : ''}://${config.host}:${config.port}`;

// Test data
const testData = {
  companyId: `test-company-${Date.now()}`,
  franchiseId: `test-franchise-${Date.now()}`,
};

/**
 * Make an HTTP request with the given options
 * @param {Object} options - Request options
 * @param {Object|null} data - Request body data
 * @returns {Promise<Object>} - Response data
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const httpModule = config.useHttps ? https : http;
    
    const req = httpModule.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        
        let parsedBody;
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          parsedBody = { rawBody: body };
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.abort();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Load an API token from a file
 * @returns {Promise<string>} The token
 */
async function loadToken() {
  try {
    return fs.readFileSync(config.tokenFile, 'utf8').trim();
  } catch (error) {
    console.error(`Error loading token from ${config.tokenFile}: ${error.message}`);
    return null;
  }
}

/**
 * Test recording a setup step
 * @param {string} token - API token
 * @returns {Promise<Object>} Response
 */
async function testRecordSetupStep(token) {
  console.log(`\nTesting POST /api/admin/setup/steps/${testData.companyId}`);
  
  const data = {
    step: 'company_created',
    status: 'completed',
    franchiseId: testData.franchiseId,
  };
  
  const options = {
    host: config.host,
    port: config.port,
    path: `/api/admin/setup/steps/${testData.companyId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  };
  
  try {
    console.log('Request:', JSON.stringify(data, null, 2));
    const response = await makeRequest(options, data);
    console.log('Response Status:', response.statusCode);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Test getting all setup steps for a company
 * @param {string} token - API token
 * @returns {Promise<Object>} Response
 */
async function testGetCompanySetupSteps(token) {
  console.log(`\nTesting GET /api/admin/setup/steps/${testData.companyId}`);
  
  const queryParams = new URLSearchParams({
    franchiseId: testData.franchiseId,
  }).toString();
  
  const options = {
    host: config.host,
    port: config.port,
    path: `/api/admin/setup/steps/${testData.companyId}?${queryParams}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('Response Status:', response.statusCode);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Test checking if a step is completed
 * @param {string} token - API token
 * @param {string} step - Step name
 * @returns {Promise<Object>} Response
 */
async function testIsStepComplete(token, step) {
  console.log(`\nTesting GET /api/admin/setup/steps/${testData.companyId}/${step}/completed`);
  
  const queryParams = new URLSearchParams({
    franchiseId: testData.franchiseId,
  }).toString();
  
  const options = {
    host: config.host,
    port: config.port,
    path: `/api/admin/setup/steps/${testData.companyId}/${step}/completed?${queryParams}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('Response Status:', response.statusCode);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Test getting setup progress
 * @param {string} token - API token
 * @returns {Promise<Object>} Response
 */
async function testGetSetupProgress(token) {
  console.log(`\nTesting GET /api/admin/setup/progress/${testData.companyId}`);
  
  const queryParams = new URLSearchParams({
    franchiseId: testData.franchiseId,
  }).toString();
  
  const options = {
    host: config.host,
    port: config.port,
    path: `/api/admin/setup/progress/${testData.companyId}?${queryParams}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };
  
  try {
    const response = await makeRequest(options);
    console.log('Response Status:', response.statusCode);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

/**
 * Run all admin API tests
 */
async function runAllTests() {
  console.log('=== Running Direct HTTP Admin API Tests ===');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Test Company ID: ${testData.companyId}`);
  console.log(`Test Franchise ID: ${testData.franchiseId}`);
  
  // Load token
  const token = await loadToken();
  if (!token) {
    console.error('No token available. Please create a file named admin-token.txt with a valid JWT token.');
    return;
  }
  
  console.log(`Token loaded from ${config.tokenFile} (first 10 chars): ${token.substring(0, 10)}...`);
  
  // Run tests
  await testRecordSetupStep(token);
  await testGetCompanySetupSteps(token);
  await testIsStepComplete(token, 'company_created');
  await testGetSetupProgress(token);
  
  console.log('\n=== Direct HTTP Admin API Tests Completed ===');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running HTTP tests:', error);
});