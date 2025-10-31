/**
 * Migration: Create PC_analytic_accounts table
 * 
 * Creează tabelul PC_analytic_accounts - cel mai detaliat nivel din Planul de Conturi Român
 * 
 * Ierarhie:
 * PC_account_classes → PC_account_groups → PC_synthetic_accounts → PC_analytic_accounts
 * 
 * Prefix PC_ = Plan de Conturi pentru identificare ușoară și consistență
 */

import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  console.log('🔄 Running migration: create_PC_analytic_accounts');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS PC_analytic_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code character varying(20) NOT NULL,
      name text NOT NULL,
      description text,
      synthetic_id uuid NOT NULL,
      account_function text NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),
      
      -- Constraints
      CONSTRAINT PC_analytic_accounts_code_unique UNIQUE (code),
      CONSTRAINT PC_analytic_accounts_synthetic_id_PC_synthetic_accounts_id_fk
        FOREIGN KEY (synthetic_id) REFERENCES PC_synthetic_accounts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
      CONSTRAINT PC_analytic_accounts_account_function_check
        CHECK (account_function IN ('A', 'P', 'B', 'E', 'V'))
    );
  `);

  console.log('✅ Created table PC_analytic_accounts');

  // Create indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS PC_analytic_accounts_code_idx 
    ON PC_analytic_accounts(code);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS PC_analytic_accounts_synthetic_idx 
    ON PC_analytic_accounts(synthetic_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS PC_analytic_accounts_function_idx 
    ON PC_analytic_accounts(account_function);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS PC_analytic_accounts_is_active_idx 
    ON PC_analytic_accounts(is_active);
  `);

  console.log('✅ Created indexes for PC_analytic_accounts');

  // Add comment to table
  await db.execute(sql`
    COMMENT ON TABLE PC_analytic_accounts IS 
    'Conturi analitice - cel mai detaliat nivel din Planul de Conturi Român (5+ caractere cu punct). Folosit pentru detalieri pe gestiuni, parteneri, proiecte, etc.';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN PC_analytic_accounts.code IS 
    'Cod cont analitic - format: [cod_sintetic].[identificator] (ex: 371.1, 4426.40, 511.01.001)';
  `);

  await db.execute(sql`
    COMMENT ON COLUMN PC_analytic_accounts.account_function IS 
    'Funcție contabilă: A=Activ, P=Pasiv, B=Bifuncțional, E=Cheltuieli, V=Venituri (moștenit de la sintetic)';
  `);

  console.log('✅ Migration create_PC_analytic_accounts completed successfully');
}

export async function down(db: any): Promise<void> {
  console.log('🔄 Reverting migration: create_PC_analytic_accounts');

  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS PC_analytic_accounts_is_active_idx;`);
  await db.execute(sql`DROP INDEX IF EXISTS PC_analytic_accounts_function_idx;`);
  await db.execute(sql`DROP INDEX IF EXISTS PC_analytic_accounts_synthetic_idx;`);
  await db.execute(sql`DROP INDEX IF EXISTS PC_analytic_accounts_code_idx;`);

  console.log('✅ Dropped indexes for PC_analytic_accounts');

  // Drop table
  await db.execute(sql`DROP TABLE IF EXISTS PC_analytic_accounts CASCADE;`);

  console.log('✅ Dropped table PC_analytic_accounts');
  console.log('✅ Migration create_PC_analytic_accounts reverted successfully');
}

