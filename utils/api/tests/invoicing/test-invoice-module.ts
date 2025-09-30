/**
 * Invoice Module Integration Test
 * 
 * This script tests the integration between the Invoice module
 * and the ExchangeRateService for currency conversion.
 */

import { exchangeRateService } from './server/modules/integrations/services/exchange-rate.service';
import { InvoiceService } from './server/modules/invoicing/services/invoice.service';

/**
 * Test the granular invoice module integration
 */
async function testInvoiceModuleIntegration() {
  try {
    console.log('🧪 Testing invoice module integration...');
    
    // Check BNR exchange rates
    const rates = await exchangeRateService.getLatestRates('RON');
    console.log(`📊 Retrieved ${Object.keys(rates).length} exchange rates`);
    
    // Get EUR rate 
    const eurRate = rates['EUR'];
    console.log(`💶 EUR/RON rate: ${eurRate}`);
    
    // Test invoice currency conversion
    const amountEur = 1000;
    console.log(`💱 Converting EUR ${amountEur} to RON using InvoiceService...`);
    
    const amountRon = await InvoiceService.convertCurrency(
      amountEur,
      'EUR',
      'RON'
    );
    
    console.log(`✅ EUR ${amountEur} = RON ${amountRon.toFixed(2)}`);
    
    // Validate the conversion (RON amount should be approximately EUR / rate)
    // When converting TO a currency, we divide by the rate (rate is RON->EUR, so to get RON we divide by rate)
    const expectedRon = amountEur / eurRate;
    const difference = Math.abs(amountRon - expectedRon);
    const isValid = difference < 0.5; // Allow for some rounding differences
    
    console.log(`🔍 Validation: expected RON ${expectedRon.toFixed(2)}, got ${amountRon.toFixed(2)}`);
    console.log(`${isValid ? '✅' : '❌'} Validation ${isValid ? 'passed' : 'failed'}`);
    
    console.log('🧪 Invoice module integration test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInvoiceModuleIntegration();