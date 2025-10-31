/**
 * Migration: create_AC_journal_types
 * 
 * Creează tabelul AC_journal_types pentru tipurile de jurnale contabile
 * conform standardelor RAS (Romanian Accounting Standards)
 * 
 * PREFIX: AC_ (Accounting Configuration)
 * 
 * Tipuri de jurnale contabile:
 * - GENJ: Jurnal General (General Journal)
 * - SALE: Jurnal Vânzări (Sales Journal)  
 * - PURCH: Jurnal Achiziții (Purchase Journal)
 * - BANK: Jurnal Bănci (Bank Journal)
 * - CASH: Jurnal Casă (Cash Journal)
 * 
 * NOTE: Numerotarea documentelor se face în document_counters
 */

import { sql } from 'drizzle-orm';

export async function up(db: any): Promise<void> {
  console.log('🔄 Creating table AC_journal_types...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_journal_types" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "company_id" uuid NOT NULL,
      "code" varchar(20) NOT NULL,
      "name" varchar(100) NOT NULL,
      "description" text,
      "default_debit_account" varchar(20),
      "default_credit_account" varchar(20),
      "is_system_journal" boolean DEFAULT false NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_by" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_by" uuid,
      "updated_at" timestamp
    );
  `);
  
  console.log('🔄 Creating unique index on company_id + code...');
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "AC_journal_types_code_unique" 
    ON "AC_journal_types" ("company_id", "code");
  `);
  
  console.log('🔄 Creating index on company_id + is_active...');
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "AC_journal_types_active_idx" 
    ON "AC_journal_types" ("company_id", "is_active");
  `);
  
  console.log('✅ Table AC_journal_types created successfully');
  console.log('ℹ️  NOTE: Document numbering handled by document_counters table');
}

export async function down(db: any): Promise<void> {
  console.log('🔄 Dropping table AC_journal_types...');
  
  await db.execute(sql`DROP TABLE IF EXISTS "AC_journal_types" CASCADE;`);
  
  console.log('✅ Table AC_journal_types dropped successfully');
}

