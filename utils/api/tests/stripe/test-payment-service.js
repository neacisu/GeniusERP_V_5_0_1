/**
 * Test script for checking the Payment Service integration
 */
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:5000';

async function getToken() {
  try {
    const token = fs.readFileSync('./app-token.txt', 'utf8').trim();
    return token;
  } catch (error) {
    console.error('Error reading token:', error);
    throw new Error('Unable to get authentication token. Make sure app-token.txt exists.');
  }
}

async function testPaymentService() {
  try {
    const token = await getToken();
    
    // Test payment data
    const paymentData = {
      amount: '29.99',
      currency: 'USD',
      paymentMethod: 'credit_card',
      metadata: {
        orderId: '12345',
        customerEmail: 'test@example.com'
      }
    };
    
    console.log('Testing payment service with data:', paymentData);
    
    const response = await fetch(`${BASE_URL}/api/ecommerce/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    console.log('Payment service response status:', response.status);
    console.log('Payment service response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Payment service test PASSED');
      return true;
    } else {
      console.log('❌ Payment service test FAILED');
      return false;
    }
  } catch (error) {
    console.error('Error testing payment service:', error);
    console.log('❌ Payment service test FAILED');
    return false;
  }
}

// Run the test
testPaymentService().then(success => {
  console.log(`Payment service test ${success ? 'completed successfully' : 'failed'}`);
});