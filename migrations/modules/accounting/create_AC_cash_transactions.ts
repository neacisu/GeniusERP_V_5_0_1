/**
 * Migration: Create AC_cash_transactions table
 * Tranzacții casă conform OMFP 2861/2009
 */

import { sql } from 'drizzle-orm';

export const up = async (db: any) => {
  console.log('📊 Creating enums for cash transactions...');
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE cash_transaction_type AS ENUM (
        'cash_receipt', 'cash_payment', 'petty_cash_advance', 
        'petty_cash_settlement', 'cash_count_adjustment', 
        'cash_transfer', 'bank_deposit', 'bank_withdrawal'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE cash_transaction_purpose AS ENUM (
        'customer_payment', 'supplier_payment', 'salary_payment',
        'expense_payment', 'advance_to_employee', 'advance_settlement',
        'bank_deposit', 'cash_withdrawal', 'refund', 'other'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('📊 Creating AC_cash_transactions table...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "AC_cash_transactions" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id uuid NOT NULL,
      franchise_id uuid,
      cash_register_id uuid NOT NULL,
      document_number text NOT NULL,
      series text NOT NULL,
      number numeric NOT NULL,
      transaction_type cash_transaction_type NOT NULL,
      transaction_purpose cash_transaction_purpose NOT NULL,
      transaction_date timestamp NOT NULL,
      amount numeric(15,2) NOT NULL,
      vat_amount numeric(15,2) DEFAULT 0,
      vat_rate numeric(5,2) DEFAULT 19,
      net_amount numeric(15,2),
      currency text NOT NULL DEFAULT 'RON',
      exchange_rate numeric(10,4) DEFAULT 1.0000,
      person_id uuid,
      person_name text NOT NULL,
      person_id_number text,
      person_address text,
      invoice_id uuid,
      invoice_number text,
      contract_number text,
      description text NOT NULL,
      is_fiscal_receipt boolean NOT NULL DEFAULT false,
      fiscal_receipt_number text,
      fiscal_receipt_data text,
      balance_before numeric(15,2) NOT NULL,
      balance_after numeric(15,2) NOT NULL,
      is_posted boolean NOT NULL DEFAULT false,
      posted_at timestamp,
      ledger_entry_id uuid,
      is_canceled boolean NOT NULL DEFAULT false,
      canceled_at timestamp,
      canceled_by uuid,
      cancellation_reason text,
      notes text,
      metadata text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      created_by uuid NOT NULL,
      updated_by uuid,
      
      CONSTRAINT "AC_cash_transactions_company_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
      CONSTRAINT "AC_cash_transactions_register_fkey" FOREIGN KEY (cash_register_id) REFERENCES AC_cash_registers(id),
      CONSTRAINT "AC_cash_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id),
      CONSTRAINT "AC_cash_transactions_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES users(id),
      CONSTRAINT "AC_cash_transactions_canceled_by_fkey" FOREIGN KEY (canceled_by) REFERENCES users(id)
    );
  `);

  await db.execute(sql`CREATE INDEX idx_AC_cash_transactions_company ON AC_cash_transactions(company_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_cash_transactions_register ON AC_cash_transactions(cash_register_id);`);
  await db.execute(sql`CREATE INDEX idx_AC_cash_transactions_date ON AC_cash_transactions(transaction_date);`);
  await db.execute(sql`CREATE INDEX idx_AC_cash_transactions_type ON AC_cash_transactions(transaction_type);`);

  console.log('✅ AC_cash_transactions created');
};

export const down = async (db: any) => {
  await db.execute(sql`DROP TABLE IF EXISTS "AC_cash_transactions";`);
  await db.execute(sql`DROP TYPE IF EXISTS cash_transaction_type;`);
  await db.execute(sql`DROP TYPE IF EXISTS cash_transaction_purpose;`);
};

