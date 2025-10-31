import { sql } from 'drizzle-orm';

/**
 * Migration: Create AC_accounting_ledger_lines table
 * 
 * Creates the accounting ledger lines table (detail lines for double-entry accounting).
 * Each ledger entry has multiple lines representing debits and credits.
 * 
 * Features:
 * - RAS (Romanian Accounting Standards) account structure
 * - Double-entry accounting (debit/credit separation)
 * - Multi-currency support
 * - Analytical dimensions (department, project, cost center)
 * - VAT tracking per line
 * - Item linking (inventory products/services)
 * - Partner tracking (customers/suppliers)
 * - Reconciliation support
 */

export const up = async (db: any) => {
  console.log('📊 Creating AC_accounting_ledger_lines table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_accounting_ledger_lines" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      ledger_entry_id uuid NOT NULL,
      company_id uuid NOT NULL,
      
      -- Line details
      line_number integer NOT NULL,
      description varchar(500),
      
      -- Account structure (RAS)
      account_class integer NOT NULL,
      account_group integer NOT NULL,
      account_number varchar(20) NOT NULL,
      account_sub_number varchar(20),
      full_account_number varchar(50) NOT NULL,
      
      -- Amounts
      amount numeric(19,4) NOT NULL,
      debit_amount numeric(19,4) NOT NULL DEFAULT 0,
      credit_amount numeric(19,4) NOT NULL DEFAULT 0,
      
      -- Currency
      currency varchar(3) NOT NULL DEFAULT 'RON',
      original_amount numeric(19,4),
      exchange_rate numeric(19,6) NOT NULL DEFAULT 1,
      
      -- Analytical dimensions
      department_id uuid,
      project_id uuid,
      cost_center_id uuid,
      
      -- VAT
      vat_code varchar(20),
      vat_percentage numeric(5,2),
      vat_amount numeric(19,4),
      
      -- Item linking
      item_type varchar(50),
      item_id uuid,
      item_quantity numeric(19,4),
      item_unit_price numeric(19,4),
      
      -- Partner tracking
      partner_id uuid,
      partner_type varchar(20),
      due_date date,
      
      -- Polymorphic reference
      reference_id uuid,
      reference_table varchar(100),
      
      -- Reconciliation
      is_reconciled boolean NOT NULL DEFAULT false,
      reconciliation_id uuid,
      reconciled_at timestamp,
      reconciled_by uuid,
      
      -- Metadata
      metadata jsonb,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp
    );
  `);

  console.log('🔗 Creating foreign key to AC_accounting_ledger_entries...');
  await db.execute(sql`
    ALTER TABLE "AC_accounting_ledger_lines"
    ADD CONSTRAINT "AC_accounting_ledger_lines_ledger_entry_id_fkey"
    FOREIGN KEY (ledger_entry_id) REFERENCES "AC_accounting_ledger_entries"(id)
    ON DELETE CASCADE;
  `);

  console.log('🔄 Creating indexes for AC_accounting_ledger_lines...');
  
  // Entry index (CRITICAL for performance!)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_entry_idx" 
    ON "AC_accounting_ledger_lines" (ledger_entry_id);
  `);

  // Account index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_account_idx" 
    ON "AC_accounting_ledger_lines" (company_id, full_account_number);
  `);

  // Class/Group index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_class_group_idx" 
    ON "AC_accounting_ledger_lines" (company_id, account_class, account_group);
  `);

  // Analytical dimensions index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_dimension_idx" 
    ON "AC_accounting_ledger_lines" (company_id, department_id, project_id, cost_center_id);
  `);

  // Partner index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_partner_idx" 
    ON "AC_accounting_ledger_lines" (company_id, partner_type, partner_id);
  `);

  // Item index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_item_idx" 
    ON "AC_accounting_ledger_lines" (item_type, item_id);
  `);

  // Reference index (polymorphic)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_reference_idx" 
    ON "AC_accounting_ledger_lines" (reference_table, reference_id);
  `);

  // Reconciliation index
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_ledger_line_reconciliation_idx" 
    ON "AC_accounting_ledger_lines" (is_reconciled, company_id)
    WHERE is_reconciled = false;
  `);

  console.log('✅ AC_accounting_ledger_lines table created successfully!');
};

export const down = async (db: any) => {
  console.log('🗑️  Dropping AC_accounting_ledger_lines table...');
  
  await db.execute(sql`
    DROP TABLE IF EXISTS "AC_accounting_ledger_lines" CASCADE;
  `);
  
  console.log('✅ AC_accounting_ledger_lines table dropped!');
};

