/**
 * Test script for External Integrations API endpoints
 * 
 * This script tests the HTTP endpoints exposed by our integrations module,
 * specifically the exchange rate API which is used for currency conversion
 * in invoices and financial reports.
 */

import axios from 'axios';

async function testIntegrationsApi() {
  console.log('🧪 Testing External Integrations API');
  console.log('=============================================\n');

  try {
    // Test BNR exchange rates endpoint
    console.log('1. Testing BNR exchange rates endpoint...');
    const bnrResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr');
    
    if (bnrResponse.status === 200) {
      console.log('   ✅ Status:', bnrResponse.status);
      console.log('   ✅ Base currency:', bnrResponse.data.base);
      console.log('   ✅ Date:', bnrResponse.data.date);
      console.log('   ✅ Source:', bnrResponse.data.source);
      console.log('   ✅ Number of currencies:', Object.keys(bnrResponse.data.rates).length);
      
      // Display sample rates
      console.log('   Sample rates:');
      ['EUR', 'USD', 'GBP'].forEach(currency => {
        if (bnrResponse.data.rates[currency]) {
          console.log(`   - ${currency}: ${bnrResponse.data.rates[currency]}`);
        }
      });
    } else {
      console.log('   ❌ Failed to get BNR rates. Status:', bnrResponse.status);
    }
    
    // Test BNR all rates endpoint
    console.log('\n2. Testing BNR all rates endpoint...');
    const allRatesResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr/all');
    
    if (allRatesResponse.status === 200) {
      console.log('   ✅ Status:', allRatesResponse.status);
      console.log('   ✅ Base currency:', allRatesResponse.data.base);
      console.log('   ✅ Date:', allRatesResponse.data.date);
      console.log('   ✅ Total currencies:', allRatesResponse.data.count);
      
      // Display sample rates
      console.log('   Sample rates:');
      ['EUR', 'USD', 'GBP'].forEach(currency => {
        if (allRatesResponse.data.rates[currency]) {
          console.log(`   - ${currency}: ${allRatesResponse.data.rates[currency]}`);
        }
      });
    } else {
      console.log('   ❌ Failed to get all BNR rates. Status:', allRatesResponse.status);
    }
    
    // Test BNR conversion endpoint
    console.log('\n3. Testing BNR conversion endpoint...');
    const conversionResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr/convert', {
      params: {
        amount: 1000,
        from: 'RON',
        to: 'EUR'
      }
    });
    
    if (conversionResponse.status === 200) {
      console.log('   ✅ Status:', conversionResponse.status);
      console.log('   ✅ Original amount:', conversionResponse.data.amount, conversionResponse.data.from);
      console.log('   ✅ Converted amount:', conversionResponse.data.result, conversionResponse.data.to);
      console.log('   ✅ Date:', conversionResponse.data.date);
      console.log('   ✅ Source:', conversionResponse.data.source);
      console.log('   ✅ Rate used:', conversionResponse.data.toRate);
    } else {
      console.log('   ❌ Failed to convert currency. Status:', conversionResponse.status);
    }
    
    // Test reverse conversion
    console.log('\n4. Testing reverse conversion (EUR → RON)...');
    const reverseResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr/convert', {
      params: {
        amount: 100,
        from: 'EUR',
        to: 'RON'
      }
    });
    
    if (reverseResponse.status === 200) {
      console.log('   ✅ Status:', reverseResponse.status);
      console.log('   ✅ Original amount:', reverseResponse.data.amount, reverseResponse.data.from);
      console.log('   ✅ Converted amount:', reverseResponse.data.result, reverseResponse.data.to);
      console.log('   ✅ Rate used:', reverseResponse.data.fromRate);
    } else {
      console.log('   ❌ Failed to convert currency. Status:', reverseResponse.status);
    }
    
    // Test cross-currency conversion (e.g., USD → EUR)
    console.log('\n5. Testing cross-currency conversion (USD → EUR)...');
    const crossResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr/convert', {
      params: {
        amount: 500,
        from: 'USD',
        to: 'EUR'
      }
    });
    
    if (crossResponse.status === 200) {
      console.log('   ✅ Status:', crossResponse.status);
      console.log('   ✅ Original amount:', crossResponse.data.amount, crossResponse.data.from);
      console.log('   ✅ Converted amount:', crossResponse.data.result, crossResponse.data.to);
      console.log('   ✅ USD Rate:', crossResponse.data.fromRate);
      console.log('   ✅ EUR Rate:', crossResponse.data.toRate);
    } else {
      console.log('   ❌ Failed to convert currency. Status:', crossResponse.status);
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testIntegrationsApi();