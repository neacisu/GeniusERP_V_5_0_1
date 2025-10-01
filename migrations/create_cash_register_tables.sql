-- Migration: Create Cash Register Tables - Romanian Accounting Standards
-- Date: 2025-10-01
-- Description: Implementare completă Registru de Casă conform OMFP 2861/2009 și Legea 82/1991

-- ============================================
-- CREATE ENUMS
-- ============================================

-- Cash Register Status
CREATE TYPE cash_register_status AS ENUM ('active', 'closed', 'suspended');

-- Cash Transaction Type
CREATE TYPE cash_transaction_type AS ENUM (
  'cash_receipt',          -- Chitanță - încasare
  'cash_payment',          -- Dispoziție de plată
  'petty_cash_advance',    -- Avans pentru cheltuieli
  'petty_cash_settlement', -- Decontare avans
  'cash_count_adjustment', -- Regularizare inventar
  'cash_transfer',         -- Transfer între case
  'bank_deposit',          -- Depunere la bancă
  'bank_withdrawal'        -- Ridicare de la bancă
);

-- Cash Transaction Purpose
CREATE TYPE cash_transaction_purpose AS ENUM (
  'customer_payment',      -- Plată de la client
  'supplier_payment',      -- Plată către furnizor
  'salary_payment',        -- Plată salariu
  'expense_payment',       -- Plată cheltuieli
  'advance_to_employee',   -- Avans către angajat
  'advance_settlement',    -- Decontare avans
  'bank_deposit',         -- Depunere la bancă
  'cash_withdrawal',      -- Ridicare numerar
  'refund',               -- Rambursare
  'other'                 -- Altele
);

-- ============================================
-- CREATE TABLES
-- ============================================

-- Cash Registers Table
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  franchise_id UUID,
  
  -- Identificare
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Tip și locație
  type TEXT NOT NULL DEFAULT 'main',
  location TEXT,
  
  -- Currency
  currency TEXT NOT NULL DEFAULT 'RON',
  
  -- Responsabil (Casier)
  responsible_person_id UUID REFERENCES users(id),
  responsible_person_name TEXT,
  
  -- Limite (conform legislației)
  daily_limit NUMERIC(15, 2),
  max_transaction_amount NUMERIC(15, 2),
  
  -- Sold curent
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- Status
  status cash_register_status NOT NULL DEFAULT 'active',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Date închidere
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES users(id),
  closing_balance NUMERIC(15, 2),
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Cash Transactions Table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  franchise_id UUID,
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
  
  -- Numerotare document
  document_number TEXT NOT NULL,
  series TEXT NOT NULL,
  number NUMERIC NOT NULL,
  
  -- Tip și scop
  transaction_type cash_transaction_type NOT NULL,
  transaction_purpose cash_transaction_purpose NOT NULL,
  
  -- Date și timp
  transaction_date TIMESTAMP NOT NULL,
  
  -- Sume
  amount NUMERIC(15, 2) NOT NULL,
  vat_amount NUMERIC(15, 2) DEFAULT 0,
  vat_rate NUMERIC(5, 2) DEFAULT 19,
  net_amount NUMERIC(15, 2),
  
  -- Currency
  currency TEXT NOT NULL DEFAULT 'RON',
  exchange_rate NUMERIC(10, 4) DEFAULT 1.0000,
  
  -- Persoană
  person_id UUID,
  person_name TEXT NOT NULL,
  person_id_number TEXT,
  person_address TEXT,
  
  -- Baza operațiunii
  invoice_id UUID,
  invoice_number TEXT,
  contract_number TEXT,
  description TEXT NOT NULL,
  
  -- Bon fiscal
  is_fiscal_receipt BOOLEAN NOT NULL DEFAULT false,
  fiscal_receipt_number TEXT,
  fiscal_receipt_data TEXT,
  
  -- Sold
  balance_before NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL,
  
  -- Contabilizare
  is_posted BOOLEAN NOT NULL DEFAULT false,
  posted_at TIMESTAMP,
  ledger_entry_id UUID,
  
  -- Anulare
  is_canceled BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMP,
  canceled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Note
  notes TEXT,
  metadata TEXT,
  
  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Cash Registers indexes
CREATE INDEX IF NOT EXISTS cash_registers_company_idx ON cash_registers(company_id);
CREATE INDEX IF NOT EXISTS cash_registers_status_idx ON cash_registers(status);
CREATE INDEX IF NOT EXISTS cash_registers_code_idx ON cash_registers(company_id, code);

-- Cash Transactions indexes
CREATE INDEX IF NOT EXISTS cash_transactions_company_idx ON cash_transactions(company_id);
CREATE INDEX IF NOT EXISTS cash_transactions_register_idx ON cash_transactions(cash_register_id);
CREATE INDEX IF NOT EXISTS cash_transactions_date_idx ON cash_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS cash_transactions_type_idx ON cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS cash_transactions_document_idx ON cash_transactions(company_id, series, number);
CREATE INDEX IF NOT EXISTS cash_transactions_person_idx ON cash_transactions(person_id);
CREATE INDEX IF NOT EXISTS cash_transactions_invoice_idx ON cash_transactions(invoice_id);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Get first company and user for test data
DO $$
DECLARE
    v_company_id UUID;
    v_user_id UUID;
    v_register_id UUID;
BEGIN
    -- Get first company
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    
    -- Get first user  
    SELECT id INTO v_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    IF v_company_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        -- Create main cash register
        INSERT INTO cash_registers (id, company_id, name, code, type, currency, current_balance, status, is_active, created_by)
        VALUES (
            gen_random_uuid(),
            v_company_id,
            'Casa Centrală',
            'CC',
            'main',
            'RON',
            5000.00,
            'active',
            true,
            v_user_id
        )
        RETURNING id INTO v_register_id;
        
        -- Create sample cash receipt
        INSERT INTO cash_transactions (
            company_id, cash_register_id, document_number, series, number,
            transaction_type, transaction_purpose, transaction_date,
            amount, vat_amount, vat_rate, net_amount, currency,
            person_name, description,
            balance_before, balance_after,
            is_posted, is_canceled, created_by
        )
        VALUES (
            v_company_id, v_register_id, 'CH-2025-00001', 'CH', 1,
            'cash_receipt', 'customer_payment', CURRENT_TIMESTAMP,
            2380.00, 380.00, 19, 2000.00, 'RON',
            'SC ABC SRL', 'Încasare factură TEST-0001',
            5000.00, 7380.00,
            false, false, v_user_id
        );
        
        -- Create sample cash payment
        INSERT INTO cash_transactions (
            company_id, cash_register_id, document_number, series, number,
            transaction_type, transaction_purpose, transaction_date,
            amount, currency,
            person_name, description,
            balance_before, balance_after,
            is_posted, is_canceled, created_by
        )
        VALUES (
            v_company_id, v_register_id, 'DP-2025-00001', 'DP', 1,
            'cash_payment', 'expense_payment', CURRENT_TIMESTAMP,
            500.00, 'RON',
            'Enel Energie', 'Plată factură energie electrică',
            7380.00, 6880.00,
            false, false, v_user_id
        );
        
        -- Update register balance
        UPDATE cash_registers 
        SET current_balance = 6880.00 
        WHERE id = v_register_id;
        
        RAISE NOTICE 'Created cash register with 2 sample transactions. Current balance: 6880.00 RON';
    ELSE
        RAISE NOTICE 'No company or user found. Skipping sample data.';
    END IF;
END $$;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE cash_registers IS 'Registrele de casă ale companiei - conform OMFP 2861/2009';
COMMENT ON TABLE cash_transactions IS 'Tranzacțiile de casă (Chitanțe și Dispoziții de Plată) - conform legislației românești';

COMMENT ON COLUMN cash_registers.daily_limit IS 'Limită zilnică de numerar conform politicii companiei';
COMMENT ON COLUMN cash_registers.current_balance IS 'Sold curent actualizat automat la fiecare tranzacție';

COMMENT ON COLUMN cash_transactions.person_id_number IS 'CNP sau Serie/Nr. CI - OBLIGATORIU pentru plăți >5000 RON și salarii';
COMMENT ON COLUMN cash_transactions.is_fiscal_receipt IS 'Bon fiscal emis prin POS fiscal';
COMMENT ON COLUMN cash_transactions.balance_before IS 'Sold înainte de tranzacție - pentru audit';
COMMENT ON COLUMN cash_transactions.balance_after IS 'Sold după tranzacție - pentru audit';

-- Verification
SELECT 
    (SELECT COUNT(*) FROM cash_registers) as total_registers,
    (SELECT COUNT(*) FROM cash_transactions) as total_transactions,
    (SELECT current_balance FROM cash_registers LIMIT 1) as current_balance;

