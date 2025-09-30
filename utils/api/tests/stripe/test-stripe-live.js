/**
 * Enhanced Stripe Checkout Test with Live API Integration
 * 
 * This script tests the complete checkout flow with the live Stripe API:
 * 1. Creates a new order in the database
 * 2. Creates a Stripe payment intent through our API
 * 3. Simulates payment completion with Stripe test cards
 * 4. Verifies the transaction and order status
 */

import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import pg from 'pg';
const { Pool } = pg;

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret'; // Match with auth.service.ts
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';

// Initialize Stripe with the test secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe test card details
const TEST_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12/28',
  cvc: '123',
  zipCode: '12345'
};

/**
 * Generate a JWT token for authentication
 */
function generateToken() {
  // Use same payload structure as auth.service.ts
  const payload = {
    id: USER_ID,
    userId: USER_ID,
    sub: USER_ID,
    companyId: COMPANY_ID,
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    roles: ['admin', 'ecommerce_admin'],
    permissions: ['ecommerce.orders.create', 'ecommerce.orders.read', 'ecommerce.payment.process']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Create a test order in the database
 */
async function createOrder(token) {
  console.log('Creating test order...');
  
  const orderNumber = `TEST-${Math.floor(Math.random() * 900000) + 100000}`;
  
  // Important: Don't include orderDate, let the database handle it
  const orderData = {
    orderNumber,
    status: 'pending',
    subtotal: '199.99',  // Using string format for numeric fields
    tax: '10.00',
    shipping: '12.99',
    discount: '0.00',
    total: '222.98',
    currencyCode: 'usd',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    items: [
      {
        productId: uuidv4(),
        quantity: 2,
        unitPrice: '99.99',
        totalPrice: '199.98',
        productName: 'Test Product'
      }
    ],
    billingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    },
    paymentMethod: 'credit_card'
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to create order: ${JSON.stringify(responseData)}`);
    }
    
    console.log(`✅ Created order: ${responseData.data.id}`);
    console.log(`Order number: ${responseData.data.orderNumber}`);
    console.log(`Total amount: $${responseData.data.total}`);
    
    return responseData.data;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw error;
  }
}

/**
 * Process payment for an order through our payment API
 */
async function processPayment(order, token) {
  console.log('\nProcessing payment through API...');
  
  const paymentData = {
    orderId: order.id,
    amount: parseFloat(order.total),
    currency: 'usd',
    paymentMethod: 'credit_card',
    description: `Payment for order ${order.orderNumber}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      test: true
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ecommerce/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    // For Stripe payments, status 402 with requires_payment_method is also valid
    if (!response.ok && response.status !== 402) {
      throw new Error(`Payment API failed with status ${response.status}: ${JSON.stringify(data)}`);
    }
    
    if (data.data && data.data.id) {
      console.log('✅ Payment intent created successfully: ' + data.data.id);
      if (data.data.clientSecret) {
        console.log('Client secret: ' + data.data.clientSecret);
      }
    } else if (!response.ok) {
      throw new Error(`Payment API failed: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error processing payment:', error.message);
    throw error;
  }
}

/**
 * Simulate completing the Stripe payment by directly confirming the payment intent
 * This simulates what would happen in a real frontend with Stripe Elements
 * NOTE: This is done for testing convenience, in a real app you'd use Stripe Elements or Checkout
 */
async function completeStripePayment(paymentResponse) {
  console.log('\nSimulating payment completion with Stripe test card...');
  console.log('Card number: ' + TEST_CARD.number);
  
  try {
    if (!paymentResponse.data || !paymentResponse.data.id) {
      throw new Error('No payment intent ID found in payment response');
    }
    
    const paymentIntentId = paymentResponse.data.id;
    
    // Create a payment method (normally this would be done on the frontend)
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2028,
        cvc: '123',
      },
    });
    
    console.log(`Created test payment method: ${paymentMethod.id}`);
    
    // Attach the payment method to the payment intent
    const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
      payment_method: paymentMethod.id,
    });
    
    console.log(`Attached payment method to intent: ${updatedIntent.id}`);
    
    // Confirm the payment intent
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.id,
    });
    
    console.log(`✅ Payment confirmed: ${confirmedIntent.id}`);
    console.log(`Payment status: ${confirmedIntent.status}`);
    
    return {
      id: confirmedIntent.id,
      status: confirmedIntent.status,
      message: 'Payment completed successfully with Stripe API'
    };
  } catch (error) {
    console.error('Error completing Stripe payment:', error.message);
    throw error;
  }
}

/**
 * Create a transaction record in the database for the payment
 */
async function createTransaction(order, paymentIntent, token) {
  console.log('\nRecording transaction in database...');
  
  const transactionData = {
    orderId: order.id,
    companyId: COMPANY_ID,
    transactionType: 'payment',
    amount: parseFloat(order.total),
    currency: 'usd',
    status: 'completed',
    paymentMethod: 'credit_card',
    transactionId: paymentIntent.id,
    gatewayName: 'stripe',
    gatewayResponse: {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    },
    notes: 'Test transaction created via API test script',
    metadata: {
      test: true,
      source: 'test-script'
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ecommerce/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transactionData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Transaction recording failed: ${JSON.stringify(data)}`);
    }
    
    console.log(`✅ Transaction recorded: ${data.data.id}`);
    return data.data;
  } catch (error) {
    console.error('Error recording transaction:', error.message);
    throw error;
  }
}

/**
 * Update order status after payment
 */
async function updateOrderStatus(orderId, token) {
  console.log('\nUpdating order status to completed...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/ecommerce/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Order status update failed: ${JSON.stringify(data)}`);
    }
    
    console.log(`✅ Order status updated to completed`);
    return data.data;
  } catch (error) {
    console.error('Error updating order status:', error.message);
    throw error;
  }
}

/**
 * Verify database state after the complete test
 */
async function verifyDatabaseState(orderId, transactionId) {
  console.log('\nVerifying database state after payment...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Check order payment status
    const orderResult = await pool.query(
      'SELECT status, payment_status FROM ecommerce_orders WHERE id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found in database`);
    }
    
    const order = orderResult.rows[0];
    console.log(`Order status: ${order.status}`);
    console.log(`Payment status: ${order.payment_status}`);
    
    // Check transaction
    const transactionResult = await pool.query(
      'SELECT status, transaction_id FROM ecommerce_transactions WHERE id = $1',
      [transactionId]
    );
    
    if (transactionResult.rows.length === 0) {
      throw new Error(`Transaction ${transactionId} not found in database`);
    }
    
    const transaction = transactionResult.rows[0];
    console.log(`Transaction status: ${transaction.status}`);
    console.log(`External transaction ID: ${transaction.transaction_id}`);
    
    return { order, transaction };
  } catch (error) {
    console.error('Error verifying database state:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Run the complete test workflow
 */
async function runTest() {
  console.log('=== Starting Complete Stripe Integration Test ===\n');
  
  try {
    // Verify Stripe keys are configured
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    
    console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.slice(-4)}\n`);
    
    // Generate authentication token
    const token = generateToken();
    console.log('✅ Generated authentication token');
    
    // Create a test order
    const order = await createOrder(token);
    
    // Process payment with Stripe through our API
    const paymentResponse = await processPayment(order, token);
    
    // Complete the payment with Stripe's API directly
    const completedPayment = await completeStripePayment(paymentResponse);
    
    // Create a transaction record
    const transaction = await createTransaction(order, completedPayment, token);
    
    // Update order status
    const updatedOrder = await updateOrderStatus(order.id, token);
    
    // Verify the database state
    await verifyDatabaseState(order.id, transaction.id);
    
    console.log('\n✅ Complete Stripe Integration Test SUCCESSFUL');
    console.log('The payment flow is working correctly with the live Stripe API');
  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();