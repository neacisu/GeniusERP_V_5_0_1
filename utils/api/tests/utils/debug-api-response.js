/**
 * Debug API Response Formats
 * 
 * This script tests API endpoints to ensure they return proper JSON responses
 */

import fetch from 'node-fetch';

async function testEndpoint(url, method = 'GET', headers = {}) {
  try {
    console.log(`Testing ${method} ${url}...`);
    
    const fetchOptions = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const response = await fetch(`http://localhost:5000${url}`, fetchOptions);
    const contentType = response.headers.get('content-type');
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${contentType}`);
    
    // Try to parse the response as text first
    const text = await response.text();
    console.log(`Response length: ${text.length} characters`);
    
    if (text.trim().startsWith('<!DOCTYPE html>')) {
      console.log('❌ Response is HTML, not JSON');
      console.log('Preview:', text.substring(0, 100) + '...');
      return { success: false, isHtml: true, response: text };
    }
    
    try {
      // Try to parse as JSON
      const json = JSON.parse(text);
      console.log('✅ Parsed as JSON successfully');
      console.log('JSON preview:', JSON.stringify(json).substring(0, 200) + '...');
      return { success: true, json };
    } catch (jsonError) {
      console.log('❌ Failed to parse as JSON:', jsonError.message);
      console.log('Text preview:', text.substring(0, 100) + '...');
      return { success: false, error: jsonError, response: text };
    }
  } catch (error) {
    console.error(`❌ Error testing endpoint:`, error);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('🔍 Testing API endpoints...\n');
  
  // Test GET /api/exchange-rates/bnr/all endpoint
  console.log('\n1. Testing GET /api/exchange-rates/bnr/all');
  await testEndpoint('/api/exchange-rates/bnr/all');
  
  // Test POST /api/exchange-rates/bnr/update endpoint
  console.log('\n2. Testing POST /api/exchange-rates/bnr/update');
  await testEndpoint('/api/exchange-rates/bnr/update', 'POST');
  
  console.log('\n✅ All tests completed');
}

// Run the tests
runTests();