/**
 * Migration: Create AC_account_relationships table
 *
 * Creează tabelul AC_account_relationships pentru configurarea automată a relațiilor contabile (debit-credit)
 * pentru diferite tipuri de operațiuni în sistemul de contabilitate.
 * 
 * AC_ Prefix: Accounting Configuration - pentru reguli de utilizare a conturilor, NU structura
 * 
 * Module: Accounting (migrations/modules/accounting/)
 * - Acest tabel aparține modulului Accounting, NU modulului Core
 * - Core conține doar structura Planului de Conturi (PC_*)
 * - Accounting conține reguli de utilizare și configurări (AC_*)
 *
 * Table Purpose:
 * - Definește automat ce conturi se debitează și se creditează pentru fiecare tip de operațiune
 * - Permite fiecărei companii să configureze propriile reguli contabile
 * - Suportă sistem de prioritizare când există multiple reguli
 * - Permite reguli condiționale complexe folosind JSONB
 *
 * Relations:
 * - company_id -> companies.id (required, CASCADE DELETE)
 *
 * Business Rules:
 * - UNIQUE constraint: (company_id, relationship_type, debit_account_code, credit_account_code)
 * - Priority system: Mai mare = mai prioritar
 * - Conditional evaluation: JSONB conditions pentru reguli dinamice
 *
 * Migration ID: create_AC_account_relationships
 */

import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  console.log('⏫ Starting migration: Create AC_account_relationships table');

  // 1. Create AC_account_relationships table
  console.log('📊 Creating AC_account_relationships table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_account_relationships" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      relationship_type text NOT NULL,
      description text,
      debit_account_code text NOT NULL,
      debit_account_name text,
      credit_account_code text NOT NULL,
      credit_account_name text,
      is_active boolean DEFAULT true,
      priority integer DEFAULT 0,
      conditions jsonb,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),

      -- Foreign key către companies (CASCADE DELETE)
      CONSTRAINT "AC_account_relationships_company_id_fkey"
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

      -- UNIQUE constraint pentru evitarea duplicatelor
      CONSTRAINT "AC_account_relationships_unique_rule"
        UNIQUE (company_id, relationship_type, debit_account_code, credit_account_code),

      -- Check constraint: priority >= 0
      CONSTRAINT "AC_account_relationships_priority_check"
        CHECK (priority >= 0)
    );
  `);

  // 2. Create indexes for performance
  console.log('📇 Creating indexes for AC_account_relationships...');
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_account_relationships_company_id"
    ON "AC_account_relationships" (company_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_account_relationships_type"
    ON "AC_account_relationships" (relationship_type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_account_relationships_priority"
    ON "AC_account_relationships" (priority DESC);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_account_relationships_active"
    ON "AC_account_relationships" (is_active)
    WHERE is_active = true;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "idx_account_relationships_conditions"
    ON "AC_account_relationships" USING gin (conditions);
  `);

  // 3. Create trigger function for updated_at
  console.log('⚙️  Creating trigger function for updated_at...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_account_relationships_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 4. Create trigger
  console.log('⚙️  Creating updated_at trigger...');
  await db.execute(sql`
    CREATE TRIGGER trg_account_relationships_updated_at
    BEFORE UPDATE ON "AC_account_relationships"
    FOR EACH ROW
    EXECUTE FUNCTION update_account_relationships_updated_at();
  `);

  // 5. Add comments for documentation
  console.log('📝 Adding table and column comments...');
  await db.execute(sql`
    COMMENT ON TABLE "AC_account_relationships" IS 
    'Configurare reguli automate de înregistrare contabilă (debit-credit). Permite fiecărei companii să definească automat ce conturi se folosesc pentru diferite tipuri de operațiuni (factură vânzare, plată furnizor, etc.).';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "AC_account_relationships".relationship_type IS 
    'Tipul de operațiune contabilă: SALE_INVOICE, PURCHASE_INVOICE, CASH_RECEIPT, BANK_PAYMENT, SALARY_PAYMENT, etc.';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "AC_account_relationships".debit_account_code IS 
    'Codul contului care va fi debitat automat (ex: 4111 pentru clienți la factură vânzare)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "AC_account_relationships".credit_account_code IS 
    'Codul contului care va fi creditat automat (ex: 707 pentru venituri la factură vânzare)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "AC_account_relationships".priority IS 
    'Ordinea de evaluare când există multiple reguli. Mai mare = mai prioritar. System evaluează regula cu prioritatea cea mai mare care match-uiește condițiile.';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN "AC_account_relationships".conditions IS 
    'Condiții JSONB pentru evaluare dinamică: {amount: {operator: ">=", value: 10000}, vat_rate: {operator: "==", value: 19}}';
  `);

  console.log('✅ Migration completed: AC_account_relationships table created successfully');
  console.log('📊 Table supports priority-based conditional accounting rules');
}

export async function down(db: any): Promise<void> {
  console.log('⏬ Rolling back migration: Dropping AC_account_relationships table');

  // 1. Drop trigger
  await db.execute(sql`
    DROP TRIGGER IF EXISTS trg_account_relationships_updated_at ON "AC_account_relationships";
  `);

  // 2. Drop trigger function
  await db.execute(sql`
    DROP FUNCTION IF EXISTS update_account_relationships_updated_at();
  `);

  // 3. Drop indexes (vor fi șterse automat cu tabelul, dar explicit pentru claritate)
  await db.execute(sql`DROP INDEX IF EXISTS "idx_account_relationships_conditions";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_account_relationships_active";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_account_relationships_priority";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_account_relationships_type";`);
  await db.execute(sql`DROP INDEX IF EXISTS "idx_account_relationships_company_id";`);

  // 4. Drop table (CASCADE va șterge și FK constraints)
  await db.execute(sql`
    DROP TABLE IF EXISTS "AC_account_relationships" CASCADE;
  `);

  console.log('✅ Rollback completed: AC_account_relationships table dropped');
}

