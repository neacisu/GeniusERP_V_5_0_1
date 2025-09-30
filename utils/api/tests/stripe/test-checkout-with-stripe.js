/**
 * Test Checkout Flow with Stripe
 * 
 * This script tests the complete checkout flow with Stripe payment integration.
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
 * Create a cart
 */
async function createCart(token) {
  console.log('Creating a cart...');
  
  try {
    const cartData = {
      companyId: COMPANY_ID,
      userId: USER_ID
    };
    
    const response = await fetch(`${API_BASE_URL}/ecommerce/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cartData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create cart: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Cart created with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('Error creating cart:', error);
    return null;
  }
}

/**
 * Add items to cart
 */
async function addItemsToCart(token, cartId) {
  console.log(`Adding items to cart ${cartId}...`);
  
  try {
    const itemData = {
      productId: uuidv4(), // Simulate a product ID
      quantity: 2,
      unitPrice: '25.00'
    };
    
    const response = await fetch(`${API_BASE_URL}/ecommerce/cart/${cartId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itemData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to add item to cart: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Item added to cart: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    console.error('Error adding items to cart:', error);
    return null;
  }
}

/**
 * Process checkout
 */
async function processCheckout(token, cartId) {
  console.log(`Processing checkout for cart ${cartId}...`);
  
  try {
    const checkoutData = {
      cartId,
      companyId: COMPANY_ID,
      userId: USER_ID,
      paymentMethod: 'credit_card',
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      },
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      }
    };
    
    const response = await fetch(`${API_BASE_URL}/ecommerce/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(checkoutData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to process checkout: ${responseData.message || response.statusText}`);
    }
    
    console.log(`✅ Checkout processed successfully!`);
    console.log(`Order ID: ${responseData.orderId}`);
    console.log(`Transaction ID: ${responseData.transactionId}`);
    console.log(`Status: ${responseData.status}`);
    return responseData;
  } catch (error) {
    console.error('Error processing checkout:', error);
    return null;
  }
}

/**
 * Process a direct payment
 */
async function processDirectPayment(token) {
  console.log('Processing direct payment...');
  
  try {
    // Create a unique idempotency key
    const idempotencyKey = uuidv4();
    
    // Prepare payment data
    const paymentData = {
      companyId: COMPANY_ID,
      userId: USER_ID,
      paymentMethod: 'credit_card',
      amount: 49.99,
      currency: 'usd',
      options: {
        idempotencyKey,
        capture: true,
        description: 'Test direct payment from checkout flow test',
        receiptEmail: 'test@example.com',
        metadata: {
          test: true,
          source: 'checkout_flow_test'
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
      return null;
    }
    
    // Check if payment was successful or at least pending
    if (responseData.status === 'success' || responseData.status === 'pending') {
      console.log('Payment was processed successfully!');
      console.log('Payment ID:', responseData.data?.id);
      console.log('Status:', responseData.status);
      return responseData;
    } else {
      console.error('Payment was not successful');
      console.error('Error:', responseData.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('Error processing direct payment:', error);
    return null;
  }
}

/**
 * Run the complete checkout flow test
 */
async function testCheckoutFlow() {
  try {
    console.log('Starting checkout flow test with Stripe integration...');
    
    // Get a token for authentication
    const token = await getToken();
    if (!token) {
      console.error('Failed to get authentication token. Aborting test.');
      return false;
    }
    
    console.log('✅ Authentication token obtained');
    
    // Test direct payment first (simpler flow)
    console.log('\n=== Testing Direct Payment ===');
    const directPaymentResult = await processDirectPayment(token);
    if (!directPaymentResult) {
      console.error('Direct payment test failed. Skipping cart checkout flow.');
      return false;
    }
    
    console.log('✅ Direct payment test passed');
    
    // Now test the full cart checkout flow
    console.log('\n=== Testing Cart Checkout Flow ===');
    
    // Create a cart
    const cart = await createCart(token);
    if (!cart) {
      console.error('Failed to create cart. Aborting test.');
      return false;
    }
    
    // Add items to the cart
    const cartItems = await addItemsToCart(token, cart.id);
    if (!cartItems) {
      console.error('Failed to add items to cart. Aborting test.');
      return false;
    }
    
    // Process checkout
    const checkout = await processCheckout(token, cart.id);
    if (!checkout) {
      console.error('Failed to process checkout. Aborting test.');
      return false;
    }
    
    console.log('\n✅ Complete checkout flow test passed!');
    return true;
  } catch (error) {
    console.error('Error testing checkout flow:', error);
    return false;
  }
}

// Run the test
testCheckoutFlow()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });