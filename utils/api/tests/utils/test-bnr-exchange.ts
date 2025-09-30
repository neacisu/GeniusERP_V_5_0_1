/**
 * Test script for BNR Exchange Rate Service
 * 
 * This script tests the functionality of the BNR Exchange Rate service,
 * which fetches and stores official exchange rates from the National Bank of Romania.
 */

import axios from 'axios';

async function testBnrExchangeRates() {
  console.log('🧪 Testing BNR Exchange Rate Service');
  console.log('=============================================\n');

  try {
    // Test getting latest BNR rates
    console.log('1. Testing BNR reference rates endpoint...');
    const bnrResponse = await axios.get('http://localhost:5000/api/integrations/exchange-rates/bnr');
    
    if (bnrResponse.status === 200) {
      console.log('   ✅ Status:', bnrResponse.status);
      console.log('   ✅ Base currency:', bnrResponse.data.base);
      console.log('   ✅ Date:', bnrResponse.data.date);
      console.log('   ✅ Source:', bnrResponse.data.source);
      console.log('   ✅ Number of currencies:', Object.keys(bnrResponse.data.rates).length);
      
      // Display sample rates for common currencies
      console.log('   Sample rates:');
      ['EUR', 'USD', 'GBP', 'CHF'].forEach(currency => {
        if (bnrResponse.data.rates[currency]) {
          console.log(`   - ${currency}: ${bnrResponse.data.rates[currency]}`);
        }
      });
    } else {
      console.log('   ❌ Failed to get BNR rates. Status:', bnrResponse.status);
    }
    
    console.log('\n2. Testing manual update endpoint...');
    const updateResponse = await axios.post('http://localhost:5000/api/integrations/exchange-rates/bnr/update');
    
    if (updateResponse.status === 200) {
      console.log('   ✅ Status:', updateResponse.status);
      console.log('   ✅ Success:', updateResponse.data.success);
      console.log('   ✅ Message:', updateResponse.data.message);
      console.log('   ✅ Number of currencies:', updateResponse.data.currencyCount);
    } else {
      console.log('   ❌ Manual update failed. Status:', updateResponse.status);
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

testBnrExchangeRates();