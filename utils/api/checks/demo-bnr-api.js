/**
 * BNR API Demo Tool
 * 
 * Run this in the browser console (paste this entire file) to test the BNR API calls
 */

// Function to fetch exchange rates
async function testBnrApi() {
  console.log('🔍 Testing BNR API calls...');
  
  try {
    // Test GET /api/exchange-rates/bnr/all endpoint
    console.log('1. Testing GET /api/exchange-rates/bnr/all endpoint...');
    const allRatesResponse = await fetch('/api/exchange-rates/bnr/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!allRatesResponse.ok) {
      throw new Error(`API error: ${allRatesResponse.status} ${allRatesResponse.statusText}`);
    }
    
    const allRatesData = await allRatesResponse.json();
    console.log('✅ GET /api/exchange-rates/bnr/all success:', allRatesData);
    
    // Test POST /api/exchange-rates/bnr/update endpoint
    console.log('\n2. Testing POST /api/exchange-rates/bnr/update endpoint...');
    const updateResponse = await fetch('/api/exchange-rates/bnr/update', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!updateResponse.ok) {
      throw new Error(`API error: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ POST /api/exchange-rates/bnr/update success:', updateData);
    
    // Summary
    console.log('\n✅ All API tests passed successfully!');
    return {
      allRates: allRatesData,
      updateResult: updateData
    };
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
}

// Execute the test
console.log('💱 BNR API Demo Tool');
console.log('Run testBnrApi() to test the BNR exchange rate API');

// Auto-execute if in Node.js environment
if (typeof window === 'undefined') {
  testBnrApi()
    .then(results => console.log('Results:', results))
    .catch(error => console.error('Error:', error));
}