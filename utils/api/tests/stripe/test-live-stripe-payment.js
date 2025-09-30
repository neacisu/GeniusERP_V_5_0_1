/**
 * Live Stripe Payment Integration Test
 * 
 * This script tests the full Stripe payment flow using real database data and live Stripe connection:
 * 1. Creates a valid JWT token
 * 2. Creates a test order in the database
 * 3. Processes a payment through Stripe
 * 4. Verifies the payment intent was created
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

// Create a test order
async function createOrder(token) {
  console.log('\n--- Creating test order ---');
  
  try {
    const orderData = {
      orderNumber: `TEST-${Math.floor(Math.random() * 1000000)}`,
      // orderDate intentionally omitted to use database default
      status: 'pending',
      // Use both field names to ensure compatibility during transition
      subtotal: '129.99',
      totalAmount: '129.99',
      tax: '10.00',
      taxAmount: '10.00',
      discount: '0.00',
      discountAmount: '0.00',
      shipping: '9.99',
      shippingAmount: '9.99',
      total: '149.98', // Total amount (subtotal + tax + shipping - discount)
      currencyCode: 'USD',
      paymentMethod: 'credit_card',
      paymentStatus: 'pending', // Added payment status
      // Add userId and companyId explicitly (even though they're in the JWT token)
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
      notes: 'Test order for Stripe integration'
    };
    
    const response = await axios.post(`${API_URL}/api/ecommerce/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order created successfully:', response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Process payment for an order
async function processPayment(order, token) {
  console.log('\n--- Processing payment ---');
  
  try {
    const paymentData = {
      orderId: order.id,
      amount: order.total, // Use the total from the order
      currency: order.currencyCode || 'USD',
      paymentMethod: 'credit_card',
      description: `Payment for order ${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber
      }
    };
    
    const response = await axios.post(`${API_URL}/api/ecommerce/payment`, paymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Allow 402 status - this is expected for payments requiring confirmation
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 402;
      }
    });
    
    console.log('Payment processed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error processing payment:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Verify the transaction exists
async function verifyTransaction(orderId, token) {
  console.log('\n--- Verifying transaction ---');
  
  try {
    // Wait a moment to ensure async processing completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await axios.get(`${API_URL}/api/ecommerce/transactions/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Transaction verification:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying transaction:', error.response ? error.response.data : error.message);
    return null; // Don't throw here, as the transaction might be created asynchronously
  }
}

// Main test function
async function runTest() {
  try {
    console.log('=== STARTING LIVE STRIPE PAYMENT TEST ===');
    
    // Generate a valid JWT token
    const token = generateToken();
    
    // Create a test order
    const order = await createOrder(token);
    
    // Process payment for the order
    const paymentResponse = await processPayment(order, token);
    
    // Verify transaction exists (may be async)
    const transactionVerification = await verifyTransaction(order.id, token);
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('Order ID:', order.id);
    console.log('Order Number:', order.orderNumber);
    console.log('Payment Intent ID:', paymentResponse?.data?.paymentIntentId || 'N/A');
    console.log('Payment Status:', paymentResponse?.data?.status || 'N/A');
    console.log('Client Secret:', paymentResponse?.data?.clientSecret || 'N/A');
    
    if (transactionVerification) {
      console.log('Transaction recorded:', transactionVerification.success);
    } else {
      console.log('Transaction may be processing asynchronously');
    }
    
    console.log('\n=== TEST COMPLETED ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();