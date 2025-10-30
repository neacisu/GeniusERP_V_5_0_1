/**
 * Inventory Schema Migration Script
 * 
 * This script applies the Romanian inventory management schema to the database.
 * It creates tables for warehouses (gestiune), inventory stock, NIR documents,
 * transfers between warehouses, and purchase orders.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🔄 Starting Romanian inventory schema migration...');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  // Connect to the database
  const queryClient = postgres(databaseUrl);
  const db = drizzle(queryClient, { schema });
  
  try {
    console.log('🔍 Connected to database, checking for existing schema...');
    
    // Check if the warehouses table already exists
    const tableExists = await queryClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'warehouses'
      );
    `;
    
    if (tableExists[0]?.exists) {
      console.log('⚠️ Warehouses table already exists. Migration might have been applied before.');
      const confirmRun = process.argv.includes('--force');
      
      if (!confirmRun) {
        console.log('🛑 Migration aborted. Use --force flag to apply migration anyway.');
        process.exit(0);
      }
      
      console.log('⚠️ Force flag detected. Proceeding with migration despite existing tables.');
    }
    
    console.log('📦 Creating Romanian inventory schema tables...');
    
    // Create enum types one by one
    await queryClient.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gestiune_type') THEN
          CREATE TYPE gestiune_type AS ENUM ('depozit', 'magazin', 'custodie', 'transfer');
        END IF;
      END
      $$;
    `);

    await queryClient.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nir_status') THEN
          CREATE TYPE nir_status AS ENUM ('draft', 'approved', 'canceled', 'completed');
        END IF;
      END
      $$;
    `);

    await queryClient.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status') THEN
          CREATE TYPE transfer_status AS ENUM ('draft', 'in_transit', 'partially_received', 'received', 'canceled');
        END IF;
      END
      $$;
    `);

    await queryClient.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'po_status') THEN
          CREATE TYPE po_status AS ENUM ('draft', 'pending', 'approved', 'received', 'partially_received', 'canceled');
        END IF;
      END
      $$;
    `);
    
    console.log('✅ Created enum types for Romanian inventory schema');
    
    // Create warehouses (gestiune) table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL,
        location VARCHAR(150),
        address TEXT,
        type gestiune_type NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS warehouse_company_idx ON warehouses(company_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS warehouse_franchise_idx ON warehouses(franchise_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS warehouse_type_idx ON warehouses(type);`);
    
    console.log('✅ Created warehouses (gestiune) table');
    
    // Create stocks table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS stocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        product_id UUID NOT NULL,
        warehouse_id UUID NOT NULL,
        quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
        quantity_reserved NUMERIC(15, 3) DEFAULT 0,
        batch_no VARCHAR(50),
        expiry_date DATE,
        purchase_price NUMERIC(15, 2) DEFAULT 0,
        selling_price NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS stock_product_idx ON stocks(product_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS stock_warehouse_idx ON stocks(warehouse_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS stock_company_idx ON stocks(company_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS stock_franchise_idx ON stocks(franchise_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS stock_batch_idx ON stocks(batch_no);`);
    
    console.log('✅ Created stocks table');
    
    // Create NIR documents table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS nir_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        nir_number VARCHAR(50) NOT NULL,
        supplier_invoice_number VARCHAR(50),
        supplier_id UUID NOT NULL,
        warehouse_id UUID NOT NULL,
        warehouse_type gestiune_type NOT NULL,
        is_custody BOOLEAN DEFAULT FALSE,
        status nir_status DEFAULT 'draft',
        receipt_date TIMESTAMP DEFAULT NOW() NOT NULL,
        approved_by UUID,
        approved_at TIMESTAMP,
        notes TEXT,
        total_value_no_vat NUMERIC(15, 2) DEFAULT 0,
        total_vat NUMERIC(15, 2) DEFAULT 0,
        total_value_with_vat NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_number_idx ON nir_documents(nir_number);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_supplier_idx ON nir_documents(supplier_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_warehouse_idx ON nir_documents(warehouse_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_company_idx ON nir_documents(company_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_franchise_idx ON nir_documents(franchise_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_status_idx ON nir_documents(status);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_type_idx ON nir_documents(warehouse_type);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_date_idx ON nir_documents(receipt_date);`);
    
    console.log('✅ Created NIR documents table');
    
    // Create NIR items table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS nir_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nir_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity NUMERIC(15, 3) NOT NULL,
        batch_no VARCHAR(50),
        expiry_date DATE,
        purchase_price NUMERIC(15, 2) NOT NULL,
        purchase_price_with_vat NUMERIC(15, 2),
        selling_price NUMERIC(15, 2),
        selling_price_with_vat NUMERIC(15, 2),
        vat_rate INTEGER DEFAULT 19,
        vat_value NUMERIC(15, 2) DEFAULT 0,
        total_value_no_vat NUMERIC(15, 2) DEFAULT 0,
        total_value_with_vat NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_item_nir_idx ON nir_items(nir_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS nir_item_product_idx ON nir_items(product_id);`);
    
    console.log('✅ Created NIR items table');
    
    // Create Transfer documents table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS transfer_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        transfer_number VARCHAR(50) NOT NULL,
        source_warehouse_id UUID NOT NULL,
        destination_warehouse_id UUID NOT NULL,
        status transfer_status DEFAULT 'draft',
        transfer_date TIMESTAMP DEFAULT NOW() NOT NULL,
        approved_by UUID,
        approved_at TIMESTAMP,
        received_by UUID,
        received_at TIMESTAMP,
        nir_id UUID,
        notes TEXT,
        total_value NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_number_idx ON transfer_documents(transfer_number);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_source_idx ON transfer_documents(source_warehouse_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_dest_idx ON transfer_documents(destination_warehouse_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_company_idx ON transfer_documents(company_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_franchise_idx ON transfer_documents(franchise_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_status_idx ON transfer_documents(status);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_date_idx ON transfer_documents(transfer_date);`);
    
    console.log('✅ Created transfer documents table');
    
    // Create Transfer items table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS transfer_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transfer_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity NUMERIC(15, 3) NOT NULL,
        quantity_received NUMERIC(15, 3) DEFAULT 0,
        batch_no VARCHAR(50),
        expiry_date DATE,
        unit_value NUMERIC(15, 2) NOT NULL,
        total_value NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_item_transfer_idx ON transfer_items(transfer_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS transfer_item_product_idx ON transfer_items(product_id);`);
    
    console.log('✅ Created transfer items table');
    
    // Create Purchase Orders table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        po_number VARCHAR(50) NOT NULL,
        supplier_id UUID NOT NULL,
        warehouse_id UUID NOT NULL,
        status po_status DEFAULT 'draft',
        is_custody BOOLEAN DEFAULT FALSE,
        expected_date DATE,
        approved_by UUID,
        approved_at TIMESTAMP,
        notes TEXT,
        total_value_no_vat NUMERIC(15, 2) DEFAULT 0,
        total_vat NUMERIC(15, 2) DEFAULT 0,
        total_value_with_vat NUMERIC(15, 2) DEFAULT 0,
        nir_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_number_idx ON purchase_orders(po_number);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_supplier_idx ON purchase_orders(supplier_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_warehouse_idx ON purchase_orders(warehouse_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_company_idx ON purchase_orders(company_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_franchise_idx ON purchase_orders(franchise_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_status_idx ON purchase_orders(status);`);
    
    console.log('✅ Created purchase orders table');
    
    // Create Purchase Order Items table
    await queryClient.unsafe(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity NUMERIC(15, 3) NOT NULL,
        quantity_received NUMERIC(15, 3) DEFAULT 0,
        unit_price NUMERIC(15, 2) NOT NULL,
        vat_rate INTEGER DEFAULT 19,
        vat_value NUMERIC(15, 2) DEFAULT 0,
        total_value_no_vat NUMERIC(15, 2) DEFAULT 0,
        total_value_with_vat NUMERIC(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_item_po_idx ON purchase_order_items(po_id);`);
    await queryClient.unsafe(`CREATE INDEX IF NOT EXISTS po_item_product_idx ON purchase_order_items(product_id);`);
    
    console.log('✅ Created purchase order items table');
    
    // Create foreign key constraints - one by one to avoid errors
    await queryClient.unsafe(`
      ALTER TABLE stocks
        ADD CONSTRAINT stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory_products(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE stocks
        ADD CONSTRAINT stocks_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE nir_items
        ADD CONSTRAINT nir_items_nir_id_fkey FOREIGN KEY (nir_id) REFERENCES nir_documents(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE nir_items
        ADD CONSTRAINT nir_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory_products(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE transfer_items
        ADD CONSTRAINT transfer_items_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES transfer_documents(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE transfer_items
        ADD CONSTRAINT transfer_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory_products(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE purchase_order_items
        ADD CONSTRAINT po_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES purchase_orders(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE purchase_order_items
        ADD CONSTRAINT po_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventory_products(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE transfer_documents
        ADD CONSTRAINT transfer_source_warehouse_fkey FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE transfer_documents
        ADD CONSTRAINT transfer_dest_warehouse_fkey FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE transfer_documents
        ADD CONSTRAINT transfer_nir_fkey FOREIGN KEY (nir_id) REFERENCES nir_documents(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE purchase_orders
        ADD CONSTRAINT po_warehouse_fkey FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
    `);
    
    await queryClient.unsafe(`
      ALTER TABLE purchase_orders
        ADD CONSTRAINT po_nir_fkey FOREIGN KEY (nir_id) REFERENCES nir_documents(id);
    `);
    
    console.log('✅ Created foreign key constraints');
    
    console.log('✅ Romanian inventory schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run the migration
main().catch((err) => {
  console.error('Failed to run migration:', err);
  process.exit(1);
});