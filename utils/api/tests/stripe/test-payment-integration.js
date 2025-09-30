/**
 * Payment Integration Test Script
 * 
 * This script tests the payment integration by making a direct payment request
 * to the payment endpoint.
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const API_BASE_URL = 'http://localhost:5000/api';
const COMPANY_ID = 'c1b0e9f0-7c1a-4b1a-9e1a-3c1b0e9f0b1a'; // Replace with a valid company ID
const USER_ID = 'u1b0e9f0-7c1a-4b1a-9e1a-3c1b0e9f0b1a'; // Replace with a valid user ID

/**
 * Get a valid JWT token for testing
 */
async function getToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test_user',
        password: 'test_password',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error getting token:', error);
    // Fallback to a direct token for testing when auth is not fully set up
    return process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxYjBlOWYwLTdjMWEtNGIxYS05ZTFhLTNjMWIwZTlmMGIxYSIsInVzZXJuYW1lIjoidGVzdF91c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiY29tcGFueUlkIjoiYzFiMGU5ZjAtN2MxYS00YjFhLTllMWEtM2MxYjBlOWYwYjFhIiwiaWF0IjoxNjE2MTIzNDU2fQ.signature';
  }
}

/**
 * Test direct payment processing using the PaymentService
 */
async function testDirectPayment() {
  try {
    const token = await getToken();
    
    // Create a unique idempotency key
    const idempotencyKey = uuidv4();
    
    // Prepare payment data
    const paymentData = {
      companyId: COMPANY_ID,
      userId: USER_ID,
      paymentMethod: 'credit_card',
      amount: 2500, // $25.00
      currency: 'usd',
      options: {
        idempotencyKey,
        capture: true,
        description: 'Test payment from integration script',
        metadata: {
          test: true,
          source: 'integration_test'
        }
      }
    };
    
    console.log('Sending payment request with data:', JSON.stringify(paymentData, null, 2));

    // Make the payment request
    const response = await fetch(`${API_BASE_URL}/ecommerce/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    // Parse the response
    const responseData = await response.json();
    
    console.log(`Payment API Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error('Payment failed!');
      console.error('Response details:', responseData);
      return false;
    }
    
    // Check if payment was successful or at least pending
    if (responseData.status === 'success' || responseData.status === 'pending') {
      console.log('Payment was processed successfully!');
      console.log('Payment ID:', responseData.data?.id);
      console.log('Status:', responseData.status);
      return true;
    } else {
      console.error('Payment was not successful');
      console.error('Error:', responseData.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('Error testing payment integration:', error);
    return false;
  }
}

// Run the test
testDirectPayment()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });