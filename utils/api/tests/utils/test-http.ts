/**
 * Test script for HTTP Client and Exchange Rate Service
 * This demonstrates using the HTTP client for external API integrations
 */

import axios from 'axios';
import { log } from './server/vite';

async function testHttpClient() {
  console.log('📡 Testing HTTP Client with External APIs');
  console.log('========================================');
  
  try {
    // Create an HTTP client
    // Note: We're switching to a more reliable public API
    const client = axios.create({
      baseURL: 'https://open.er-api.com/v6',
      timeout: 10000
    });
    
    // Add request interceptor for logging
    client.interceptors.request.use(
      (config) => {
        console.log(`🌐 Making request to: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error.message);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging
    client.interceptors.response.use(
      (response) => {
        console.log(`✅ Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('❌ Response error:', error.message);
        return Promise.reject(error);
      }
    );
    
    console.log('\n1. Testing GET request to exchange rate API...');
    const response = await client.get('/latest/RON');
    
    // Debug the response structure
    console.log('Response structure:', Object.keys(response.data));
    
    if (response.data && response.data.result === 'success') {
      console.log(`✅ API Call Result: ${response.data.result}`);
      console.log(`✅ Base Currency: ${response.data.base_code}`);
      console.log(`✅ Last Update: ${response.data.time_last_update_utc}`);
      
      if (response.data.rates) {
        console.log(`✅ Received rates for ${Object.keys(response.data.rates).length} currencies`);
        
        // Display a few important currencies
        console.log('\n2. Sample exchange rates:');
        const currencies = ['EUR', 'USD', 'GBP'];
        currencies.forEach(currency => {
          if (response.data.rates[currency]) {
            console.log(`   ${currency}: ${response.data.rates[currency].toFixed(4)}`);
          }
        });
      } else {
        console.log('❌ No rates found in the response');
      }
    } else {
      console.log('❌ API call was not successful or returned unexpected format');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }
    
    console.log('\n✅ HTTP Client test completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Error during testing:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error);
    }
  }
}

// Run the test
testHttpClient().catch(console.error);