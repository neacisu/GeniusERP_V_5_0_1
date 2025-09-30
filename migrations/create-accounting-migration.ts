/**
 * Accounting Schema Migration Script
 * 
 * This script applies the Romanian double-entry accounting schema to the database.
 * It creates tables for ledger entries, ledger lines, journal types and account balances
 * following the Romanian accounting standards.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';
import 'dotenv/config';

/**
 * Direct migration function that creates accounting tables
 */
async function directMigrate() {
  console.log('Starting direct migration for accounting schema...');
  
  // Connect to the database
  const connectionString = process.env.DATABASE_URL as string;
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // Get a raw SQL client for direct schema operations
  const sql = client;

  try {
    // Create ledger_entries table
    console.log('Creating accounting_ledger_entries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS accounting_ledger_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        
        transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
        posting_date TIMESTAMP NOT NULL DEFAULT NOW(),
        document_date DATE NOT NULL,
        
        type VARCHAR(50) NOT NULL,
        document_number VARCHAR(100),
        document_type VARCHAR(50),
        reference_id UUID,
        reference_table VARCHAR(100),
        
        description VARCHAR(500),
        notes TEXT,
        
        is_posted BOOLEAN NOT NULL DEFAULT FALSE,
        is_draft BOOLEAN NOT NULL DEFAULT TRUE,
        is_system_generated BOOLEAN NOT NULL DEFAULT FALSE,
        
        total_amount DECIMAL(19, 4) NOT NULL,
        total_debit DECIMAL(19, 4) NOT NULL,
        total_credit DECIMAL(19, 4) NOT NULL,
        
        currency VARCHAR(3) NOT NULL DEFAULT 'RON',
        exchange_rate DECIMAL(19, 6) NOT NULL DEFAULT 1,
        exchange_rate_date DATE,
        
        fiscal_year INTEGER NOT NULL,
        fiscal_month INTEGER NOT NULL,
        
        created_by UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_by UUID,
        updated_at TIMESTAMP,
        posted_by UUID,
        posted_at TIMESTAMP,
        reversed_by UUID,
        reversed_at TIMESTAMP,
        
        is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
        original_entry_id UUID,
        reversal_reason VARCHAR(500),
        
        metadata JSONB
      );
    `;

    // Create indexes on ledger_entries
    console.log('Creating indexes for accounting_ledger_entries...');
    await sql`CREATE INDEX IF NOT EXISTS ledger_primary_idx ON accounting_ledger_entries (company_id, fiscal_year, fiscal_month, transaction_date)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_document_idx ON accounting_ledger_entries (company_id, document_type, document_number)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_type_idx ON accounting_ledger_entries (company_id, type, transaction_date)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_reference_idx ON accounting_ledger_entries (reference_table, reference_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_franchise_idx ON accounting_ledger_entries (franchise_id, fiscal_year, fiscal_month)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_is_posted_idx ON accounting_ledger_entries (company_id, is_posted, transaction_date)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS ledger_document_unique ON accounting_ledger_entries (company_id, document_type, document_number) WHERE document_number IS NOT NULL AND document_type IS NOT NULL`;

    // Create ledger_lines table
    console.log('Creating accounting_ledger_lines table...');
    await sql`
      CREATE TABLE IF NOT EXISTS accounting_ledger_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ledger_entry_id UUID NOT NULL REFERENCES accounting_ledger_entries(id),
        company_id UUID NOT NULL,
        
        line_number INTEGER NOT NULL,
        description VARCHAR(500),
        
        account_class INTEGER NOT NULL,
        account_group INTEGER NOT NULL,
        account_number VARCHAR(20) NOT NULL,
        account_sub_number VARCHAR(20),
        
        full_account_number VARCHAR(50) NOT NULL,
        
        amount DECIMAL(19, 4) NOT NULL,
        debit_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
        credit_amount DECIMAL(19, 4) NOT NULL DEFAULT 0,
        
        currency VARCHAR(3) NOT NULL DEFAULT 'RON',
        original_amount DECIMAL(19, 4),
        exchange_rate DECIMAL(19, 6) NOT NULL DEFAULT 1,
        
        department_id UUID,
        project_id UUID,
        cost_center_id UUID,
        
        vat_code VARCHAR(20),
        vat_percentage DECIMAL(5, 2),
        vat_amount DECIMAL(19, 4),
        
        item_type VARCHAR(50),
        item_id UUID,
        item_quantity DECIMAL(19, 4),
        item_unit_price DECIMAL(19, 4),
        
        partner_id UUID,
        partner_type VARCHAR(20),
        
        due_date DATE,
        
        reference_id UUID,
        reference_table VARCHAR(100),
        
        is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
        reconciliation_id UUID,
        reconciled_at TIMESTAMP,
        reconciled_by UUID,
        
        metadata JSONB,
        
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `;

    // Create indexes on ledger_lines
    console.log('Creating indexes for accounting_ledger_lines...');
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_entry_idx ON accounting_ledger_lines (ledger_entry_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_account_idx ON accounting_ledger_lines (company_id, full_account_number)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_class_group_idx ON accounting_ledger_lines (company_id, account_class, account_group)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_partner_idx ON accounting_ledger_lines (company_id, partner_type, partner_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_dimension_idx ON accounting_ledger_lines (company_id, department_id, project_id, cost_center_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_item_idx ON accounting_ledger_lines (item_type, item_id)`;
    await sql`CREATE INDEX IF NOT EXISTS ledger_line_reference_idx ON accounting_ledger_lines (reference_table, reference_id)`;

    // Create journal_types table
    console.log('Creating accounting_journal_types table...');
    await sql`
      CREATE TABLE IF NOT EXISTS accounting_journal_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        
        code VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        
        default_debit_account VARCHAR(20),
        default_credit_account VARCHAR(20),
        is_system_journal BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        
        auto_number_prefix VARCHAR(20),
        last_used_number INTEGER NOT NULL DEFAULT 0,
        
        created_by UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_by UUID,
        updated_at TIMESTAMP
      );
    `;

    // Create indexes on journal_types
    console.log('Creating indexes for accounting_journal_types...');
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS journal_code_unique ON accounting_journal_types (company_id, code)`;
    await sql`CREATE INDEX IF NOT EXISTS journal_active_idx ON accounting_journal_types (company_id, is_active)`;

    // Create account_balances table
    console.log('Creating accounting_account_balances table...');
    await sql`
      CREATE TABLE IF NOT EXISTS accounting_account_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        
        account_class INTEGER NOT NULL,
        account_group INTEGER NOT NULL,
        account_number VARCHAR(20) NOT NULL,
        account_sub_number VARCHAR(20),
        full_account_number VARCHAR(50) NOT NULL,
        
        fiscal_year INTEGER NOT NULL,
        fiscal_month INTEGER NOT NULL,
        
        opening_debit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        opening_credit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        period_debit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        period_credit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        closing_debit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        closing_credit DECIMAL(19, 4) NOT NULL DEFAULT 0,
        
        currency VARCHAR(3) NOT NULL DEFAULT 'RON',
        currency_closing_debit DECIMAL(19, 4) DEFAULT 0,
        currency_closing_credit DECIMAL(19, 4) DEFAULT 0,
        
        last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // Create indexes on account_balances
    console.log('Creating indexes for accounting_account_balances...');
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS account_balance_unique ON accounting_account_balances (
      company_id, 
      COALESCE(franchise_id, '00000000-0000-0000-0000-000000000000'), 
      full_account_number, 
      fiscal_year, 
      fiscal_month, 
      currency
    )`;
    await sql`CREATE INDEX IF NOT EXISTS account_balance_main_idx ON accounting_account_balances (company_id, fiscal_year, fiscal_month)`;
    await sql`CREATE INDEX IF NOT EXISTS account_balance_account_idx ON accounting_account_balances (company_id, account_class, account_group)`;
    await sql`CREATE INDEX IF NOT EXISTS account_balance_franchise_idx ON accounting_account_balances (franchise_id, fiscal_year, fiscal_month)`;

    console.log('Accounting schema migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    // Close database connection
    await client.end();
  }
}

// Run the migration
directMigrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });