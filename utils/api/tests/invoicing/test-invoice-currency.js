/**
 * Invoice Currency Conversion Test
 * 
 * This script demonstrates how the invoice service uses the exchange rate service
 * for currency conversion in the granular module structure.
 */

import { exchangeRateService } from './server/modules/integrations/services/exchange-rate.service.js';
import { InvoiceService } from './server/modules/invoicing/services/invoice.service.js';

/**
 * Test the invoice service's currency conversion capabilities
 */
async function testInvoiceCurrencyConversion() {
  try {
    console.log('🧪 Testing invoice service currency conversion...');
    
    // Test direct currency conversion
    const amount = 1000;
    const fromCurrency = 'EUR';
    const toCurrency = 'RON';
    
    console.log(`💱 Converting ${amount} ${fromCurrency} to ${toCurrency}...`);
    
    // Use the InvoiceService's currency conversion method
    const convertedAmount = await InvoiceService.convertCurrency(
      amount, 
      fromCurrency, 
      toCurrency
    );
    
    console.log(`✅ Result: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
    
    // Test reverse conversion
    const ronAmount = 5000;
    console.log(`💱 Converting ${ronAmount} RON to EUR...`);
    
    const eurAmount = await InvoiceService.convertCurrency(
      ronAmount,
      'RON',
      'EUR'
    );
    
    console.log(`✅ Result: ${ronAmount} RON = ${eurAmount.toFixed(2)} EUR`);
    
    // Get today's BNR reference rate
    console.log('📊 Getting BNR reference rates for today...');
    const bnrRates = await exchangeRateService.getBNRReferenceRate();
    
    console.log('📈 BNR Reference Rates:');
    Object.entries(bnrRates).forEach(([currency, rate]) => {
      console.log(`   ${currency}: ${rate}`);
    });
    
    console.log('🧪 Invoice currency conversion test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInvoiceCurrencyConversion();