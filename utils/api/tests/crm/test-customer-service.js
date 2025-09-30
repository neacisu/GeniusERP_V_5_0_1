/**
 * CustomerService Test Script
 * 
 * This script tests the basic functionality of the CustomerService implementation
 * by creating a customer and retrieving customer data.
 */

import { CustomerService } from './server/modules/sales/customer.service.ts';
import { v4 as uuidv4 } from 'uuid';

async function testCustomerService() {
  console.log('🧪 Starting CustomerService test...');
  
  try {
    // Initialize the CustomerService
    const customerService = new CustomerService();
    console.log('✅ CustomerService initialized successfully');
    
    // Generate test data
    const companyId = uuidv4();
    const franchiseId = uuidv4();
    const name = 'Test Customer';
    const email = 'test@example.com';
    
    console.log(`🏢 Using company ID: ${companyId}`);
    console.log(`🏪 Using franchise ID: ${franchiseId}`);
    
    // Create a new customer
    console.log('➕ Creating a new customer...');
    const newCustomer = await customerService.createCustomer(
      companyId,
      franchiseId,
      name,
      email
    );
    
    console.log('✅ Customer created successfully:');
    console.log(JSON.stringify(newCustomer, null, 2));
    
    // Get the customer by ID
    console.log(`🔍 Retrieving customer by ID: ${newCustomer.id}...`);
    const retrievedCustomer = await customerService.getCustomerById(newCustomer.id, companyId);
    
    console.log('✅ Customer retrieved successfully:');
    console.log(JSON.stringify(retrievedCustomer, null, 2));
    
    // Get all customers for the company
    console.log(`📋 Retrieving all customers for company ID: ${companyId}...`);
    const customers = await customerService.getCustomersByCompany(companyId, 10, 0);
    
    console.log(`✅ Retrieved ${customers.data.length} customers successfully`);
    console.log(JSON.stringify(customers, null, 2));
    
    console.log('🎉 CustomerService test completed successfully');
  } catch (error) {
    console.error('❌ CustomerService test failed:', error);
  }
}

// Run the test
testCustomerService();