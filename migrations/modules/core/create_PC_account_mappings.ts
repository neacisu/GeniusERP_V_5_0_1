/**
 * Migration: Create PC_account_mappings table
 *
 * Creează tabelul PC_account_mappings pentru maparea conturilor contabile implicite
 * pentru fiecare companie în operațiuni automate (casă, bancă, clienți, furnizori, TVA, etc.)
 * 
 * PC_ Prefix: Plan de Conturi (Chart of Accounts) - pentru identificare ușoară și consistență
 *
 * Table Purpose:
 * - Permite fiecărei companii să configureze propriul plan de conturi
 * - Definește conturi implicite pentru operațiuni automate
 * - Suportă 29 tipuri de mapări (CASH_RON, BANK_PRIMARY, CUSTOMERS, etc.)
 * - Permite istoric de modificări (soft delete cu is_active)
 *
 * Relations:
 * - company_id -> companies.id (required, CASCADE DELETE)
 * - created_by -> users.id (optional, user who created mapping)
 *
 * Business Rules:
 * - UN SINGUR cont activ per (company_id, mapping_type)
 * - Permite multiple mapări inactive pentru audit trail
 * - Trigger automat pentru updated_at
 *
 * Migration ID: create_PC_account_mappings
 */

import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  console.log('⏫ Starting migration: Create PC_account_mappings table');

  // 1. Create ENUM type for mapping_type (dacă nu există deja)
  console.log('📊 Creating account_mapping_type ENUM...');
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE account_mapping_type AS ENUM (
        'CASH_RON',
        'CASH_CURRENCY',
        'PETTY_CASH',
        'BANK_PRIMARY',
        'BANK_CURRENCY',
        'CUSTOMERS',
        'SUPPLIERS',
        'EMPLOYEE_ADVANCES',
        'EMPLOYEE_PAYROLL',
        'VAT_COLLECTED',
        'VAT_DEDUCTIBLE',
        'VAT_PAYABLE',
        'VAT_RECOVERABLE',
        'MERCHANDISE_SALES',
        'SERVICE_REVENUE',
        'INTEREST_INCOME',
        'UTILITIES',
        'SUPPLIES',
        'TRANSPORT',
        'OTHER_SERVICES',
        'BANK_FEES',
        'INTEREST_EXPENSE',
        'INTERNAL_TRANSFERS',
        'CASH_SHORTAGES',
        'CASH_OVERAGES',
        'EXCHANGE_DIFF_INCOME',
        'EXCHANGE_DIFF_EXPENSE',
        'SHORT_TERM_LOANS',
        'LONG_TERM_LOANS'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Create PC_account_mappings table
  console.log('📊 Creating PC_account_mappings table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "PC_account_mappings" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      mapping_type account_mapping_type NOT NULL,
      account_code text NOT NULL,
      account_name text NOT NULL,
      is_default boolean NOT NULL DEFAULT false,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),
      created_by uuid,

      -- Foreign key către companies (CASCADE DELETE)
      CONSTRAINT "PC_account_mappings_company_id_companies_id_fk"
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

      -- Foreign key către users (optional, pentru audit)
      CONSTRAINT "PC_account_mappings_created_by_users_id_fk"
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

      -- UNIQUE constraint: UN SINGUR cont activ per (company_id, mapping_type)
      CONSTRAINT "PC_account_mappings_company_id_mapping_type_is_active_key"
        UNIQUE (company_id, mapping_type, is_active)
    );
  `);

  // 3. Create indexes for performance
  console.log('📇 Creating indexes for PC_account_mappings...');
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_account_mappings_company_idx"
    ON "PC_account_mappings" (company_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_account_mappings_type_idx"
    ON "PC_account_mappings" (mapping_type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_account_mappings_active_idx"
    ON "PC_account_mappings" (is_active);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_account_mappings_created_by_idx"
    ON "PC_account_mappings" (created_by);
  `);

  // 4. Create trigger function for updated_at (dacă nu există deja)
  console.log('⚙️  Creating trigger function for updated_at...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_PC_account_mappings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 5. Create trigger
  console.log('⚙️  Creating updated_at trigger...');
  await db.execute(sql`
    CREATE TRIGGER "PC_account_mappings_updated_at_trigger"
    BEFORE UPDATE ON "PC_account_mappings"
    FOR EACH ROW
    EXECUTE FUNCTION update_PC_account_mappings_updated_at();
  `);

  // 6. Add comments for documentation
  console.log('📝 Adding table and column comments...');
  await db.execute(sql`
    COMMENT ON TABLE "PC_account_mappings" IS 
    'Mapări de conturi contabile implicite pentru operațiuni automate. Permite fiecărei companii să configureze propriul plan de conturi pentru trezorerie, terți, TVA, venituri, cheltuieli, etc.';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "PC_account_mappings".mapping_type IS 
    'Tipul de operațiune contabilă: CASH_RON, BANK_PRIMARY, CUSTOMERS, SUPPLIERS, VAT_COLLECTED, etc. (29 valori posibile)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "PC_account_mappings".account_code IS 
    'Codul contului sintetic sau analitic folosit (ex: 5311, 4111, 401, 4427)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "PC_account_mappings".is_active IS 
    'Soft delete / Enable-Disable. Permite păstrarea istoricului modificărilor. UN SINGUR cont activ per (company_id, mapping_type)';
  `);

  console.log('✅ Migration completed: PC_account_mappings table created successfully');
  console.log('📊 Table supports 29 mapping types with audit trail and soft delete');
}

export async function down(db: any): Promise<void> {
  console.log('⏬ Rolling back migration: Dropping PC_account_mappings table');

  // 1. Drop trigger
  await db.execute(sql`
    DROP TRIGGER IF EXISTS "PC_account_mappings_updated_at_trigger" ON "PC_account_mappings";
  `);

  // 2. Drop trigger function
  await db.execute(sql`
    DROP FUNCTION IF EXISTS update_PC_account_mappings_updated_at();
  `);

  // 3. Drop indexes (vor fi șterse automat cu tabelul, dar explicit pentru claritate)
  await db.execute(sql`DROP INDEX IF EXISTS "PC_account_mappings_created_by_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_account_mappings_active_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_account_mappings_type_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_account_mappings_company_idx";`);

  // 4. Drop table (CASCADE va șterge și FK constraints)
  await db.execute(sql`
    DROP TABLE IF EXISTS "PC_account_mappings" CASCADE;
  `);

  // 5. Drop ENUM type (OPȚIONAL - doar dacă nu e folosit de alte tabele)
  console.log('⚠️  Note: account_mapping_type ENUM NOT dropped (poate fi folosit de alte tabele)');
  // await db.execute(sql`DROP TYPE IF EXISTS account_mapping_type;`);

  console.log('✅ Rollback completed: PC_account_mappings table dropped');
}
