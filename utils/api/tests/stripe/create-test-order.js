/**
 * Create Test Order and Transaction Data
 * 
 * This script creates test data needed for the payment integration test.
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Constants
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465'; // GeniusERP Demo Company
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787'; // admin user

async function createTestData() {
  console.log('Creating test order and transaction data...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Generate a unique order ID
    const orderId = uuidv4();
    const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
    
    // Create sample shipping and billing addresses
    const shippingAddress = {
      name: 'Test Customer',
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US'
    };
    
    // Create a test order
    const orderItems = [
      {
        productId: uuidv4(),
        name: 'Test Product 1',
        sku: 'TP001',
        quantity: 2,
        unitPrice: '24.99',
        totalPrice: '49.98',
        metadata: {
          source: 'test',
          weight: '0.5kg'
        }
      },
      {
        productId: uuidv4(),
        name: 'Test Product 2',
        sku: 'TP002',
        quantity: 1,
        unitPrice: '149.99',
        totalPrice: '149.99',
        metadata: {
          source: 'test',
          weight: '1.2kg'
        }
      }
    ];
    
    // Calculate totals
    const subtotal = 199.97;
    const tax = 19.99;
    const shipping = 9.99;
    const discount = 0;
    const total = subtotal + tax + shipping - discount;
    
    // Check if order already exists to avoid duplicates
    const existingOrderResult = await pool.query(
      'SELECT id FROM ecommerce_orders WHERE order_number = $1', 
      [orderNumber]
    );
    
    if (existingOrderResult.rows.length > 0) {
      console.log(`Order ${orderNumber} already exists, skipping creation`);
      return {
        orderId: existingOrderResult.rows[0].id,
        orderNumber
      };
    }
    
    // Format dates for PostgreSQL
    const now = new Date().toISOString();
    
    // Insert order record
    const orderResult = await pool.query(`
      INSERT INTO ecommerce_orders (
        id, company_id, order_number, order_date, 
        customer_email, customer_name, subtotal, tax, 
        shipping, discount, total, status, payment_status,
        payment_method, shipping_address, billing_address,
        items, created_at, updated_at, created_by
      )
      VALUES (
        $1, $2, $3, $4, 
        $5, $6, $7, $8, 
        $9, $10, $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19, $20
      )
      RETURNING id
    `, [
      orderId, COMPANY_ID, orderNumber, now,
      'test@example.com', 'Test Customer', subtotal, tax,
      shipping, discount, total, 'pending', 'pending',
      'credit_card', JSON.stringify(shippingAddress), JSON.stringify(shippingAddress),
      JSON.stringify(orderItems), now, now, USER_ID
    ]);
    
    console.log(`✅ Order created with ID: ${orderId}`);
    console.log(`Order Number: ${orderNumber}`);
    console.log(`Total Amount: $${total.toFixed(2)}`);
    
    return {
      orderId,
      orderNumber
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test data creation
createTestData()
  .then(result => {
    console.log('\nTest data created successfully!');
    console.log(`Use Order ID: ${result.orderId}`);
    console.log(`Order Number: ${result.orderNumber}`);
    
    // Update the test-live-stripe-payment.js file to use this order ID
    console.log('\nYou can now run the test-live-stripe-payment.js script to process a payment for this order.');
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create test data:', error);
    process.exit(1);
  });