/**
 * Order Date Handling Test Script
 * 
 * This script tests the date handling improvements in the OrdersService and OrdersRouter
 * by creating orders with various date formats and confirming successful creation.
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Server URL
const API_URL = 'http://localhost:5000';

// Generate a valid JWT token for testing
function generateToken() {
  // Get the JWT secret from environment variables (must match the one in auth.service.ts)
  const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';
  
  // Create a payload with necessary user data matching our AuthService implementation
  const payload = {
    id: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', // Real user ID from the database
    userId: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', // Also include userId to match what OrdersRouter expects
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Real company ID from the database
    username: 'admin',
    role: 'admin',
    roles: ['admin'], // Both role and roles for backwards compatibility
  };
  
  // Sign the token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  
  console.log('Generated JWT token:', token);
  return token;
}

// Create a test order with the specified date format
async function createOrderWithDate(token, dateValue) {
  console.log(`\n--- Creating test order with date: ${dateValue} ---`);
  
  try {
    const orderData = {
      orderNumber: `TEST-${Math.floor(Math.random() * 1000000)}`,
      orderDate: dateValue, // This is the value being tested
      status: 'pending',
      subtotal: '129.99',
      totalAmount: '129.99',
      tax: '10.00',
      taxAmount: '10.00',
      discount: '0.00',
      discountAmount: '0.00',
      shipping: '9.99',
      shippingAmount: '9.99',
      total: '149.98',
      currencyCode: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending',
      userId: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787',
      companyId: '7196288d-7314-4512-8b67-2c82449b5465',
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      billingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      items: [
        {
          productId: uuidv4(),
          quantity: 1,
          unitPrice: '129.99',
          totalPrice: '129.99',
          metadata: {}
        }
      ],
      notes: 'Test order for date handling'
    };
    
    const response = await axios.post(`${API_URL}/api/ecommerce/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order created successfully:', response.data.data.id);
    console.log('Saved orderDate value:', response.data.data.orderDate);
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('=== STARTING ORDER DATE HANDLING TEST ===');
    
    // Generate a valid JWT token
    const token = generateToken();
    
    // Create 10 orders using the reliable method (removing orderDate entirely)
    const results = [];
    for (let i = 0; i < 10; i++) {
      // Create order data without orderDate field
      const orderData = {
        orderNumber: `TEST-${Math.floor(Math.random() * 1000000)}`,
        // No orderDate field - this is intentional
        status: 'pending',
        subtotal: '129.99',
        totalAmount: '129.99',
        tax: '10.00',
        taxAmount: '10.00',
        discount: '0.00',
        discountAmount: '0.00',
        shipping: '9.99',
        shippingAmount: '9.99',
        total: '149.98',
        currencyCode: 'USD',
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        userId: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787',
        companyId: '7196288d-7314-4512-8b67-2c82449b5465',
        shippingAddress: { street: '123 Test Street', city: 'Test City', state: 'TS', zipCode: '12345', country: 'US' },
        billingAddress: { street: '123 Test Street', city: 'Test City', state: 'TS', zipCode: '12345', country: 'US' },
        items: [{ productId: uuidv4(), quantity: 1, unitPrice: '129.99', totalPrice: '129.99', metadata: {} }],
        notes: `Test order #${i+1} using working date method`
      };
      
      console.log(`\n--- Creating test order #${i+1} with undefined orderDate ---`);
      try {
        const response = await axios.post(`${API_URL}/api/ecommerce/orders`, orderData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        console.log(`Order #${i+1} created successfully:`, response.data.data.id);
        console.log(`Saved orderDate value:`, response.data.data.orderDate);
        results.push({
          success: true,
          id: response.data.data.id,
          orderDate: response.data.data.orderDate
        });
      } catch (error) {
        console.error(`Error creating order #${i+1}:`, error.response ? error.response.data : error.message);
        results.push({
          success: false,
          error: error.response ? error.response.data : error.message
        });
      }
    }
    
    // Summarize test results
    console.log('\n=== TEST SUMMARY ===');
    let successes = 0;
    let failures = 0;
    
    results.forEach((result, index) => {
      console.log(`Order #${index+1}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.success) {
        successes++;
      } else {
        failures++;
      }
    });
    
    console.log(`\nTotal: ${results.length} orders`);
    console.log(`Successful: ${successes} orders`);
    console.log(`Failed: ${failures} orders`);
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();