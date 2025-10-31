/**
 * Migration: Create AC_accounting_settings table
 *
 * This migration creates the AC_accounting_settings table which stores
 * accounting configuration and settings for each company.
 *
 * 📁 LOCAȚIE: /migrations/modules/accounting/
 * 🏷️  PREFIX: AC_ (Accounting Configuration)
 *
 * Table Purpose:
 * - Store per-company accounting module configuration
 * - Enable/disable optional accounting features (feature flags)
 * - Configure fiscal year settings and workflows
 * - Manage ANAF integrations (e-Factură, SAF-T)
 * - Track implementation status (history, opening balances)
 *
 * Relations:
 * - company_id → companies.id (1:1 relationship, ON DELETE CASCADE)
 * - created_by → users.id (audit trail)
 *
 * Key Features:
 * - UNIQUE constraint on company_id (enforces 1:1 relationship)
 * - CHECK constraint for fiscal_year_start_month (1-12)
 * - All feature flags are booleans with defaults
 * - anaf_api_key must be encrypted in application layer
 * - accounting_start_date is DATE type (not timestamp)
 *
 * Migration ID: create_AC_accounting_settings
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_accounting_settings table...');

  // Create the AC_accounting_settings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_accounting_settings" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL UNIQUE,
      
      -- General configuration
      fiscal_year_start_month integer DEFAULT 1 NOT NULL,
      require_approval boolean DEFAULT false NOT NULL,
      auto_numbering boolean DEFAULT true NOT NULL,
      
      -- Feature flags
      enable_analytic_accounting boolean DEFAULT false NOT NULL,
      enable_multi_currency boolean DEFAULT false NOT NULL,
      enable_fixed_assets boolean DEFAULT false NOT NULL,
      enable_cost_centers boolean DEFAULT false NOT NULL,
      enable_projects boolean DEFAULT false NOT NULL,
      
      -- External integrations
      enable_saft_export boolean DEFAULT false NOT NULL,
      enable_anaf_efactura boolean DEFAULT false NOT NULL,
      anaf_api_key text, -- ⚠️ SECURITY: Must be encrypted in application layer!
      
      -- Onboarding and setup
      has_accounting_history boolean DEFAULT false NOT NULL,
      accounting_start_date date, -- DATE type (not timestamp)
      opening_balances_imported boolean DEFAULT false NOT NULL,
      
      -- Audit trail
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      created_by uuid,
      
      -- Foreign key constraints
      CONSTRAINT "AC_accounting_settings_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_accounting_settings_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES users(id),
      
      -- Check constraints
      CONSTRAINT "AC_accounting_settings_fiscal_month_check"
        CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12)
    );
  `);

  // Create indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_accounting_settings_company_id"
    ON "AC_accounting_settings" (company_id);
  `);

  console.log('✅ AC_accounting_settings table created successfully');
  console.log('📝 Note: This is a 1:1 relationship with companies table');
  console.log('⚠️  Security: anaf_api_key must be encrypted before storage!');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back AC_accounting_settings table...');

  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_accounting_settings_company_id";`);

  // Drop the table
  await db.execute(sql`DROP TABLE IF EXISTS "AC_accounting_settings";`);

  console.log('✅ AC_accounting_settings table rolled back');
};

/**
 * IMPORTANT NOTES FOR PRODUCTION:
 * 
 * 1. ⚠️ This table already exists in production with name "accounting_settings"
 *    DO NOT run this migration on production without proper backup!
 * 
 * 2. For production rename, use separate migration with:
 *    ALTER TABLE accounting_settings RENAME TO AC_accounting_settings;
 * 
 * 3. Security: anaf_api_key MUST be encrypted with AES-256-GCM or similar
 *    before storage. Never store plain text API keys in database!
 * 
 * 4. The UNIQUE constraint on company_id enforces 1:1 relationship.
 *    Each company can have only ONE accounting settings record.
 * 
 * 5. Conditional validations (implemented in Zod):
 *    - If enable_anaf_efactura = true → anaf_api_key is required
 *    - If has_accounting_history = true → accounting_start_date is required
 */

