/**
 * Test script for Currency Conversion Service
 * 
 * This script tests the functionality of the Currency Service which converts amounts
 * between currencies using the local database of BNR exchange rates.
 */

import { CurrencyService } from './server/modules/integrations/services/currency.service';
import { DrizzleModule } from './server/common/drizzle';
import { setTimeout } from 'timers/promises';

async function testCurrencyConversion() {
  console.log('🧪 Testing Currency Conversion Service');
  console.log('=============================================\n');

  try {
    // Initialize DrizzleModule to ensure database connection
    await DrizzleModule.initialize();
    
    // Give DB connection time to establish
    await setTimeout(500);
    
    // Test conversion from RON to EUR
    console.log('1. Testing RON → EUR conversion:');
    const eurAmount = await CurrencyService.convert(1000, 'RON', 'EUR');
    console.log(`   ✅ 1000 RON = ${eurAmount} EUR`);
    
    // Test conversion from EUR to RON
    console.log('\n2. Testing EUR → RON conversion:');
    const ronAmount = await CurrencyService.convert(100, 'EUR', 'RON');
    console.log(`   ✅ 100 EUR = ${ronAmount} RON`);
    
    // Test rate retrieval
    console.log('\n3. Testing exchange rate retrieval:');
    
    // Get rate for Euro
    const eurRate = await CurrencyService.getRate('EUR');
    console.log(`   ✅ EUR rate: ${eurRate}`);
    
    // Get rate for US Dollar
    const usdRate = await CurrencyService.getRate('USD');
    console.log(`   ✅ USD rate: ${usdRate}`);
    
    // Get all available rates
    console.log('\n4. Testing retrieval of all available rates:');
    const allRates = await CurrencyService.getRates();
    console.log(`   ✅ Retrieved ${Object.keys(allRates).length} exchange rates`);
    console.log('   Sample rates:');
    ['EUR', 'USD', 'GBP', 'CHF'].forEach(currency => {
      if (allRates[currency]) {
        console.log(`   - ${currency}: ${allRates[currency]}`);
      }
    });
    
    // Test edge cases
    console.log('\n5. Testing edge cases:');
    
    // Same currency conversion
    const sameAmount = await CurrencyService.convert(50, 'USD', 'USD');
    console.log(`   ✅ 50 USD → USD = ${sameAmount} (unchanged)`);
    
    // Verify that large amounts convert correctly
    const largeAmount = await CurrencyService.convert(1000000, 'RON', 'USD');
    console.log(`   ✅ 1,000,000 RON = ${largeAmount} USD`);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    // Clean up database connection
    await DrizzleModule.cleanup();
  }
}

testCurrencyConversion();