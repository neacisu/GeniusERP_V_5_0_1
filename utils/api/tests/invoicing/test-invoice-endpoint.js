/**
 * Test script for Invoice Endpoint with Auth
 * 
 * This script tests the /v1/invoices/create endpoint with JWT authentication
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Base URL for the API
const API_URL = 'http://localhost:5000';

// Test JWT token - this should be a valid token from your auth system
const JWT_TOKEN = process.env.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUzZDhlNDgxLWJmYjQtNGYzYi1iYzk5LTcxNDNmYTY3MzE3MiIsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJjb21wYW55SWQiOiI3MTk2Mjg4ZC03MzE0LTQ1MTItOGI2Ny0yYzgyNDQ5YjU0NjUiLCJpYXQiOjE3NDM1NzIyMTQsImV4cCI6MTc3NTEyOTgxNH0._BZpLwIwOydOz3TB1V9k6U0MG9foxnXYWi_2IB_u704';

/**
 * Main test function
 */
async function testInvoiceEndpoint() {
  console.log('🧪 Testing /v1/invoices/create endpoint with auth...');
  
  try {
    // Test data for invoice creation with currency conversion
    const invoiceData = {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465',
      franchiseId: null,
      currency: 'EUR',
      convertTo: 'RON',
      amount: 1500, // 1,500 EUR
      series: 'TEST-API'
    };
    
    console.log(`📤 Sending request with data: ${JSON.stringify(invoiceData, null, 2)}`);
    
    // Send authenticated request to create invoice
    const response = await axios({
      method: 'post',
      url: `${API_URL}/v1/invoices/create`,
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: invoiceData
    });
    
    // Log the response
    console.log('✅ Invoice created successfully!');
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📄 Response data: ${JSON.stringify(response.data, null, 2)}`);
    
    // Test without auth to verify 401
    console.log('\n🧪 Testing endpoint without auth (should fail with 401)...');
    
    try {
      const responseNoAuth = await axios({
        method: 'post',
        url: `${API_URL}/v1/invoices/create`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: invoiceData
      });
      
      console.log('❌ Test failed! Unauthenticated request succeeded when it should have failed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication test passed! Received 401 Unauthorized as expected');
      } else {
        console.error('❌ Test failed with unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error(`📊 Response status: ${error.response.status}`);
      console.error(`📄 Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the test
testInvoiceEndpoint();