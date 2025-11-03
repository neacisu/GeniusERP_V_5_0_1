/**
 * Migration: Create AC_cash_registers table
 * Registre de casă conform OMFP 2861/2009
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating cash_register_status enum...');
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE cash_register_status AS ENUM ('active', 'closed', 'suspended');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('📊 Creating AC_cash_registers table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_cash_registers" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      franchise_id uuid,
      name text NOT NULL,
      code text NOT NULL,
      type text NOT NULL DEFAULT 'main',
      location text,
      currency text NOT NULL DEFAULT 'RON',
      responsible_person_id uuid,
      responsible_person_name text,
      daily_limit numeric(15,2),
      max_transaction_amount numeric(15,2),
      current_balance numeric(15,2) NOT NULL DEFAULT 0,
      status cash_register_status NOT NULL DEFAULT 'active',
      is_active boolean NOT NULL DEFAULT true,
      closed_at timestamp,
      closed_by uuid,
      closing_balance numeric(15,2),
      last_closed_date text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      created_by uuid,
      updated_by uuid,
      
      CONSTRAINT "AC_cash_registers_company_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_cash_registers_responsible_person_fkey" FOREIGN KEY (responsible_person_id) REFERENCES users(id),
      CONSTRAINT "AC_cash_registers_closed_by_fkey" FOREIGN KEY (closed_by) REFERENCES users(id),
      CONSTRAINT "AC_cash_registers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id),
      CONSTRAINT "AC_cash_registers_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES users(id)
    );
  `);

  await db.execute(sql`CREATE INDEX idx_AC_cash_registers_company ON AC_cash_registers(company_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_cash_registers_status ON AC_cash_registers(status);`);
  await db.execute(sql`CREATE INDEX idx_AC_cash_registers_code ON AC_cash_registers(company_id, code);`);

  console.log('✅ AC_cash_registers created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_cash_registers";`);
  await db.execute(sql`DROP TYPE IF EXISTS cash_register_status;`);
};

