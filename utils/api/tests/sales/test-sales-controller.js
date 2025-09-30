/**
 * Test script for Sales module API endpoints
 * 
 * This script tests the basic functionality of the Sales module endpoints
 * for customer operations.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Generate a test token with sales_team role
function generateTestToken() {
  const payload = {
    userId: '123456',
    companyId: 'test-company-123',
    username: 'sales-tester',
    roles: ['sales_team', 'SALES_TEAM']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${generateTestToken()}`
  }
});

// Test customer creation
async function testCreateCustomer() {
  try {
    console.log('Testing customer creation...');
    
    const customerData = {
      name: 'Test Customer',
      email: 'test@example.com',
      franchiseId: 'test-franchise-123'
    };
    
    const response = await api.post('/customer', customerData);
    
    console.log('Customer creation response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Customer creation successful!');
      return response.data.data; // Return the created customer for further tests
    } else {
      console.log('❌ Customer creation failed!');
      return null;
    }
  } catch (error) {
    console.error('Error creating customer:', error.response?.data || error.message);
    return null;
  }
}

// Test customers list
async function testListCustomers() {
  try {
    console.log('\nTesting customer listing...');
    
    const response = await api.get('/customers');
    
    console.log(`Received ${response.data.data?.length || 0} customers`);
    
    if (response.data.success) {
      console.log('✅ Customer listing successful!');
    } else {
      console.log('❌ Customer listing failed!');
    }
  } catch (error) {
    console.error('Error listing customers:', error.response?.data || error.message);
  }
}

// Test customer retrieval by ID
async function testGetCustomerById(customerId) {
  try {
    console.log(`\nTesting customer retrieval for ID: ${customerId}...`);
    
    const response = await api.get(`/customer/${customerId}`);
    
    if (response.data.success) {
      console.log('✅ Customer retrieval successful!');
      console.log('Retrieved customer:', response.data.data);
    } else {
      console.log('❌ Customer retrieval failed!');
    }
  } catch (error) {
    console.error('Error retrieving customer:', error.response?.data || error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting Sales Controller API tests...');
  
  // Create a test customer and get its ID
  const newCustomer = await testCreateCustomer();
  
  // List all customers
  await testListCustomers();
  
  // If customer creation succeeded, test retrieval
  if (newCustomer) {
    await testGetCustomerById(newCustomer.id);
  }
  
  console.log('\nSales Controller API tests completed.');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
});