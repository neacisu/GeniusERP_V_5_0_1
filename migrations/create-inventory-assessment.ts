/**
 * Migration for adding inventory assessment (Inventariere) tables
 * Required for Romanian accounting compliance
 */

import { DrizzleService } from '../server/common/drizzle/drizzle.service';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting inventory assessment migration...');
  const drizzle = new DrizzleService();

  try {
    // Create warehouse type enum
    try {
      await drizzle.executeQuery(`
        CREATE TYPE warehouse_type AS ENUM ('depozit', 'magazin', 'custodie', 'transfer');
      `);
      console.log('✅ Created warehouse_type enum');
    } catch (error) {
      console.log('ℹ️ warehouse_type enum already exists or error:', error.message);
    }

    // Create inventory assessment type enum
    try {
      await drizzle.executeQuery(`
        CREATE TYPE inventory_assessment_type AS ENUM ('annual', 'monthly', 'unscheduled', 'special');
      `);
      console.log('✅ Created inventory_assessment_type enum');
    } catch (error) {
      console.log('ℹ️ inventory_assessment_type enum already exists or error:', error.message);
    }

    // Create inventory assessment status enum
    try {
      await drizzle.executeQuery(`
        CREATE TYPE inventory_assessment_status AS ENUM ('draft', 'in_progress', 'pending_approval', 'approved', 'finalized', 'cancelled');
      `);
      console.log('✅ Created inventory_assessment_status enum');
    } catch (error) {
      console.log('ℹ️ inventory_assessment_status enum already exists or error:', error.message);
    }

    // Create inventory valuation method enum
    try {
      await drizzle.executeQuery(`
        CREATE TYPE inventory_valuation_method AS ENUM ('FIFO', 'LIFO', 'weighted_average', 'standard_cost');
      `);
      console.log('✅ Created inventory_valuation_method enum');
    } catch (error) {
      console.log('ℹ️ inventory_valuation_method enum already exists or error:', error.message);
    }

    // Create inventory count result enum
    try {
      await drizzle.executeQuery(`
        CREATE TYPE inventory_count_result AS ENUM ('match', 'surplus', 'deficit');
      `);
      console.log('✅ Created inventory_count_result enum');
    } catch (error) {
      console.log('ℹ️ inventory_count_result enum already exists or error:', error.message);
    }

    // Create inventory_warehouses table
    await drizzle.executeQuery(`
      CREATE TABLE IF NOT EXISTS inventory_warehouses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        name TEXT NOT NULL,
        code TEXT,
        location TEXT,
        address TEXT,
        type warehouse_type NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS warehouse_name_idx ON inventory_warehouses (name);
      CREATE INDEX IF NOT EXISTS warehouse_company_idx ON inventory_warehouses (company_id);
      CREATE INDEX IF NOT EXISTS warehouse_code_idx ON inventory_warehouses (code);
    `);
    console.log('✅ Created inventory_warehouses table');

    // Create inventory_assessments table
    await drizzle.executeQuery(`
      CREATE TABLE IF NOT EXISTS inventory_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        assessment_number TEXT NOT NULL,
        assessment_type inventory_assessment_type NOT NULL,
        warehouse_id UUID NOT NULL,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE,
        status inventory_assessment_status NOT NULL DEFAULT 'draft',
        commission_order_number TEXT,
        approved_by UUID,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_warehouse
          FOREIGN KEY (warehouse_id)
          REFERENCES inventory_warehouses (id)
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS warehouse_assessment_idx ON inventory_assessments (warehouse_id);
      CREATE INDEX IF NOT EXISTS company_assessment_idx ON inventory_assessments (company_id);
      CREATE INDEX IF NOT EXISTS assessment_date_idx ON inventory_assessments (start_date);
    `);
    console.log('✅ Created inventory_assessments table');

    // Create inventory_assessment_items table
    await drizzle.executeQuery(`
      CREATE TABLE IF NOT EXISTS inventory_assessment_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID NOT NULL,
        product_id UUID NOT NULL,
        accounting_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        actual_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        batch_no TEXT,
        expiry_date DATE,
        valuation_method inventory_valuation_method NOT NULL,
        accounting_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        actual_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        difference_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        difference_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        result_type inventory_count_result NOT NULL,
        is_processed BOOLEAN NOT NULL DEFAULT false,
        counted_by UUID,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_assessment
          FOREIGN KEY (assessment_id)
          REFERENCES inventory_assessments (id)
          ON DELETE CASCADE,
          
        CONSTRAINT fk_product
          FOREIGN KEY (product_id)
          REFERENCES inventory_products (id)
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS assessment_items_idx ON inventory_assessment_items (assessment_id);
      CREATE INDEX IF NOT EXISTS assessment_product_idx ON inventory_assessment_items (product_id);
    `);
    console.log('✅ Created inventory_assessment_items table');

    // Create inventory_valuations table
    await drizzle.executeQuery(`
      CREATE TABLE IF NOT EXISTS inventory_valuations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        warehouse_id UUID NOT NULL,
        company_id UUID NOT NULL,
        franchise_id UUID,
        valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
        valuation_method inventory_valuation_method NOT NULL,
        total_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        last_purchase_price NUMERIC(10, 2),
        last_valuation_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_product
          FOREIGN KEY (product_id)
          REFERENCES inventory_products (id)
          ON DELETE CASCADE,
          
        CONSTRAINT fk_warehouse
          FOREIGN KEY (warehouse_id)
          REFERENCES inventory_warehouses (id)
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS valuation_product_idx ON inventory_valuations (product_id);
      CREATE INDEX IF NOT EXISTS valuation_warehouse_idx ON inventory_valuations (warehouse_id);
      CREATE INDEX IF NOT EXISTS valuation_date_idx ON inventory_valuations (valuation_date);
    `);
    console.log('✅ Created inventory_valuations table');

    // Create inventory_batches table
    await drizzle.executeQuery(`
      CREATE TABLE IF NOT EXISTS inventory_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL,
        warehouse_id UUID NOT NULL,
        batch_no TEXT NOT NULL,
        purchase_date DATE NOT NULL,
        expiry_date DATE,
        initial_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        remaining_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        nir_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT fk_product
          FOREIGN KEY (product_id)
          REFERENCES inventory_products (id)
          ON DELETE CASCADE,
          
        CONSTRAINT fk_warehouse
          FOREIGN KEY (warehouse_id)
          REFERENCES inventory_warehouses (id)
          ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS batch_product_idx ON inventory_batches (product_id);
      CREATE INDEX IF NOT EXISTS batch_warehouse_idx ON inventory_batches (warehouse_id);
      CREATE INDEX IF NOT EXISTS batch_no_idx ON inventory_batches (batch_no);
      CREATE INDEX IF NOT EXISTS batch_purchase_date_idx ON inventory_batches (purchase_date);
    `);
    console.log('✅ Created inventory_batches table');

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
  }
}

main().catch((error) => {
  console.error('❌ Migration failed with error:', error);
  process.exit(1);
});