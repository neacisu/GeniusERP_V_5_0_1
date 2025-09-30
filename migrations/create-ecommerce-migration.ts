/**
 * E-commerce Schema Migration Script
 * 
 * This script applies the e-commerce schema directly to the database
 * by executing SQL statements to create the necessary tables, indexes,
 * and enum types for the e-commerce module.
 */

import { getDrizzle } from './server/common/drizzle';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Migrate e-commerce schema
 */
async function migrateEcommerceSchema() {
  console.log('🔄 Migrating e-commerce schema to the database...');

  try {
    const db = getDrizzle();
    
    // Create enum types
    console.log('Creating enum types if they don\'t exist...');
    
    // Check if order_status enum exists
    const [orderStatusExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'order_status'
      );
    `);
    
    if (!orderStatusExists.exists) {
      console.log('Creating order_status enum type...');
      await db.execute(sql`
        CREATE TYPE order_status AS ENUM (
          'draft',
          'pending',
          'processing',
          'on_hold',
          'completed',
          'canceled',
          'refunded',
          'failed',
          'shipped',
          'delivered',
          'returned'
        );
      `);
    }
    
    // Check if payment_status enum exists
    const [paymentStatusExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
      );
    `);
    
    if (!paymentStatusExists.exists) {
      console.log('Creating payment_status enum type...');
      await db.execute(sql`
        CREATE TYPE payment_status AS ENUM (
          'pending',
          'completed',
          'failed',
          'refunded',
          'partially_refunded'
        );
      `);
    }
    
    // Check if transaction_type enum exists
    const [transactionTypeExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'transaction_type'
      );
    `);
    
    if (!transactionTypeExists.exists) {
      console.log('Creating transaction_type enum type...');
      await db.execute(sql`
        CREATE TYPE transaction_type AS ENUM (
          'payment',
          'refund',
          'partial_refund',
          'authorization',
          'capture',
          'void'
        );
      `);
    }
    
    // Check if payment_method enum exists
    const [paymentMethodExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_method'
      );
    `);
    
    if (!paymentMethodExists.exists) {
      console.log('Creating payment_method enum type...');
      await db.execute(sql`
        CREATE TYPE payment_method AS ENUM (
          'credit_card',
          'debit_card',
          'paypal',
          'bank_transfer',
          'cash_on_delivery',
          'stripe',
          'other'
        );
      `);
    }
    
    // Check if platform_type enum exists
    const [platformTypeExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'platform_type'
      );
    `);
    
    if (!platformTypeExists.exists) {
      console.log('Creating platform_type enum type...');
      await db.execute(sql`
        CREATE TYPE platform_type AS ENUM (
          'website',
          'pos',
          'shopify',
          'prestashop',
          'woocommerce',
          'marketplace',
          'other'
        );
      `);
    }
    
    // Create orders table
    console.log('Creating ecommerce_orders table if it doesn\'t exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ecommerce_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        order_number TEXT NOT NULL,
        order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        customer_id UUID,
        customer_email TEXT,
        customer_phone TEXT,
        customer_name TEXT,
        
        subtotal NUMERIC NOT NULL,
        tax NUMERIC NOT NULL,
        shipping NUMERIC NOT NULL,
        discount NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        
        status order_status DEFAULT 'draft' NOT NULL,
        payment_status payment_status DEFAULT 'pending' NOT NULL,
        payment_method payment_method,
        
        shipping_address JSONB,
        billing_address JSONB,
        tracking_number TEXT,
        shipping_method TEXT,
        shipped_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        
        platform_type platform_type DEFAULT 'website',
        platform_order_id TEXT,
        platform_data JSONB,
        
        is_invoiced BOOLEAN DEFAULT FALSE,
        needs_attention BOOLEAN DEFAULT FALSE,
        
        items JSONB NOT NULL,
        notes TEXT,
        customer_notes TEXT,
        internal_notes TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create transactions table
    console.log('Creating ecommerce_transactions table if it doesn\'t exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ecommerce_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        order_id UUID NOT NULL,
        transaction_type transaction_type NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL,
        status payment_status DEFAULT 'pending' NOT NULL,
        payment_method payment_method,
        
        transaction_id TEXT,
        transaction_reference TEXT,
        authorization_code TEXT,
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        card_last_4 TEXT,
        card_type TEXT,
        card_expiry_month INTEGER,
        card_expiry_year INTEGER,
        
        gateway_name TEXT,
        gateway_response JSONB,
        gateway_fee NUMERIC,
        
        parent_transaction_id UUID,
        
        notes TEXT,
        metadata JSONB,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create indexes
    console.log('Creating indexes for orders and transactions tables...');
    
    // Order indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_company_id_idx ON ecommerce_orders (company_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_customer_id_idx ON ecommerce_orders (customer_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_order_number_idx ON ecommerce_orders (order_number);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_order_date_idx ON ecommerce_orders (order_date);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_status_idx ON ecommerce_orders (status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_payment_status_idx ON ecommerce_orders (payment_status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_orders_platform_type_idx ON ecommerce_orders (platform_type);`);
    
    // Unique constraint for order numbers per company
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'unique_order_number_company'
        ) THEN
          ALTER TABLE ecommerce_orders 
          ADD CONSTRAINT unique_order_number_company 
          UNIQUE (company_id, order_number);
        END IF;
      END $$;
    `);
    
    // Transaction indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_transactions_company_id_idx ON ecommerce_transactions (company_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_transactions_order_id_idx ON ecommerce_transactions (order_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_transactions_type_idx ON ecommerce_transactions (transaction_type);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_transactions_status_idx ON ecommerce_transactions (status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ecommerce_transactions_date_idx ON ecommerce_transactions (transaction_date);`);
    
    // Foreign key from transactions to orders
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'ecommerce_transactions_order_id_fkey'
        ) THEN
          ALTER TABLE ecommerce_transactions 
          ADD CONSTRAINT ecommerce_transactions_order_id_fkey 
          FOREIGN KEY (order_id) REFERENCES ecommerce_orders (id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    
    console.log('✅ E-commerce schema migration completed successfully.');
    return true;
  } catch (error) {
    console.error('❌ E-commerce schema migration failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run migration
migrateEcommerceSchema()
  .then(() => {
    console.log('✅ Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });