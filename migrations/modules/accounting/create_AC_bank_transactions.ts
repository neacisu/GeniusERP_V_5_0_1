/**
 * Migration: Create AC_bank_transactions table
 * Tranzacții bancare
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating enums for bank transactions...');
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE bank_transaction_type AS ENUM (
        'incoming_payment', 'outgoing_payment', 'bank_fee', 'bank_interest',
        'transfer_between_accounts', 'loan_disbursement', 'loan_repayment',
        'foreign_exchange', 'other'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE bank_payment_method AS ENUM (
        'bank_transfer', 'direct_debit', 'card_payment', 'standing_order',
        'online_banking', 'mobile_banking', 'other'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('📊 Creating AC_bank_transactions table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_bank_transactions" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      bank_account_id uuid NOT NULL,
      reference_number text NOT NULL,
      transaction_type bank_transaction_type NOT NULL,
      payment_method bank_payment_method,
      transaction_date timestamp NOT NULL,
      value_date timestamp,
      amount numeric(15,2) NOT NULL,
      currency text NOT NULL DEFAULT 'RON',
      exchange_rate numeric(10,4) DEFAULT 1.0000,
      description text NOT NULL,
      payer_name text,
      payee_name text,
      invoice_number text,
      invoice_id uuid,
      contract_number text,
      balance_before numeric(15,2) NOT NULL,
      balance_after numeric(15,2) NOT NULL,
      is_posted boolean NOT NULL DEFAULT false,
      ledger_entry_id uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      created_by uuid NOT NULL,
      
      CONSTRAINT "AC_bank_transactions_company_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_bank_transactions_account_fkey" FOREIGN KEY (bank_account_id) REFERENCES AC_bank_accounts(id),
      CONSTRAINT "AC_bank_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  await db.execute(sql`CREATE INDEX idx_AC_bank_transactions_company ON AC_bank_transactions(company_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_bank_transactions_account ON AC_bank_transactions(bank_account_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_bank_transactions_date ON AC_bank_transactions(transaction_date);`);

  console.log('✅ AC_bank_transactions created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_bank_transactions";`);
  await db.execute(sql`DROP TYPE IF EXISTS bank_transaction_type;`);
  await db.execute(sql`DROP TYPE IF EXISTS bank_payment_method;`);
};

