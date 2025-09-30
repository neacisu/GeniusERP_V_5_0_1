/**
 * Checkout Flow Test Script with Stripe Integration
 * 
 * This script tests the full checkout flow with the Stripe integration,
 * from creating a cart through to payment processing.
 */

import * as dotenv from 'dotenv';
import { CheckoutService } from './server/modules/ecommerce/services/checkout.service';
import { CartService } from './server/modules/ecommerce/services/cart.service';
import { TransactionsService } from './server/modules/ecommerce/services/transactions.service';
import { OrdersService } from './server/modules/ecommerce/services/orders.service';
import { StripeClient } from './server/modules/integrations/clients/stripe.client';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { carts, cartItems } from './shared/schema/ecommerce.schema';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Verify Stripe API keys
const verifyStripeKeys = (): boolean => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeSecretKey || !stripePublishableKey) {
    console.error('❌ Missing Stripe API keys. Both STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY are required.');
    return false;
  }
  
  return true;
};

interface Cart {
  id: string;
  [key: string]: any;
}

interface CheckoutResult {
  order: {
    id: string;
    [key: string]: any;
  };
  transaction: {
    id: string;
    transactionId: string | null;
    [key: string]: any;
  };
}

// Create a connection to the database
const createDbConnection = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const client = postgres(connectionString, { max: 1 });
  return drizzle(client);
};

// Create a mock cart with sample products
const createMockCart = async (cartService: CartService, userId: string, companyId: string): Promise<Cart | null> => {
  console.log('Creating mock cart...');
  
  try {
    // Create a new cart with the correct parameters
    const cart = await cartService.createCart(userId, companyId);
    
    if (!cart || !cart.id) {
      console.error('❌ Failed to create cart');
      return null;
    }
    
    // Add items to the cart with proper UUID format for product IDs
    const productId1 = uuidv4();
    const productId2 = uuidv4();
    
    console.log('Test product IDs:', { productId1, productId2 });
    
    await cartService.addItem(
      cart.id,
      productId1,
      2,
      29.99,
      { name: 'Test Product 1', sku: 'TEST-SKU-001' }
    );
    
    await cartService.addItem(
      cart.id,
      productId2,
      1,
      49.99,
      { name: 'Test Product 2', sku: 'TEST-SKU-002' }
    );
    
    // Get the complete cart with items
    const cartWithItems = await cartService.getCartWithItems(cart.id);
    
    console.log('✅ Cart created successfully', { cartId: cartWithItems.id });
    return cartWithItems;
  } catch (error) {
    console.error('❌ Error creating mock cart:', error);
    return null;
  }
};

// Process checkout with the created cart
const processCheckout = async (
  checkoutService: CheckoutService, 
  cart: Cart, 
  userId: string, 
  companyId: string
): Promise<CheckoutResult | null> => {
  console.log('Processing checkout...');
  
  try {
    const billingAddress = {
      firstName: 'Test',
      lastName: 'User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      email: 'test@example.com',
      phone: '555-555-5555'
    };
    
    const shippingAddress = {
      firstName: 'Test',
      lastName: 'User',
      address1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      email: 'test@example.com',
      phone: '555-555-5555'
    };
    
    const checkoutResult = await checkoutService.processCheckout(
      cart.id,
      userId,
      companyId,
      'credit_card', // This will use the Stripe gateway
      shippingAddress,
      billingAddress
    );
    
    if (!checkoutResult || !checkoutResult.order) {
      console.error('❌ Checkout failed', checkoutResult);
      return null;
    }
    
    console.log('✅ Checkout processed successfully', {
      orderId: checkoutResult.order.id,
      transactionId: checkoutResult.transaction.transactionId
    });
    
    return checkoutResult;
  } catch (error) {
    console.error('❌ Error processing checkout:', error);
    return null;
  }
};

// Verify the transaction was created and has the correct data
const verifyTransaction = async (
  transactionsService: TransactionsService, 
  checkoutResult: CheckoutResult, 
  userId: string, 
  companyId: string
): Promise<boolean> => {
  console.log('Verifying transaction...');
  
  try {
    // Get the transaction by ID
    const transaction = await transactionsService.getTransactionById(checkoutResult.transaction.id);
    
    if (!transaction) {
      console.error('❌ No transaction found for ID', checkoutResult.transaction.id);
      return false;
    }
    
    console.log('✅ Transaction verified', {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod
    });
    
    // Check if the transaction has the Stripe payment intent ID
    if (transaction.transactionId !== checkoutResult.transaction.transactionId) {
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
const runCheckoutTest = async (): Promise<void> => {
  console.log('===== Stripe Checkout Flow Test =====');
  
  // Verify Stripe keys first
  if (!verifyStripeKeys()) {
    console.error('❌ Test aborted due to missing Stripe API keys');
    process.exit(1);
  }
  
  // Set up test user and company IDs
  const testUserId = uuidv4();  // Generate proper UUID
  const testCompanyId = uuidv4(); // Generate proper UUID
  
  console.log('Generated test IDs:', { testUserId, testCompanyId });
  
  try {
    // Create database connection
    const db = createDbConnection();
    
    // Create service instances
    const stripeClient = new StripeClient(testCompanyId);
    const cartService = new CartService(db);
    const transactionsService = new TransactionsService(db);
    const ordersService = new OrdersService(db);
    const checkoutService = new CheckoutService(db, ordersService, transactionsService, cartService);
    
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