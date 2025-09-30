/**
 * E-commerce Carts Schema Migration Script
 * 
 * This script creates the necessary tables for shopping carts including
 * ecommerce_carts and ecommerce_cart_items.
 */

import { getDrizzle } from './server/common/drizzle';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Create the carts and cart items tables
 */
async function createCartsTables() {
  console.log('Creating ecommerce_carts and ecommerce_cart_items tables...');

  try {
    const db = getDrizzle();
    
    // Check if cart_status enum exists
    const [cartStatusExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'cart_status'
      );
    `);
    
    if (!cartStatusExists.exists) {
      console.log('Creating cart_status enum type...');
      await db.execute(sql`
        CREATE TYPE cart_status AS ENUM (
          'active',
          'completed',
          'abandoned',
          'expired'
        );
      `);
    }
    
    // Create ecommerce_carts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ecommerce_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        user_id UUID NOT NULL,
        session_id TEXT,
        status cart_status NOT NULL DEFAULT 'active',
        subtotal NUMERIC NOT NULL DEFAULT '0',
        tax_amount NUMERIC NOT NULL DEFAULT '0',
        discount_amount NUMERIC NOT NULL DEFAULT '0',
        total NUMERIC NOT NULL DEFAULT '0',
        currency_code TEXT NOT NULL DEFAULT 'RON',
        applied_discount_code TEXT,
        expires_at TIMESTAMPTZ,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for ecommerce_carts
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ecommerce_carts_company_id_idx ON ecommerce_carts (company_id);
      CREATE INDEX IF NOT EXISTS ecommerce_carts_user_id_idx ON ecommerce_carts (user_id);
      CREATE INDEX IF NOT EXISTS ecommerce_carts_session_id_idx ON ecommerce_carts (session_id);
      CREATE INDEX IF NOT EXISTS ecommerce_carts_status_idx ON ecommerce_carts (status);
    `);
    
    // Create ecommerce_cart_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ecommerce_cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES ecommerce_carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC NOT NULL,
        total_price NUMERIC NOT NULL,
        name TEXT,
        sku TEXT,
        options JSONB,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes for ecommerce_cart_items
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ecommerce_cart_items_cart_id_idx ON ecommerce_cart_items (cart_id);
      CREATE INDEX IF NOT EXISTS ecommerce_cart_items_product_id_idx ON ecommerce_cart_items (product_id);
    `);
    
    console.log('✅ Cart tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating cart tables:', error);
    throw error;
  }
}

// Run migration
createCartsTables()
  .then(() => {
    console.log('✅ Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });