/**
 * Migration: Create AC_account_balances table
 *
 * This migration creates the AC_account_balances table which stores
 * running balances for each account in the accounting system.
 *
 * 📁 LOCAȚIE CORECTĂ: /migrations/modules/accounting/
 * 🏷️  PREFIX: AC_ (Accounting Configuration)
 *
 * Table Purpose:
 * - Track monthly balances for each account
 * - Store opening, period movements, and closing balances
 * - Support Romanian Accounting Standards (RAS)
 * - Enable balance sheet and trial balance reports
 *
 * Relations:
 * - account_id -> accounts.id (required)
 * - company_id -> companies.id (required)
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_account_balances table...');

  // Create the AC_account_balances table
  await sql`
    CREATE TABLE IF NOT EXISTS "AC_account_balances" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id uuid NOT NULL,
      company_id uuid NOT NULL,
      fiscal_year integer NOT NULL,
      fiscal_month integer NOT NULL,
      opening_debit numeric(15, 2) NOT NULL DEFAULT '0',
      opening_credit numeric(15, 2) NOT NULL DEFAULT '0',
      period_debit numeric(15, 2) NOT NULL DEFAULT '0',
      period_credit numeric(15, 2) NOT NULL DEFAULT '0',
      closing_debit numeric(15, 2) NOT NULL DEFAULT '0',
      closing_credit numeric(15, 2) NOT NULL DEFAULT '0',
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),

      -- Foreign key constraints
      CONSTRAINT "AC_account_balances_account_id_fkey"
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      CONSTRAINT "AC_account_balances_company_id_fkey"
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,

      -- Unique constraint per account, company, year, month
      CONSTRAINT "AC_account_balances_unique_key"
        UNIQUE (account_id, company_id, fiscal_year, fiscal_month)
    );
  `;

  // Create indexes for performance
  await sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_account_balances_account"
    ON "AC_account_balances" (account_id);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_account_balances_company"
    ON "AC_account_balances" (company_id);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_account_balances_period"
    ON "AC_account_balances" (company_id, fiscal_year, fiscal_month);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_account_balances_lookup"
    ON "AC_account_balances" (account_id, fiscal_year, fiscal_month);
  `;

  console.log('✅ AC_account_balances table created successfully');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back AC_account_balances table...');

  // Drop indexes first
  await sql`DROP INDEX IF EXISTS "idx_AC_account_balances_lookup";`;
  await sql`DROP INDEX IF EXISTS "idx_AC_account_balances_period";`;
  await sql`DROP INDEX IF EXISTS "idx_AC_account_balances_company";`;
  await sql`DROP INDEX IF EXISTS "idx_AC_account_balances_account";`;

  // Drop the table
  await sql`DROP TABLE IF EXISTS "AC_account_balances";`;

  console.log('✅ AC_account_balances table rolled back');
};
