/**
 * Migration: Create AC_accounting_account_balances table
 *
 * This migration creates the AC_accounting_account_balances table which stores
 * monthly aggregated balances for each accounting account with full RAS structure.
 *
 * 📁 LOCAȚIE CORECTĂ: /migrations/modules/accounting/
 * 🏷️  PREFIX: AC_ (Accounting Configuration)
 * 🏷️  NUME TABEL: AC_accounting_account_balances (versiune completă RAS)
 *
 * NOTE: 
 * - AC_account_balances (versiunea simplă) este DEPRECATED
 * - Acest tabel este versiunea finală și completă conform RAS
 *
 * Table Purpose:
 * - Track monthly balances for each account (RAS structure)
 * - Store opening, period movements, and closing balances
 * - Support Romanian Accounting Standards (RAS) with full account structure
 * - Enable balance sheet and trial balance reports
 * - Multi-currency support (RON, EUR, USD, etc.)
 * - Multi-franchise support (secondary locations)
 *
 * Account Structure (RAS):
 * - account_class: 1-9 (Class: Capital, Assets, Inventory, Payables, Cash, Expenses, Income, etc.)
 * - account_group: 10-99 (Group within class)
 * - account_number: Full synthetic account number
 * - account_sub_number: Optional analytic sub-account
 * - full_account_number: Complete account identifier (number + sub-number)
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_accounting_account_balances table with full RAS structure...');

  // Create the AC_accounting_account_balances table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_accounting_account_balances" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      company_id uuid NOT NULL,
      franchise_id uuid,
      
      -- Account structure (Romanian Accounting Standards)
      account_class integer NOT NULL,
      account_group integer NOT NULL,
      account_number varchar(20) NOT NULL,
      account_sub_number varchar(20),
      full_account_number varchar(50) NOT NULL,
      
      -- Fiscal period
      fiscal_year integer NOT NULL,
      fiscal_month integer NOT NULL,
      
      -- Balances in RON (national currency)
      opening_debit numeric(19, 4) NOT NULL DEFAULT 0,
      opening_credit numeric(19, 4) NOT NULL DEFAULT 0,
      period_debit numeric(19, 4) NOT NULL DEFAULT 0,
      period_credit numeric(19, 4) NOT NULL DEFAULT 0,
      closing_debit numeric(19, 4) NOT NULL DEFAULT 0,
      closing_credit numeric(19, 4) NOT NULL DEFAULT 0,
      
      -- Multi-currency support
      currency varchar(3) NOT NULL DEFAULT 'RON',
      currency_closing_debit numeric(19, 4) DEFAULT 0,
      currency_closing_credit numeric(19, 4) DEFAULT 0,
      
      -- Metadata
      last_calculated_at timestamp NOT NULL DEFAULT now()
    );
  `);

  console.log('🔄 Creating UNIQUE index on company_id + franchise_id + full_account_number + fiscal_year + fiscal_month + currency...');
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "AC_accounting_account_balance_unique" 
    ON "AC_accounting_account_balances" (
      company_id, 
      COALESCE(franchise_id, '00000000-0000-0000-0000-000000000000'::uuid), 
      full_account_number, 
      fiscal_year, 
      fiscal_month, 
      currency
    );
  `);

  console.log('🔄 Creating index on company_id + fiscal_year + fiscal_month...');
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_accounting_account_balance_main_idx" 
    ON "AC_accounting_account_balances" (company_id, fiscal_year, fiscal_month);
  `);

  console.log('🔄 Creating index on company_id + account_class + account_group...');
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_accounting_account_balance_account_idx" 
    ON "AC_accounting_account_balances" (company_id, account_class, account_group);
  `);

  console.log('🔄 Creating index on franchise_id + fiscal_year + fiscal_month...');
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_accounting_account_balance_franchise_idx" 
    ON "AC_accounting_account_balances" (franchise_id, fiscal_year, fiscal_month)
    WHERE franchise_id IS NOT NULL;
  `);

  console.log('✅ Table AC_accounting_account_balances created successfully with full RAS structure');
};

export const down = async (db: any) => {
  console.log('🗑️  Dropping AC_accounting_account_balances table...');
  
  await db.execute(sql`
    DROP TABLE IF EXISTS "AC_accounting_account_balances" CASCADE;
  `);
  
  console.log('✅ Table AC_accounting_account_balances dropped successfully');
};
