/**
 * Test script for HTTP Client and Exchange Rate Service
 * 
 * This script demonstrates the use of the HTTP client for external integrations
 * by fetching current exchange rates from a public API.
 */

// Create a temporary test file for demonstrating the HTTP client functionality
// We'll need to modify the import paths to make this work with TypeScript and ES modules

import { createHttpClient } from './server/shared/libs/http-client.js';

async function testHttpClient() {
  console.log('📡 Testing HTTP Client with Exchange Rate API');
  console.log('============================================');
  
  try {
    // Create an HTTP client instance
    const httpClient = createHttpClient({
      baseURL: 'https://api.exchangerate.host',
      timeout: 5000
    });
    
    console.log('\n1. Testing GET request to external API...');
    const response = await httpClient.get('/latest', {
      params: { base: 'RON' }
    });
    
    console.log(`✅ API Response Status: Success`);
    console.log(`✅ Base Currency: ${response.base}`);
    console.log(`✅ Date: ${response.date}`);
    console.log(`✅ Received rates for ${Object.keys(response.rates).length} currencies`);
    
    // Display a few important currencies
    console.log('\n2. Sample exchange rates:');
    const currencies = ['EUR', 'USD', 'GBP'];
    currencies.forEach(currency => {
      if (response.rates[currency]) {
        console.log(`   ${currency}: ${response.rates[currency].toFixed(4)}`);
      }
    });
    
    // Test historical rates
    console.log('\n3. Testing historical exchange rates...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const dateString = oneMonthAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const historicalResponse = await httpClient.get(`/${dateString}`, {
      params: { base: 'RON', symbols: 'EUR,USD,GBP' }
    });
    
    console.log(`✅ Historical Date: ${historicalResponse.date}`);
    console.log('   Historical rates:');
    Object.entries(historicalResponse.rates).forEach(([currency, rate]) => {
      console.log(`   ${currency}: ${rate.toFixed(4)}`);
    });
    
    // Test error handling with invalid endpoint
    console.log('\n4. Testing error handling with invalid endpoint...');
    try {
      await httpClient.get('/invalid-endpoint');
    } catch (error) {
      console.log(`✅ Error handling works: ${error.message}`);
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during testing:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testHttpClient().catch(console.error);