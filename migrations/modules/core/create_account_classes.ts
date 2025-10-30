/**
 * Migration: Create account_classes table
 *
 * This migration creates the account_classes table which defines the first level
 * of the Romanian Chart of Accounts hierarchy (classes 1-9).
 *
 * Table Purpose:
 * - Define account classes (1=Capital, 2=Assets, 3=Inventory, etc.)
 * - Provide default account function for each class ('A', 'P', 'B')
 * - Support Romanian Accounting Standards (RAS) classification
 * - Enable proper chart of accounts structure
 *
 * Relations:
 * - Referenced by account_groups.class_id (one-to-many)
 * - Referenced by accounts.class_id (one-to-many)
 *
 * Romanian Accounting Classes:
 * - 1: Conturi de capitaluri (Equity)
 * - 2: Conturi de active imobilizate (Fixed Assets)
 * - 3: Conturi de stocuri (Inventory)
 * - 4: Conturi de terți (Third parties)
 * - 5: Conturi de trezorerie (Treasury)
 * - 6: Conturi de cheltuieli (Expenses)
 * - 7: Conturi de venituri (Revenues)
 * - 8: Conturi speciale (Special accounts)
 * - 9: Conturi de gestiune (Management accounts)
 *
 * Migration ID: create_account_classes
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating account_classes table...');

  // Create the account_classes table
  await sql`
    CREATE TABLE IF NOT EXISTS account_classes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code character varying(1) NOT NULL,
      name text NOT NULL,
      description text,
      default_account_function text NOT NULL,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),

      -- Unique constraint on code (classes 1-9)
      CONSTRAINT account_classes_code_unique UNIQUE (code),

      -- Check constraint for valid account functions
      CONSTRAINT account_classes_function_check
        CHECK (default_account_function IN ('A', 'P', 'B'))
    );
  `;

  // Create indexes for performance
  await sql`
    CREATE INDEX IF NOT EXISTS idx_account_classes_code
    ON account_classes (code);
  `;

  console.log('✅ account_classes table created successfully');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back account_classes table...');

  // Drop indexes first
  await sql`DROP INDEX IF EXISTS idx_account_classes_code;`;

  // Drop the table
  await sql`DROP TABLE IF EXISTS account_classes;`;

  console.log('✅ account_classes table rolled back');
};
