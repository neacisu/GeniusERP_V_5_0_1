/**
 * Test for CreateInvoiceService with Currency Conversion
 * 
 * This script tests the CreateInvoiceService which supports currency conversion
 * via BNR exchange rates when creating invoices.
 */

import { CreateInvoiceService } from './server/modules/invoicing/services/create-invoice.service';
import { v4 as uuidv4 } from 'uuid';

async function testCreateInvoiceWithCurrencyConversion() {
  try {
    console.log('🧪 Testing CreateInvoiceService with currency conversion...');
    
    // Create test data with valid company ID
    const testData = {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Valid company ID from the database
      currency: 'EUR',
      convertTo: 'RON',
      totalAmount: 1000,
      series: 'TEST',
    };
    
    console.log(`📝 Creating invoice with: ${JSON.stringify(testData, null, 2)}`);
    
    // Call the service to create an invoice with currency conversion
    const invoice = await CreateInvoiceService.execute(testData);
    
    console.log('✅ Invoice created successfully:');
    console.log(JSON.stringify(invoice, null, 2));
    
    // Test creating an invoice without currency conversion
    const testData2 = {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Same valid company ID
      currency: 'RON',
      totalAmount: 5000,
      series: 'TEST',
    };
    
    console.log(`📝 Creating invoice without conversion: ${JSON.stringify(testData2, null, 2)}`);
    
    const invoice2 = await CreateInvoiceService.execute(testData2);
    
    console.log('✅ Invoice without conversion created successfully:');
    console.log(JSON.stringify(invoice2, null, 2));
    
    console.log('🧪 CreateInvoiceService test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testCreateInvoiceWithCurrencyConversion();