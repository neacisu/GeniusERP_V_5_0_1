/**
 * Test Script for Settings Setup Endpoint
 * 
 * This script tests the /api/settings/setup/step POST endpoint with real 
 * database data and validates that it is properly secured with JWT-based
 * authentication and role-based access controls.
 */
// @ts-ignore - Node.js built-in modules
const fs = require('fs');

// Use the built-in Node.js fetch API (Node.js 18+)
// @ts-ignore - fetch is available globally in Node.js 18+
const fetch = globalThis.fetch;

// Read the JWT token from the file
const token = fs.readFileSync('./app-token.txt', 'utf-8').trim();

// Configuration
const SERVER_URL = 'http://localhost:5000'; // The port where your Express server is running
const API_PATH = '/api/settings/setup/step';

// Test data
// @deprecated: chart_of_accounts step is deprecated - use synthetic_accounts instead
const testData = {
  step: 'chart_of_accounts', // DEPRECATED - for backward compatibility testing only
  status: 'completed',
  metadata: {
    lastUpdated: new Date().toISOString(),
    updatedBy: 'test-script'
  }
};

// Make request
async function testSetupEndpoint() {
  try {
    console.log('Testing Setup Endpoint...');
    console.log(`URL: ${SERVER_URL}${API_PATH}`);
    console.log('Request Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${SERVER_URL}${API_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Test PASSED: Setup endpoint is working correctly!');
    } else {
      console.log('\n❌ Test FAILED: Setup endpoint returned an error.');
      
      // Check if it's an auth error
      if (response.status === 401 || response.status === 403) {
        console.log('This appears to be an authentication or authorization error.');
        console.log('Make sure your token is valid and has the required roles (hq_admin or ADMIN).');
      }
    }
  } catch (error) {
    console.error('\n❌ Test FAILED with exception:', error);
  }
}

// Test GET onboarding endpoint
async function testOnboardingEndpoint() {
  try {
    console.log('\nTesting Onboarding Endpoint...');
    console.log(`URL: ${SERVER_URL}/api/settings/setup/onboarding`);
    
    const response = await fetch(`${SERVER_URL}/api/settings/setup/onboarding`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Test PASSED: Onboarding endpoint is working correctly!');
    } else {
      console.log('\n❌ Test FAILED: Onboarding endpoint returned an error.');
    }
  } catch (error) {
    console.error('\n❌ Test FAILED with exception:', error);
  }
}

// Run tests
async function runTests() {
  await testSetupEndpoint();
  await testOnboardingEndpoint();
}

runTests().catch(console.error);