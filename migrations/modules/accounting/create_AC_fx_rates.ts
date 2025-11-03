/**
 * Migration: Create AC_fx_rates table
 * Cursuri valutare BNR (Banca Națională a României)
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating AC_fx_rates table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_fx_rates" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      currency varchar(5) NOT NULL,
      rate numeric(10,4) NOT NULL,
      source varchar(20) NOT NULL DEFAULT 'BNR',
      base_currency varchar(5) NOT NULL DEFAULT 'RON',
      date timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      
      CONSTRAINT "AC_fx_rates_unique" UNIQUE (currency, date, source, base_currency)
    );
  `);

  await db.execute(sql`CREATE INDEX idx_AC_fx_rates_currency ON AC_fx_rates(currency);`);
  await db.execute(sql`CREATE INDEX idx_AC_fx_rates_date ON AC_fx_rates(date);`);
  await db.execute(sql`CREATE INDEX idx_AC_fx_rates_source ON AC_fx_rates(source);`);
  await db.execute(sql`CREATE INDEX idx_AC_fx_rates_currency_date ON AC_fx_rates(currency, date);`);

  console.log('✅ AC_fx_rates created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_fx_rates";`);
};

