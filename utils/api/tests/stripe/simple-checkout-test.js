/**
 * Simple Checkout Flow Test
 * 
 * This script tests the transaction creation with the required transactionType field
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Define transaction types (lowercase as per database enum)
const TransactionType = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  PARTIAL_REFUND: 'partial_refund',
  AUTHORIZATION: 'authorization',
  CAPTURE: 'capture',
  VOID: 'void'
};

// Define payment statuses (lowercase as per database enum)
const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

// Create a new pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testTransactionCreation() {
  const client = await pool.connect();

  try {
    // Generate IDs
    const orderId = uuidv4();
    const userId = uuidv4();
    const companyId = uuidv4();
    const transactionId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;

    console.log('Creating test order with ID:', orderId);
    
    // Create a sample order first
    const orderResult = await client.query(
      `INSERT INTO ecommerce_orders 
      (id, company_id, order_number, order_date, subtotal, tax, shipping, discount, total, status, 
       payment_status, payment_method, items, created_at, updated_at, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
      RETURNING id, order_number, status`,
      [
        orderId,
        companyId,
        orderNumber,
        new Date(),
        '90.00',   // subtotal
        '10.00',   // tax
        '0.00',    // shipping
        '0.00',    // discount
        '100.00',  // total
        'pending', // status (from order_status enum)
        'pending', // payment_status (using payment_status enum)
        'credit_card', // payment_method
        JSON.stringify([{ productId: uuidv4(), quantity: 1, unitPrice: '90.00', totalPrice: '90.00' }]), // items
        new Date(),
        new Date(),
        userId
      ]
    );
    
    console.log('Order created successfully:', orderResult.rows[0]);
    console.log('Creating test transaction for order...');
    console.log('Transaction type:', TransactionType.PAYMENT);

    // Insert a test transaction linked to the order we just created
    const result = await client.query(
      `INSERT INTO ecommerce_transactions 
      (id, order_id, company_id, transaction_type, transaction_date, amount, currency, status, payment_method, metadata, created_at, updated_at, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING id, transaction_type, status`,
      [
        transactionId,
        orderId,
        companyId,
        TransactionType.PAYMENT,
        new Date(),
        '100.00',
        'RON',
        PaymentStatus.PENDING,
        'credit_card',
        JSON.stringify({ test: true }),
        new Date(),
        new Date(),
        userId // Use userId for created_by
      ]
    );

    console.log('Transaction created successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the test
testTransactionCreation()
  .then(result => {
    console.log('Test completed successfully:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });