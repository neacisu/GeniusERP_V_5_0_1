/**
 * Checkout Flow Test Script with Stripe Integration
 * 
 * This script tests the full checkout flow with the Stripe integration,
 * from creating a cart through to payment processing.
 */

import * as dotenv from 'dotenv';
import CheckoutService from './server/modules/ecommerce/services/checkout.service.ts';
import CartService from './server/modules/ecommerce/services/cart.service.ts';
import TransactionsService from './server/modules/ecommerce/services/transactions.service.ts';
import StripeClient from './server/modules/integrations/clients/stripe.client.ts';

// Load environment variables
dotenv.config();

// Verify Stripe API keys
const verifyStripeKeys = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeSecretKey || !stripePublishableKey) {
    console.error('❌ Missing Stripe API keys. Both STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY are required.');
    return false;
  }
  
  return true;
};

// Create a mock cart with sample products
const createMockCart = async (cartService, userId, companyId) => {
  console.log('Creating mock cart...');
  
  try {
    // Create a new cart
    const cart = await cartService.createCart({
      userId,
      companyId,
      items: [
        {
          productId: 'prod-test-001',
          name: 'Test Product 1',
          quantity: 2,
          unitPrice: '29.99',
          totalPrice: '59.98',
          sku: 'TEST-SKU-001'
        },
        {
          productId: 'prod-test-002',
          name: 'Test Product 2',
          quantity: 1,
          unitPrice: '49.99',
          totalPrice: '49.99',
          sku: 'TEST-SKU-002'
        }
      ],
      totalAmount: '109.97',
      totalQuantity: 3,
      currencyCode: 'USD',
      status: 'active'
    });
    
    if (!cart || !cart.id) {
      console.error('❌ Failed to create cart');
      return null;
    }
    
    console.log('✅ Cart created successfully', { cartId: cart.id });
    return cart;
  } catch (error) {
    console.error('❌ Error creating mock cart:', error);
    return null;
  }
};

// Process checkout with the created cart
const processCheckout = async (checkoutService, cart, userId, companyId) => {
  console.log('Processing checkout...');
  
  try {
    const checkoutData = {
      cartId: cart.id,
      userId,
      companyId,
      paymentMethod: 'credit_card', // This will use the Stripe gateway
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
        email: 'test@example.com',
        phone: '555-555-5555'
      },
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        address1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US',
        email: 'test@example.com',
        phone: '555-555-5555'
      }
    };
    
    const checkoutResult = await checkoutService.processCheckout(checkoutData);
    
    if (!checkoutResult || !checkoutResult.orderId) {
      console.error('❌ Checkout failed', checkoutResult);
      return null;
    }
    
    console.log('✅ Checkout processed successfully', {
      orderId: checkoutResult.orderId,
      paymentIntentId: checkoutResult.paymentIntentId
    });
    
    return checkoutResult;
  } catch (error) {
    console.error('❌ Error processing checkout:', error);
    return null;
  }
};

// Verify the transaction was created and has the correct data
const verifyTransaction = async (transactionsService, checkoutResult, userId, companyId) => {
  console.log('Verifying transaction...');
  
  try {
    // Get the transaction by order ID
    const transaction = await transactionsService.getTransactionByOrderId(checkoutResult.orderId);
    
    if (!transaction) {
      console.error('❌ No transaction found for order', checkoutResult.orderId);
      return false;
    }
    
    console.log('✅ Transaction verified', {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod
    });
    
    // Check if the transaction has the Stripe payment intent ID
    if (transaction.transactionId !== checkoutResult.paymentIntentId) {
      console.error('❌ Transaction ID does not match payment intent ID');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying transaction:', error);
    return false;
  }
};

// Main test function
const runCheckoutTest = async () => {
  console.log('===== Stripe Checkout Flow Test =====');
  
  // Verify Stripe keys first
  if (!verifyStripeKeys()) {
    console.error('❌ Test aborted due to missing Stripe API keys');
    process.exit(1);
  }
  
  // Set up test user and company IDs
  const testUserId = 'test-user-123';
  const testCompanyId = 'test-company-456';
  
  try {
    // Create service instances
    const stripeClient = new StripeClient(testCompanyId);
    const cartService = new CartService();
    const checkoutService = new CheckoutService();
    const transactionsService = new TransactionsService();
    
    // Initialize services with necessary dependencies
    // This would normally be done by the dependency injection system
    
    // Test Stripe connection
    console.log('Testing Stripe API connection...');
    const stripeConnection = await stripeClient.testConnection();
    
    if (!stripeConnection) {
      console.error('❌ Stripe API connection failed - aborting test');
      process.exit(1);
    }
    
    console.log('✅ Stripe API connection successful');
    
    // Create mock cart
    const cart = await createMockCart(cartService, testUserId, testCompanyId);
    
    if (!cart) {
      console.error('❌ Failed to create cart - aborting test');
      process.exit(1);
    }
    
    // Process checkout
    const checkoutResult = await processCheckout(checkoutService, cart, testUserId, testCompanyId);
    
    if (!checkoutResult) {
      console.error('❌ Checkout failed - aborting test');
      process.exit(1);
    }
    
    // Verify transaction
    const transactionVerified = await verifyTransaction(transactionsService, checkoutResult, testUserId, testCompanyId);
    
    if (!transactionVerified) {
      console.error('❌ Transaction verification failed');
      process.exit(1);
    }
    
    console.log('===== Stripe Checkout Flow Test Completed Successfully =====');
  } catch (error) {
    console.error('❌ Unexpected error during checkout flow test:', error);
    process.exit(1);
  }
};

// Run the test
runCheckoutTest().catch(error => {
  console.error('Unhandled error in checkout flow test:', error);
  process.exit(1);
});