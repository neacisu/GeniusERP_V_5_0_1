/**
 * Migration: Create AC_vat_settings table
 *
 * This migration creates the AC_vat_settings table which stores
 * VAT (TVA) configuration and settings for each company.
 *
 * 📁 LOCAȚIE: /migrations/modules/accounting/
 * 🏷️  PREFIX: AC_ (Accounting Configuration)
 *
 * Table Purpose:
 * - Store per-company VAT configuration
 * - Define VAT rates (standard, reduced 1, reduced 2)
 * - Configure VAT accounts (collected, deductible, payable, receivable)
 * - Set declaration frequency (monthly/quarterly)
 * - Enable VAT validation features
 *
 * Relations:
 * - company_id → companies.id (1:1 relationship, ON DELETE CASCADE)
 *
 * Key Features:
 * - UNIQUE constraint on company_id (enforces 1:1 relationship)
 * - pgEnum for declaration_frequency ('monthly', 'quarterly')
 * - Default VAT rates for Romania (19%, 9%, 5%)
 * - Default VAT accounts according to Romanian accounting standards
 * - Cash VAT threshold: 2,250,000 RON (Romanian legal requirement)
 *
 * Migration ID: create_AC_vat_settings
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating pgEnum declaration_frequency...');

  // Create pgEnum for declaration frequency
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE declaration_frequency AS ENUM ('monthly', 'quarterly');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('📊 Creating AC_vat_settings table...');

  // Create the AC_vat_settings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_vat_settings" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL UNIQUE,
      
      -- VAT regime
      vat_payer boolean DEFAULT true NOT NULL,
      use_cash_vat boolean DEFAULT false NOT NULL,
      cash_vat_threshold numeric(15,2) DEFAULT 2250000.00 NOT NULL,
      
      -- VAT rates (Romanian standards)
      standard_vat_rate integer DEFAULT 19 NOT NULL,
      reduced_vat_rate_1 integer DEFAULT 9 NOT NULL,
      reduced_vat_rate_2 integer DEFAULT 5 NOT NULL,
      
      -- VAT accounts (Romanian Chart of Accounts)
      vat_collected_account text DEFAULT '4427' NOT NULL,
      vat_deductible_account text DEFAULT '4426' NOT NULL,
      vat_payable_account text DEFAULT '4423' NOT NULL,
      vat_receivable_account text DEFAULT '4424' NOT NULL,
      
      -- Declaration frequency (using pgEnum)
      declaration_frequency declaration_frequency DEFAULT 'monthly' NOT NULL,
      
      -- VAT validation
      enable_vat_validation boolean DEFAULT true NOT NULL,
      
      -- Audit trail
      created_at timestamp without time zone DEFAULT now() NOT NULL,
      updated_at timestamp without time zone DEFAULT now() NOT NULL,
      
      -- Foreign key constraints
      CONSTRAINT "AC_vat_settings_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      
      -- Check constraints (based on real DB structure)
      CONSTRAINT "AC_vat_settings_cash_vat_threshold_check" CHECK (cash_vat_threshold >= 0),
      CONSTRAINT "AC_vat_settings_declaration_frequency_check" 
        CHECK (declaration_frequency = ANY (ARRAY['monthly'::text, 'quarterly'::text])),
      CONSTRAINT "AC_vat_settings_standard_vat_rate_check" 
        CHECK (standard_vat_rate >= 0 AND standard_vat_rate <= 100),
      CONSTRAINT "AC_vat_settings_reduced_vat_rate_1_check" 
        CHECK (reduced_vat_rate_1 >= 0 AND reduced_vat_rate_1 <= 100),
      CONSTRAINT "AC_vat_settings_reduced_vat_rate_2_check" 
        CHECK (reduced_vat_rate_2 >= 0 AND reduced_vat_rate_2 <= 100)
    );
  `);

  // Create indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_AC_vat_settings_company_id"
    ON "AC_vat_settings" (company_id);
  `);

  console.log('✅ AC_vat_settings table created successfully');
  console.log('📝 Note: This is a 1:1 relationship with companies table');
  console.log('🇷🇴  Romanian VAT defaults: 19% (standard), 9% (reduced 1), 5% (reduced 2)');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back AC_vat_settings table...');

  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS "idx_AC_vat_settings_company_id";`);

  // Drop the table
  await db.execute(sql`DROP TABLE IF EXISTS "AC_vat_settings";`);

  // Drop the enum (only if no other tables use it)
  await db.execute(sql`DROP TYPE IF EXISTS declaration_frequency;`);

  console.log('✅ AC_vat_settings table rolled back');
};

/**
 * IMPORTANT NOTES FOR PRODUCTION:
 * 
 * 1. ⚠️ This table already exists in production with name "vat_settings"
 *    DO NOT run this migration on production without proper backup!
 * 
 * 2. For production rename, use separate migration with:
 *    ALTER TABLE vat_settings RENAME TO AC_vat_settings;
 * 
 * 3. Romanian VAT Rates (as of 2024):
 *    - Standard: 19% (most goods and services)
 *    - Reduced 1: 9% (specific categories: hotels, restaurants, etc.)
 *    - Reduced 2: 5% (books, newspapers, medicines, etc.)
 * 
 * 4. Cash VAT Threshold:
 *    - 2,250,000 RON (Romanian legal requirement for cash accounting)
 *    - Companies below this threshold can opt for cash VAT regime
 * 
 * 5. Declaration Frequency:
 *    - Monthly: Default for most companies
 *    - Quarterly: Available for small companies under certain conditions
 * 
 * 6. VAT Accounts (Romanian Chart of Accounts):
 *    - 4427: TVA collected (TVA colectată)
 *    - 4426: TVA deductible (TVA deductibilă)
 *    - 4423: TVA payable (TVA de plată)
 *    - 4424: TVA receivable (TVA de recuperat)
 */

