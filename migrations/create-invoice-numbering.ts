/**
 * Invoice Numbering Migration Script
 * 
 * Creates the invoice_numbering_settings table for Romanian-compliant invoice numbering.
 */

import { DrizzleService } from '../server/common/drizzle/drizzle.service';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Create invoice numbering settings table
 */
async function createInvoiceNumberingTable() {
  const drizzle = new DrizzleService();

  console.log('Creating invoice_numbering_settings table...');

  try {
    // Create the table with SQL to ensure it works correctly
    await drizzle.execute(`
      CREATE TABLE IF NOT EXISTS invoice_numbering_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        series VARCHAR(10) NOT NULL,
        description VARCHAR(100),
        last_number INTEGER NOT NULL DEFAULT 0,
        next_number INTEGER NOT NULL DEFAULT 1,
        prefix VARCHAR(10),
        suffix VARCHAR(10),
        year INTEGER,
        warehouse_id UUID,
        franchise_id UUID,
        is_default BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_by UUID,
        
        UNIQUE (company_id, series),
        CONSTRAINT fk_company
          FOREIGN KEY (company_id)
          REFERENCES companies(id)
          ON DELETE CASCADE
      );
    `);

    // Create an index for faster lookups
    await drizzle.execute(`
      CREATE INDEX IF NOT EXISTS idx_invoice_numbering_settings_company_id
      ON invoice_numbering_settings(company_id);
    `);

    // Add a table comment
    await drizzle.execute(`
      COMMENT ON TABLE invoice_numbering_settings IS 'Stores invoice numbering series and settings for companies';
    `);

    console.log('Invoice numbering settings table created successfully!');
  } catch (error) {
    console.error('Error creating invoice numbering settings table:', error);
    throw error;
  }
}

// Run the migration
createInvoiceNumberingTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });