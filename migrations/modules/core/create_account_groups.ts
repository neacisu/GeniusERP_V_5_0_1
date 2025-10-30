/**
 * Migration: Create account_groups table
 *
 * This migration creates the account_groups table which defines the second level
 * of the Romanian Chart of Accounts hierarchy (groups 10-99).
 *
 * Table Purpose:
 * - Define account groups within each account class
 * - Group related accounts together (e.g., 10=Capital, 20=Fixed Assets)
 * - Support Romanian Accounting Standards (RAS) classification
 * - Enable proper chart of accounts structure navigation
 *
 * Relations:
 * - class_id -> account_classes.id (required, one-to-many)
 * - Referenced by synthetic_accounts.group_id (one-to-many)
 *
 * Romanian Accounting Groups Examples:
 * - 10-19: Capital și rezerve (Capital and Reserves)
 * - 20-29: Imobilizări (Fixed Assets)
 * - 30-39: Stocuri (Inventory)
 * - 40-49: Terți (Third parties)
 * - 50-59: Trezorerie (Treasury)
 * - 60-69: Cheltuieli (Expenses)
 * - 70-79: Venituri (Revenues)
 * - 80-89: Conturi speciale (Special accounts)
 * - 90-99: Conturi de gestiune (Management accounts)
 *
 * Migration ID: create_account_groups
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating account_groups table...');

  // Create the account_groups table
  await sql`
    CREATE TABLE IF NOT EXISTS account_groups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code character varying(2) NOT NULL,
      name text NOT NULL,
      description text,
      class_id uuid NOT NULL,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),

      -- Unique constraint on code (groups 10-99)
      CONSTRAINT account_groups_code_unique UNIQUE (code),

      -- Foreign key to account_classes
      CONSTRAINT account_groups_class_id_account_classes_id_fk
        FOREIGN KEY (class_id) REFERENCES account_classes(id)
    );
  `;

  // Create indexes for performance
  await sql`
    CREATE INDEX IF NOT EXISTS idx_account_groups_code
    ON account_groups (code);
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_account_groups_class_id
    ON account_groups (class_id);
  `;

  console.log('✅ account_groups table created successfully');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back account_groups table...');

  // Drop indexes first
  await sql`DROP INDEX IF EXISTS idx_account_groups_class_id;`;
  await sql`DROP INDEX IF EXISTS idx_account_groups_code;`;

  // Drop the table
  await sql`DROP TABLE IF EXISTS account_groups;`;

  console.log('✅ account_groups table rolled back');
};
