/**
 * Migration: Create AC_bank_accounts table
 * Conturi bancare pentru companie
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_bank_accounts table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_bank_accounts" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      account_name text NOT NULL,
      account_number text NOT NULL,
      bank_name text NOT NULL,
      bank_code text,
      currency text NOT NULL DEFAULT 'RON',
      current_balance numeric(15,2) NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      created_by uuid,
      
      CONSTRAINT "AC_bank_accounts_company_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_bank_accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  await db.execute(sql`CREATE INDEX idx_AC_bank_accounts_company ON AC_bank_accounts(company_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_bank_accounts_number ON AC_bank_accounts(account_number);`);

  console.log('✅ AC_bank_accounts created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_bank_accounts";`);
};

