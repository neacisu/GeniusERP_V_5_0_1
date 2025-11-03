/**
 * Migration: Create AC_fiscal_periods table
 * Perioade fiscale și închideri contabile
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_fiscal_periods table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_fiscal_periods" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      year numeric NOT NULL,
      month numeric NOT NULL,
      start_date timestamp NOT NULL,
      end_date timestamp NOT NULL,
      status text NOT NULL DEFAULT 'open',
      is_closed boolean NOT NULL DEFAULT false,
      closed_at timestamp,
      closed_by uuid,
      reopened_at timestamp,
      reopened_by uuid,
      reopening_reason text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      
      CONSTRAINT "AC_fiscal_periods_status_check" CHECK (status IN ('open', 'soft_close', 'hard_close'))
    );
  `);

  console.log('✅ AC_fiscal_periods created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_fiscal_periods";`);
};

