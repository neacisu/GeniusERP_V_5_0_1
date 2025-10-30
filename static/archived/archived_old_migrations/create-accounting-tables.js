/**
 * Create Accounting Tables Script
 * 
 * This script creates the necessary tables for the accounting module
 * using Drizzle ORM to push the schema to the database.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function createAccountingTables() {
  try {
    console.log('Starting accounting tables creation...');
    
    // Create database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('Connecting to database...');
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Push the schema to the database
    console.log('Pushing accounting schema to database...');
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create ledger_entries table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ledger_entries') THEN
          CREATE TABLE "ledger_entries" (
            "id" UUID PRIMARY KEY NOT NULL,
            "company_id" UUID NOT NULL,
            "franchise_id" UUID,
            "type" TEXT NOT NULL,
            "reference_number" TEXT,
            "amount" NUMERIC NOT NULL,
            "description" TEXT NOT NULL,
            "metadata" JSONB,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL,
            "created_by" UUID
          );
        END IF;
        
        -- Create ledger_lines table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ledger_lines') THEN
          CREATE TABLE "ledger_lines" (
            "id" UUID PRIMARY KEY NOT NULL,
            "ledger_entry_id" UUID NOT NULL,
            "account_id" TEXT NOT NULL,
            "debit_amount" NUMERIC NOT NULL DEFAULT '0',
            "credit_amount" NUMERIC NOT NULL DEFAULT '0',
            "description" TEXT,
            "metadata" JSONB,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL,
            CONSTRAINT fk_ledger_entry
              FOREIGN KEY("ledger_entry_id")
              REFERENCES "ledger_entries"("id")
              ON DELETE CASCADE
          );
        END IF;
        
        -- Create journal_types table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'journal_types') THEN
          CREATE TABLE "journal_types" (
            "id" UUID PRIMARY KEY NOT NULL,
            "code" TEXT NOT NULL UNIQUE,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL
          );
        END IF;
        
        -- account_balances table creation removed - use canonical migration in apps/api/migrations/sql/0000_smart_black_bird.sql
        
        -- Create fiscal_periods table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fiscal_periods') THEN
          CREATE TABLE "fiscal_periods" (
            "id" UUID PRIMARY KEY NOT NULL,
            "company_id" UUID NOT NULL,
            "year" NUMERIC NOT NULL,
            "month" NUMERIC NOT NULL,
            "start_date" TIMESTAMP NOT NULL,
            "end_date" TIMESTAMP NOT NULL,
            "is_closed" NUMERIC NOT NULL DEFAULT '0',
            "closed_at" TIMESTAMP,
            "closed_by" UUID,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL
          );
        END IF;
        
        -- Create chart_of_accounts table if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chart_of_accounts') THEN
          CREATE TABLE "chart_of_accounts" (
            "id" UUID PRIMARY KEY NOT NULL,
            "company_id" UUID,
            "code" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "account_class" NUMERIC NOT NULL,
            "account_group" NUMERIC NOT NULL,
            "account_type" TEXT NOT NULL,
            "is_active" NUMERIC NOT NULL DEFAULT '1',
            "parent_id" UUID,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL
          );
        END IF;
      END $$;
    `);
    
    // Create some basic chart of accounts entries for testing
    console.log('Creating basic chart of accounts entries...');
    await db.execute(`
      DO $$ 
      BEGIN
        -- Insert basic Romanian chart of accounts entries if they don't exist
        IF NOT EXISTS (SELECT FROM chart_of_accounts WHERE code = '4111') THEN
          INSERT INTO chart_of_accounts (
            id, code, name, description, account_class, account_group, account_type, 
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), '4111', 'Clients', 'Client accounts receivable', 4, 41, 'ASSET',
            1, NOW(), NOW()
          );
        END IF;
        
        IF NOT EXISTS (SELECT FROM chart_of_accounts WHERE code = '5121') THEN
          INSERT INTO chart_of_accounts (
            id, code, name, description, account_class, account_group, account_type, 
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), '5121', 'Bank accounts in RON', 'Bank accounts in Romanian currency', 5, 51, 'ASSET',
            1, NOW(), NOW()
          );
        END IF;
        
        IF NOT EXISTS (SELECT FROM chart_of_accounts WHERE code = '5311') THEN
          INSERT INTO chart_of_accounts (
            id, code, name, description, account_class, account_group, account_type,
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), '5311', 'Cash in RON', 'Cash in Romanian currency', 5, 53, 'ASSET',
            1, NOW(), NOW()
          );
        END IF;

        -- VAT accounts for Romanian accounting (Class 4 - Third Party Accounts)
        IF NOT EXISTS (SELECT FROM chart_of_accounts WHERE code = '4426') THEN
          INSERT INTO chart_of_accounts (
            id, code, name, description, account_class, account_group, account_type,
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), '4426', 'TVA deductibilă', 'VAT deductible (exigible)', 4, 44, 'LIABILITY',
            1, NOW(), NOW()
          );
        END IF;

        IF NOT EXISTS (SELECT FROM chart_of_accounts WHERE code = '4428') THEN
          INSERT INTO chart_of_accounts (
            id, code, name, description, account_class, account_group, account_type,
            is_active, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), '4428', 'TVA neexigibilă', 'VAT deferred (cash basis)', 4, 44, 'LIABILITY',
            1, NOW(), NOW()
          );
        END IF;
      END $$;
    `);
    
    console.log('Accounting tables created successfully!');
    
    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('Error creating accounting tables:', error);
    process.exit(1);
  }
}

// Run the script
createAccountingTables();