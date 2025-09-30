/**
 * Test Data Creation and Stripe Integration Test
 * 
 * This script creates real test data in the database and tests the Stripe integration.
 * It follows these steps:
 * 1. Creates test company and user data if needed
 * 2. Creates test products
 * 3. Creates a test order
 * 4. Processes a payment using the live Stripe API
 * 5. Verifies the transaction record and order status
 */

import postgres from 'postgres';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';
const DATABASE_URL = process.env.DATABASE_URL;

// Test data IDs (will be populated during execution)
let companyId;
let userId;
let adminId;
let productIds = [];

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create database connection
 */
function getDbConnection() {
  return postgres(DATABASE_URL);
}

/**
 * Generate a JWT token for authentication
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    userId: user.id,
    sub: user.id,
    companyId: user.company_id,
    email: user.email,
    username: user.username || user.email.split('@')[0],
    role: user.role,
    roles: [user.role],
    permissions: ['ecommerce.orders.create', 'ecommerce.orders.read', 'ecommerce.payment.process']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Check if test company exists or create it
 */
async function ensureTestCompany() {
  console.log('Checking for test company...');
  const pool = getDbPool();
  
  try {
    // Check if test company exists
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE name = 'Test Company'"
    );
    
    if (companyResult.rows.length > 0) {
      companyId = companyResult.rows[0].id;
      console.log(`✅ Found existing test company with ID: ${companyId}`);
    } else {
      // Create test company
      const insertResult = await pool.query(
        `INSERT INTO companies (id, name, email, phone, address, city, country, vat_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
        [
          uuidv4(),
          'Test Company',
          'test@company.com',
          '+40123456789',
          '123 Test Street',
          'Test City',
          'Romania',
          'RO12345678'
        ]
      );
      
      companyId = insertResult.rows[0].id;
      console.log(`✅ Created new test company with ID: ${companyId}`);
    }
    
    return companyId;
  } catch (error) {
    console.error('Error ensuring test company exists:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Check if test user exists or create it
 */
async function ensureTestUser() {
  console.log('Checking for test users...');
  const pool = getDbPool();
  
  try {
    // Check if admin user exists
    const userResult = await pool.query(
      "SELECT id, company_id, email, role FROM users WHERE email = 'admin@testcompany.com'"
    );
    
    if (userResult.rows.length > 0) {
      adminId = userResult.rows[0].id;
      console.log(`✅ Found existing admin user with ID: ${adminId}`);
    } else {
      // Create admin user
      const adminResult = await pool.query(
        `INSERT INTO users (id, company_id, email, password, first_name, last_name, role, active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
        [
          uuidv4(),
          companyId,
          'admin@testcompany.com',
          '$2b$10$XKjJMqoYwUrTnH.e8B7QhOgKE4O0S3M0L6LKT95/Q6otnEnlJJ4v2', // Hash for "password123"
          'Admin',
          'User',
          'admin',
          true
        ]
      );
      
      adminId = adminResult.rows[0].id;
      console.log(`✅ Created admin user with ID: ${adminId}`);
    }
    
    // Check if regular user exists
    const regularUserResult = await pool.query(
      "SELECT id, company_id, email, role FROM users WHERE email = 'user@testcompany.com'"
    );
    
    if (regularUserResult.rows.length > 0) {
      userId = regularUserResult.rows[0].id;
      console.log(`✅ Found existing regular user with ID: ${userId}`);
    } else {
      // Create regular user
      const userInsertResult = await pool.query(
        `INSERT INTO users (id, company_id, email, password, first_name, last_name, role, active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
        [
          uuidv4(),
          companyId,
          'user@testcompany.com',
          '$2b$10$XKjJMqoYwUrTnH.e8B7QhOgKE4O0S3M0L6LKT95/Q6otnEnlJJ4v2', // Hash for "password123"
          'Test',
          'User',
          'user',
          true
        ]
      );
      
      userId = userInsertResult.rows[0].id;
      console.log(`✅ Created regular user with ID: ${userId}`);
    }
    
    return { adminId, userId };
  } catch (error) {
    console.error('Error ensuring test users exist:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Create test products if they don't exist
 */
async function createTestProducts() {
  console.log('Creating test products...');
  const pool = getDbPool();
  
  try {
    // Check if inventory_products table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'inventory_products'
      )
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.log('⚠️ inventory_products table does not exist, skipping product creation');
      return [];
    }
    
    // Check if we already have test products
    const existingProducts = await pool.query(
      "SELECT id FROM inventory_products WHERE name LIKE 'Test Product%' AND company_id = $1 LIMIT 5",
      [companyId]
    );
    
    if (existingProducts.rows.length > 0) {
      productIds = existingProducts.rows.map(row => row.id);
      console.log(`✅ Found ${productIds.length} existing test products`);
      return productIds;
    }
    
    // Create test products
    const testProducts = [
      { name: 'Test Product 1', price: '99.99', sku: 'TP001', description: 'Test product 1 description' },
      { name: 'Test Product 2', price: '149.99', sku: 'TP002', description: 'Test product 2 description' },
      { name: 'Test Product 3', price: '199.99', sku: 'TP003', description: 'Test product 3 description' },
      { name: 'Test Product 4', price: '249.99', sku: 'TP004', description: 'Test product 4 description' },
      { name: 'Test Product 5', price: '299.99', sku: 'TP005', description: 'Test product 5 description' }
    ];
    
    for (const product of testProducts) {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO inventory_products (id, company_id, name, description, sku, price, stock_quantity, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          id,
          companyId,
          product.name,
          product.description,
          product.sku,
          product.price,
          100 // stock quantity
        ]
      );
      
      productIds.push(id);
    }
    
    console.log(`✅ Created ${testProducts.length} test products`);
    return productIds;
  } catch (error) {
    console.error('Error creating test products:', error);
    // Don't throw here, just log the error and continue
    console.log('⚠️ Continuing without test products');
    return [];
  } finally {
    await pool.end();
  }
}

/**
 * Create a test order through the API
 */
async function createTestOrder(token) {
  console.log('Creating test order...');
  
  const orderNumber = `TEST-${Math.floor(Math.random() * 900000) + 100000}`;
  
  // Prepare order items based on available products
  let items = [];
  if (productIds.length > 0) {
    items = [
      {
        productId: productIds[0],
        quantity: 2,
        unitPrice: '99.99',
        totalPrice: '199.98',
        productName: 'Test Product 1'
      }
    ];
    
    if (productIds.length > 1) {
      items.push({
        productId: productIds[1],
        quantity: 1,
        unitPrice: '149.99',
        totalPrice: '149.99',
        productName: 'Test Product 2'
      });
    }
  } else {
    // If no products were created, use a generic test item
    items = [
      {
        productId: uuidv4(),
        quantity: 2,
        unitPrice: '99.99',
        totalPrice: '199.98',
        productName: 'Generic Test Product'
      }
    ];
  }
  
  // Calculate totals
  const subtotal = items.reduce((total, item) => total + parseFloat(item.totalPrice), 0).toFixed(2);
  const tax = (parseFloat(subtotal) * 0.19).toFixed(2); // 19% VAT (Romanian standard)
  const shipping = '15.00';
  const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);
  
  const orderData = {
    orderNumber,
    status: 'pending',
    subtotal,
    tax,
    shipping,
    discount: '0.00',
    total,
    currencyCode: 'ron', // Romanian currency
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    customerPhone: '+40723456789',
    items,
    billingAddress: {
      street: 'Strada Exemplu 123',
      city: 'Bucuresti',
      state: 'Sector 1',
      zipCode: '012345',
      country: 'Romania'
    },
    shippingAddress: {
      street: 'Strada Exemplu 123',
      city: 'Bucuresti',
      state: 'Sector 1',
      zipCode: '012345',
      country: 'Romania'
    },
    paymentMethod: 'credit_card',
    notes: 'This is a test order created by the integration test script'
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
    console.log(`Total amount: ${responseData.data.total} ${responseData.data.currencyCode}`);
    
    return responseData.data;
  } catch (error) {
    console.error('Error creating order:', error.message);
    throw error;
  }
}

/**
 * Process payment for the test order using Stripe
 */
async function processPayment(order, token) {
  console.log('\nProcessing payment through API...');
  
  const paymentData = {
    orderId: order.id,
    amount: parseFloat(order.total),
    currency: order.currencyCode || 'ron',
    paymentMethod: 'credit_card',
    description: `Payment for test order ${order.orderNumber}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      test: true,
      integration_test: true
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
 * Complete the Stripe payment using the test card
 */
async function completeStripePayment(paymentResponse) {
  console.log('\nCompleting Stripe payment with test card...');
  
  try {
    if (!paymentResponse.data || !paymentResponse.data.id) {
      throw new Error('No payment intent ID found in payment response');
    }
    
    const paymentIntentId = paymentResponse.data.id;
    
    // Create a payment method
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
    
    // Confirm the payment intent
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.id,
    });
    
    console.log(`✅ Payment confirmed: ${confirmedIntent.id}`);
    console.log(`Payment status: ${confirmedIntent.status}`);
    
    return confirmedIntent;
  } catch (error) {
    console.error('Error completing Stripe payment:', error.message);
    throw error;
  }
}

/**
 * Record a transaction in the database
 */
async function recordTransaction(order, paymentIntent, token) {
  console.log('\nRecording transaction in database...');
  
  const transactionData = {
    orderId: order.id,
    companyId,
    transactionType: 'payment',
    amount: parseFloat(order.total),
    currency: order.currencyCode || 'ron',
    status: 'completed',
    paymentMethod: 'credit_card',
    transactionId: paymentIntent.id,
    transactionReference: `STRIPE-TEST-${Date.now()}`,
    gatewayName: 'stripe',
    gatewayResponse: {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    },
    notes: 'Test transaction from integration test',
    metadata: {
      test: true,
      integration_test: true
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
 * Update order payment status to completed
 */
async function updateOrderPaymentStatus(orderId, token) {
  console.log('\nUpdating order payment status...');
  
  try {
    // First, get the current order to check its status
    const getResponse = await fetch(`${API_BASE_URL}/api/ecommerce/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get order: ${getResponse.statusText}`);
    }
    
    // Update the order with completed payment status
    const updateData = {
      paymentStatus: 'completed'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/ecommerce/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Order payment status update failed: ${JSON.stringify(data)}`);
    }
    
    console.log(`✅ Order payment status updated to completed`);
    return data.data;
  } catch (error) {
    console.error('Error updating order payment status:', error.message);
    throw error;
  }
}

/**
 * Verify the database state after the complete test
 */
async function verifyDatabaseState(orderId, transactionId) {
  console.log('\nVerifying database state after payment...');
  
  const pool = getDbPool();
  
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
 * Main test function
 */
async function runTest() {
  console.log('=== Starting Stripe Integration Test with Real Database Data ===\n');
  
  try {
    // Verify Stripe keys are configured
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured');
    }
    
    console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.slice(-4)}\n`);
    
    // Step 1: Ensure we have a test company
    await ensureTestCompany();
    
    // Step 2: Ensure we have test users
    const users = await ensureTestUser();
    
    // Step 3: Create test products
    await createTestProducts();
    
    // Step 4: Fetch the admin user for token generation
    const pool = getDbPool();
    const userResult = await pool.query(
      "SELECT id, company_id, email, role FROM users WHERE id = $1",
      [adminId]
    );
    await pool.end();
    
    const adminUser = userResult.rows[0];
    
    // Generate auth token
    const token = generateToken(adminUser);
    console.log('✅ Generated authentication token for admin user');
    
    // Step 5: Create a test order
    const order = await createTestOrder(token);
    
    // Step 6: Process payment with Stripe
    const paymentResponse = await processPayment(order, token);
    
    // Step 7: Complete the payment with Stripe API
    const completedPayment = await completeStripePayment(paymentResponse);
    
    // Step 8: Record the transaction
    const transaction = await recordTransaction(order, completedPayment, token);
    
    // Step 9: Update order payment status
    await updateOrderPaymentStatus(order.id, token);
    
    // Step 10: Verify final state
    await verifyDatabaseState(order.id, transaction.id);
    
    console.log('\n✅ Stripe Integration Test with Real Data SUCCESSFUL');
    console.log('The payment flow is working correctly with the live Stripe API');
  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();