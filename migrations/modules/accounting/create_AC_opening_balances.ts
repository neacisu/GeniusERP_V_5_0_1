/**
 * Migration: Create AC_opening_balances table
 *
 * This migration creates the AC_opening_balances table which stores
 * opening balances for accounts when migrating from another system.
 *
 * 📁 LOCAȚIE: /migrations/modules/accounting/
 * 🏷️  PREFIX: AC_ (Accounting Configuration)
 *
 * Table Purpose:
 * - Store initial account balances when migrating to GeniusERP
 * - Track import source and validation status
 * - Support multiple fiscal years for historical data
 * - Enable validation workflow before final import
 *
 * Relations:
 * - company_id → companies.id (ON DELETE CASCADE)
 * - validated_by → users.id (user who validated balances)
 * - created_by → users.id (user who imported balances)
 *
 * Key Features:
 * - UNIQUE constraint on (company_id, account_code, fiscal_year)
 * - Debit and credit balances with precision 15,2
 * - Validation workflow (is_validated, validated_at, validated_by)
 * - Import tracking (import_date, import_source)
 * - Support for multiple import sources (MANUAL, CSV, EXCEL, API)
 *
 * Migration ID: create_AC_opening_balances
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_opening_balances table...');

  // Create the AC_opening_balances table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_opening_balances" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      
      -- Account information
      account_code text NOT NULL,
      account_name text NOT NULL,
      
      -- Opening balances
      debit_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
      credit_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
      
      -- Metadata
      fiscal_year integer NOT NULL,
      import_date date DEFAULT CURRENT_DATE NOT NULL, -- ✅ FIXED: date type matches DB
      import_source text, -- MANUAL, CSV, EXCEL, API
      
      -- Validation workflow
      is_validated boolean DEFAULT false NOT NULL,
      validated_at timestamp without time zone,
      validated_by uuid,
      
      -- Audit trail
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      created_by uuid,
      
      -- Foreign key constraints
      CONSTRAINT "AC_opening_balances_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_opening_balances_validated_by_fkey" 
        FOREIGN KEY (validated_by) REFERENCES users(id),
      CONSTRAINT "AC_opening_balances_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES users(id),
      
      -- Unique constraint: one balance per account per fiscal year per company
      CONSTRAINT "AC_opening_balances_unique"
        UNIQUE (company_id, account_code, fiscal_year),
      
      -- Check constraints (based on real DB structure)
      CONSTRAINT "AC_opening_balances_check"
        CHECK (
          (debit_balance > 0 AND credit_balance = 0) OR 
          (debit_balance = 0 AND credit_balance > 0) OR 
          (debit_balance = 0 AND credit_balance = 0)
        ),
      CONSTRAINT "AC_opening_balances_debit_balance_check" CHECK (debit_balance >= 0),
      CONSTRAINT "AC_opening_balances_credit_balance_check" CHECK (credit_balance >= 0),
      CONSTRAINT "AC_opening_balances_fiscal_year_check" CHECK (fiscal_year >= 2000 AND fiscal_year <= 2100),
      CONSTRAINT "AC_opening_balances_import_source_check" 
        CHECK (import_source = ANY (ARRAY['MANUAL'::text, 'CSV'::text, 'EXCEL'::text, 'API'::text]))
    );
  `);

  // Create indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_opening_balances_company_id"
    ON "AC_opening_balances" (company_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_opening_balances_fiscal_year"
    ON "AC_opening_balances" (fiscal_year);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_opening_balances_account_code"
    ON "AC_opening_balances" (account_code);
  `);

  // Create partial index for validated balances only
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_opening_balances_validated"
    ON "AC_opening_balances" (is_validated)
    WHERE is_validated = true;
  `);

  console.log('✅ AC_opening_balances table created successfully');
  console.log('📝 Note: Supports multiple fiscal years per company');
  console.log('✅ Validation workflow enabled');
  console.log('✅ Check constraints ensure debit XOR credit (not both)');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back AC_opening_balances table...');

  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_opening_balances_company_id";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_opening_balances_fiscal_year";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_opening_balances_account_code";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_opening_balances_validated";`);

  // Drop the table
  await db.execute(sql`DROP TABLE IF EXISTS "AC_opening_balances";`);

  console.log('✅ AC_opening_balances table rolled back');
};

/**
 * IMPORTANT NOTES FOR PRODUCTION:
 * 
 * 1. ⚠️ This table already exists in production with name "opening_balances"
 *    DO NOT run this migration on production without proper backup!
 * 
 * 2. For production rename, use separate migration with:
 *    ALTER TABLE opening_balances RENAME TO AC_opening_balances;
 * 
 * 3. Import Sources:
 *    - MANUAL: Manually entered by user
 *    - CSV: Imported from CSV file
 *    - EXCEL: Imported from Excel file
 *    - API: Imported via API integration
 * 
 * 4. Validation Workflow:
 *    - Opening balances should be validated before being used
 *    - Validation ensures debit total = credit total (balanced)
 *    - Only validated balances should be used for reporting
 * 
 * 5. Multiple Fiscal Years:
 *    - Table supports historical balances for multiple years
 *    - UNIQUE constraint prevents duplicate balances per account/year
 *    - Useful for comparative reports and historical analysis
 * 
 * 6. Balance Validation Algorithm:
 *    - Total debit must equal total credit for all accounts
 *    - Each account should have either debit OR credit (not both)
 *    - Balances must be non-negative
 */

