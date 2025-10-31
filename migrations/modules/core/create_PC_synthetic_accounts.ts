/**
 * Migration: Create PC_synthetic_accounts table
 *
 * This migration creates the PC_synthetic_accounts table which defines the third level
 * of the Romanian Chart of Accounts hierarchy (synthetic accounts grades 1 and 2).
 *
 * PC_ Prefix: Plan de Conturi (Chart of Accounts) - for easy identification and consistency
 *
 * Table Purpose:
 * - Define synthetic accounts at grades 1 (3 digits) and 2 (4 digits)
 * - Primary working level for accounting operations
 * - Support hierarchical account structure with parent-child relationships
 * - Enable proper Romanian Chart of Accounts (OMFP 1802/2014) implementation
 *
 * Relations:
 * - group_id -> PC_account_groups.id (required, many-to-one)
 * - parent_id -> PC_synthetic_accounts.id (self-reference, optional for grade 1, required for grade 2)
 * - Referenced by PC_analytic_accounts.synthetic_id (one-to-many)
 * - Referenced by accounts.synthetic_id (legacy, one-to-many)
 *
 * Hierarchical Structure:
 * - Grade 1 (3 digits): 101, 121, 401, 411, 512, 531, 607, 707
 * - Grade 2 (4 digits): 1011, 1211, 4011, 4111, 5121, 5311, 6071, 7071
 *
 * Account Functions:
 * - 'A' (Active): Debit normal balance - assets, expenses
 * - 'P' (Passive): Credit normal balance - liabilities, capital, revenues
 * - 'B' (Bifunctional): Can have either debit or credit balance
 *
 * Data Volume: 781 records in production
 *
 * Migration ID: create_PC_synthetic_accounts
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating PC_synthetic_accounts table...');

  // Create the PC_synthetic_accounts table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "PC_synthetic_accounts" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code character varying(4) NOT NULL,
      name text NOT NULL,
      description text,
      account_function text NOT NULL,
      grade integer NOT NULL,
      group_id uuid NOT NULL,
      parent_id uuid,
      is_active boolean DEFAULT true,
      created_at timestamp without time zone NOT NULL DEFAULT now(),
      updated_at timestamp without time zone NOT NULL DEFAULT now(),

      -- Unique constraint on code
      CONSTRAINT "PC_synthetic_accounts_code_unique" UNIQUE (code),

      -- Foreign key to PC_account_groups
      CONSTRAINT "PC_synthetic_accounts_group_id_PC_account_groups_id_fk"
        FOREIGN KEY (group_id) REFERENCES "PC_account_groups"(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

      -- Self-referencing foreign key for parent accounts
      CONSTRAINT "PC_synthetic_accounts_parent_id_PC_synthetic_accounts_id_fk"
        FOREIGN KEY (parent_id) REFERENCES "PC_synthetic_accounts"(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

      -- Check constraint: account_function must be A, P, or B
      CONSTRAINT "PC_synthetic_accounts_account_function_check"
        CHECK (account_function IN ('A', 'P', 'B')),

      -- Check constraint: grade must be 1 or 2
      CONSTRAINT "PC_synthetic_accounts_grade_check"
        CHECK (grade IN (1, 2)),

      -- Check constraint: code must be 3 or 4 digits
      CONSTRAINT "PC_synthetic_accounts_code_format_check"
        CHECK (code ~ '^[0-9]{3,4}$')
    );
  `);

  // Create indexes for performance
  console.log('📇 Creating indexes for PC_synthetic_accounts...');

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_code_idx"
    ON "PC_synthetic_accounts" (code);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_group_idx"
    ON "PC_synthetic_accounts" (group_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_parent_idx"
    ON "PC_synthetic_accounts" (parent_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_function_idx"
    ON "PC_synthetic_accounts" (account_function);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_grade_idx"
    ON "PC_synthetic_accounts" (grade);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "PC_synthetic_accounts_is_active_idx"
    ON "PC_synthetic_accounts" (is_active);
  `);

  console.log('✅ PC_synthetic_accounts table created successfully with 6 indexes');
  console.log('📊 Table supports 781 synthetic accounts (OMFP 1802/2014)');
};

export const down = async (db: any) => {
  console.log('🔄 Rolling back PC_synthetic_accounts table...');

  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_is_active_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_grade_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_function_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_parent_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_group_idx";`);
  await db.execute(sql`DROP INDEX IF EXISTS "PC_synthetic_accounts_code_idx";`);

  // Drop the table (cascading will handle foreign keys)
  await db.execute(sql`DROP TABLE IF EXISTS "PC_synthetic_accounts" CASCADE;`);

  console.log('✅ PC_synthetic_accounts table rolled back');
};

