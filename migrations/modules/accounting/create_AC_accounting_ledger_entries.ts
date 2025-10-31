import { sql } from 'drizzle-orm';

/**
 * Migration: Create AC_accounting_ledger_entries table
 * 
 * Creates the main accounting ledger entries table with full RAS compliance.
 * This table stores the header of accounting notes (journal entries).
 * 
 * Features:
 * - Double-entry accounting support
 * - Multi-currency with exchange rates
 * - Multi-franchise support
 * - Complete audit trail (created, updated, posted, reversed)
 * - Reversal system for corrections
 * - Workflow support (draft → posted)
 * - Polymorphic references to source documents
 */

export const up = async (db: any) => {
  console.log('📊 Creating AC_accounting_ledger_entries table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_accounting_ledger_entries" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      company_id uuid NOT NULL,
      franchise_id uuid,
      
      -- Journal Type
      journal_type_id uuid,
      
      -- Dates
      transaction_date timestamp NOT NULL DEFAULT now(),
      posting_date timestamp NOT NULL DEFAULT now(),
      document_date date NOT NULL,
      
      -- Document info
      type varchar(50) NOT NULL,
      document_number varchar(100),
      document_type varchar(50),
      reference_id uuid,
      reference_table varchar(100),
      
      -- Content
      description varchar(500),
      notes text,
      
      -- Status flags
      is_posted boolean NOT NULL DEFAULT false,
      is_draft boolean NOT NULL DEFAULT true,
      is_system_generated boolean NOT NULL DEFAULT false,
      
      -- Amounts
      total_amount numeric(19,4) NOT NULL,
      total_debit numeric(19,4) NOT NULL,
      total_credit numeric(19,4) NOT NULL,
      
      -- Currency
      currency varchar(3) NOT NULL DEFAULT 'RON',
      exchange_rate numeric(19,6) NOT NULL DEFAULT 1,
      exchange_rate_date date,
      
      -- Fiscal period
      fiscal_year integer NOT NULL,
      fiscal_month integer NOT NULL,
      
      -- Audit trail
      created_by uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_by uuid,
      updated_at timestamp,
      posted_by uuid,
      posted_at timestamp,
      reversed_by uuid,
      reversed_at timestamp,
      
      -- Reversal info
      is_reversal boolean NOT NULL DEFAULT false,
      original_entry_id uuid,
      reversal_entry_id uuid,
      reversal_reason varchar(500),
      
      -- Metadata
      metadata jsonb
    );
  `);

  console.log('🔄 Creating indexes for AC_accounting_ledger_entries...');
  
  // Primary index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_primary_idx" 
    ON "AC_accounting_ledger_entries" (company_id, fiscal_year, fiscal_month, transaction_date);
  `);

  // Posted status index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_is_posted_idx" 
    ON "AC_accounting_ledger_entries" (company_id, is_posted, transaction_date);
  `);

  // Type index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_type_idx" 
    ON "AC_accounting_ledger_entries" (company_id, type, transaction_date);
  `);

  // Reference index (polymorphic)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_reference_idx" 
    ON "AC_accounting_ledger_entries" (reference_table, reference_id);
  `);

  // Document index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_document_idx" 
    ON "AC_accounting_ledger_entries" (company_id, document_type, document_number);
  `);

  // Franchise index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_franchise_idx" 
    ON "AC_accounting_ledger_entries" (franchise_id, fiscal_year, fiscal_month);
  `);

  // Unique constraint for document numbers
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "AC_ledger_document_unique" 
    ON "AC_accounting_ledger_entries" (company_id, document_type, document_number)
    WHERE document_number IS NOT NULL AND document_type IS NOT NULL;
  `);

  console.log('🔗 Creating self-referencing foreign key for reversals...');
  await db.execute(sql`
    ALTER TABLE "AC_accounting_ledger_entries"
    ADD CONSTRAINT "AC_accounting_ledger_entries_reversal_entry_id_fkey"
    FOREIGN KEY (reversal_entry_id) REFERENCES "AC_accounting_ledger_entries"(id);
  `);

  console.log('✅ AC_accounting_ledger_entries table created successfully!');
};

export const down = async (db: any) => {
  console.log('🗑️  Dropping AC_accounting_ledger_entries table...');
  
  await db.execute(sql`
    DROP TABLE IF EXISTS "AC_accounting_ledger_entries" CASCADE;
  `);
  
  console.log('✅ AC_accounting_ledger_entries table dropped!');
};

