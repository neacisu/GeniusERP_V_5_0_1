/**
 * Test script for direct payment processing endpoint
 * This script tests the /api/ecommerce/payment endpoint
 */
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Configuration
const API_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/ecommerce/payment';

// Test JWT token (replace with a valid one)
let JWT_TOKEN = '';

// Read token from file or environment
try {
  JWT_TOKEN = fs.readFileSync('./app-token.txt', 'utf8').trim();
  console.log('Using JWT token from app-token.txt');
} catch (error) {
  console.error('Error reading token file:', error.message);
  console.log('Please generate a token using generate-token.js and place it in app-token.txt');
  process.exit(1);
}

/**
 * Test direct payment processing
 */
async function testDirectPayment() {
  try {
    // Create payment data
    const paymentData = {
      amount: 25.75, // Amount in dollars
      currency: 'usd',
      paymentMethod: 'credit_card',
      description: 'Test direct payment via API',
      requestId: uuidv4(), // Generate unique request ID for idempotency
      metadata: {
        test: true,
        source: 'payment-test-script',
        timestamp: new Date().toISOString()
      }
    };

    console.log('Testing direct payment endpoint with data:', JSON.stringify(paymentData, null, 2));
    
    // Make API request to payment endpoint
    const response = await fetch(`${API_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(paymentData)
    });

    // Parse response
    const responseData = await response.json();
    
    // Log results
    console.log('\nResponse Status:', response.status);
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    
    // Provide summary
    if (response.ok) {
      console.log('\n✅ Payment test succeeded');
      console.log(`Status: ${responseData.status}`);
      
      if (responseData.data && responseData.data.id) {
        console.log(`Payment ID: ${responseData.data.id}`);
      }
      
      if (responseData.data && responseData.data.receipt_url) {
        console.log(`Receipt URL: ${responseData.data.receipt_url}`);
      }
    } else {
      console.log('\n❌ Payment test failed');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${responseData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('\n❌ Test execution error:', error.message);
  }
}

// Run the test
testDirectPayment();