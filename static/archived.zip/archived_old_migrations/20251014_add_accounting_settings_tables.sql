-- Migration: Add Accounting Settings Tables
-- Description: Creates tables for accounting settings, VAT settings, account relationships, and opening balances
-- Author: AI Assistant
-- Date: 2025-10-14

-- ============================================================
-- 1. ACCOUNTING SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS accounting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Configurări generale
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12),
  require_approval BOOLEAN DEFAULT false,
  auto_numbering BOOLEAN DEFAULT true,
  
  -- Funcționalități activate
  enable_analytic_accounting BOOLEAN DEFAULT false,
  enable_multi_currency BOOLEAN DEFAULT false,
  enable_fixed_assets BOOLEAN DEFAULT false,
  enable_cost_centers BOOLEAN DEFAULT false,
  enable_projects BOOLEAN DEFAULT false,
  
  -- Integrări externe
  enable_saft_export BOOLEAN DEFAULT false,
  enable_anaf_efactura BOOLEAN DEFAULT false,
  anaf_api_key TEXT,
  
  -- Onboarding
  has_accounting_history BOOLEAN DEFAULT false,
  accounting_start_date DATE,
  opening_balances_imported BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(company_id)
);

-- Index pentru performanță
CREATE INDEX IF NOT EXISTS idx_accounting_settings_company_id ON accounting_settings(company_id);

-- Comentarii
COMMENT ON TABLE accounting_settings IS 'Setări generale pentru modulul de contabilitate per companie';
COMMENT ON COLUMN accounting_settings.fiscal_year_start_month IS 'Luna de start an fiscal (1=Ianuarie, 12=Decembrie)';
COMMENT ON COLUMN accounting_settings.require_approval IS 'Notele contabile necesită aprobare înainte de postare';
COMMENT ON COLUMN accounting_settings.auto_numbering IS 'Numerotare automată pentru jurnale și documente';

-- ============================================================
-- 2. VAT SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS vat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Regim TVA
  vat_payer BOOLEAN DEFAULT true,
  use_cash_vat BOOLEAN DEFAULT false,
  cash_vat_threshold DECIMAL(15,2) DEFAULT 2250000.00 CHECK (cash_vat_threshold >= 0),
  
  -- Cote TVA
  standard_vat_rate INTEGER DEFAULT 19 CHECK (standard_vat_rate >= 0 AND standard_vat_rate <= 100),
  reduced_vat_rate_1 INTEGER DEFAULT 9 CHECK (reduced_vat_rate_1 >= 0 AND reduced_vat_rate_1 <= 100),
  reduced_vat_rate_2 INTEGER DEFAULT 5 CHECK (reduced_vat_rate_2 >= 0 AND reduced_vat_rate_2 <= 100),
  
  -- Conturi TVA
  vat_collected_account TEXT DEFAULT '4427',
  vat_deductible_account TEXT DEFAULT '4426',
  vat_payable_account TEXT DEFAULT '4423',
  vat_receivable_account TEXT DEFAULT '4424',
  
  -- Periodicitate declarație
  declaration_frequency TEXT DEFAULT 'monthly' CHECK (declaration_frequency IN ('monthly', 'quarterly')),
  
  -- Validare automată CUI
  enable_vat_validation BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id)
);

-- Index pentru performanță
CREATE INDEX IF NOT EXISTS idx_vat_settings_company_id ON vat_settings(company_id);

-- Comentarii
COMMENT ON TABLE vat_settings IS 'Setări TVA per companie conform legislației române';
COMMENT ON COLUMN vat_settings.vat_payer IS 'Compania este plătitoare de TVA';
COMMENT ON COLUMN vat_settings.use_cash_vat IS 'TVA la încasare (conform Legii 227/2015)';
COMMENT ON COLUMN vat_settings.cash_vat_threshold IS 'Prag TVA la încasare în RON (default: 2.250.000 RON)';
COMMENT ON COLUMN vat_settings.declaration_frequency IS 'Frecvență declarație TVA: monthly sau quarterly';

-- ============================================================
-- 3. ACCOUNT RELATIONSHIPS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS account_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Relație contabilă
  relationship_type TEXT NOT NULL,
  description TEXT,
  
  -- Contul debit
  debit_account_code TEXT NOT NULL,
  debit_account_name TEXT,
  
  -- Contul credit
  credit_account_code TEXT NOT NULL,
  credit_account_name TEXT,
  
  -- Configurare
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0 CHECK (priority >= 0),
  
  -- Condiții (JSON)
  conditions JSONB,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(company_id, relationship_type, debit_account_code, credit_account_code)
);

-- Index-uri pentru performanță
CREATE INDEX IF NOT EXISTS idx_account_relationships_company_id ON account_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_account_relationships_type ON account_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_account_relationships_active ON account_relationships(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_account_relationships_priority ON account_relationships(priority DESC);

-- Index GIN pentru căutare în conditions JSONB
CREATE INDEX IF NOT EXISTS idx_account_relationships_conditions ON account_relationships USING GIN (conditions);

-- Comentarii
COMMENT ON TABLE account_relationships IS 'Relații automate între conturi pentru operațiuni contabile';
COMMENT ON COLUMN account_relationships.relationship_type IS 'Tip operațiune: CUSTOMER_PAYMENT, SUPPLIER_PAYMENT, etc.';
COMMENT ON COLUMN account_relationships.priority IS 'Prioritate pentru reguli multiple (mai mare = prioritate mai înaltă)';
COMMENT ON COLUMN account_relationships.conditions IS 'Condiții JSON pentru aplicare automată (ex: document_type, vat_category)';

-- ============================================================
-- 4. OPENING BALANCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS opening_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Cont contabil
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  
  -- Solduri
  debit_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (debit_balance >= 0),
  credit_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (credit_balance >= 0),
  
  -- Metadata
  fiscal_year INTEGER NOT NULL CHECK (fiscal_year >= 2000 AND fiscal_year <= 2100),
  import_date DATE NOT NULL DEFAULT CURRENT_DATE,
  import_source TEXT CHECK (import_source IN ('MANUAL', 'CSV', 'EXCEL', 'API')),
  
  -- Status
  is_validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  UNIQUE(company_id, account_code, fiscal_year),
  
  -- Constrângere: nu poate avea debit și credit în același timp
  CHECK (
    (debit_balance > 0 AND credit_balance = 0) OR 
    (debit_balance = 0 AND credit_balance > 0) OR 
    (debit_balance = 0 AND credit_balance = 0)
  )
);

-- Index-uri pentru performanță
CREATE INDEX IF NOT EXISTS idx_opening_balances_company_id ON opening_balances(company_id);
CREATE INDEX IF NOT EXISTS idx_opening_balances_fiscal_year ON opening_balances(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_opening_balances_account_code ON opening_balances(account_code);
CREATE INDEX IF NOT EXISTS idx_opening_balances_validated ON opening_balances(is_validated) WHERE is_validated = true;

-- Comentarii
COMMENT ON TABLE opening_balances IS 'Solduri inițiale pentru companii cu istoric contabil';
COMMENT ON COLUMN opening_balances.account_code IS 'Cod cont contabil conform planului de conturi';
COMMENT ON COLUMN opening_balances.fiscal_year IS 'Anul fiscal pentru care se importă soldurile';
COMMENT ON COLUMN opening_balances.import_source IS 'Sursa importului: MANUAL, CSV, EXCEL, API';
COMMENT ON COLUMN opening_balances.is_validated IS 'Sold validat (echilibrul debit/credit verificat la nivel global)';

-- ============================================================
-- 5. TRIGGER-URI PENTRU AUDIT
-- ============================================================

-- Trigger pentru actualizare updated_at în accounting_settings
CREATE OR REPLACE FUNCTION update_accounting_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accounting_settings_updated_at
  BEFORE UPDATE ON accounting_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_settings_updated_at();

-- Trigger pentru actualizare updated_at în vat_settings
CREATE OR REPLACE FUNCTION update_vat_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vat_settings_updated_at
  BEFORE UPDATE ON vat_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_vat_settings_updated_at();

-- Trigger pentru actualizare updated_at în account_relationships
CREATE OR REPLACE FUNCTION update_account_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_account_relationships_updated_at
  BEFORE UPDATE ON account_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_account_relationships_updated_at();

-- Trigger pentru actualizare updated_at în opening_balances
CREATE OR REPLACE FUNCTION update_opening_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_opening_balances_updated_at
  BEFORE UPDATE ON opening_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_opening_balances_updated_at();

-- ============================================================
-- 6. POPULARE DATE DEFAULT
-- ============================================================

-- Insert default accounting_settings pentru companii existente
INSERT INTO accounting_settings (company_id)
SELECT id FROM companies 
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_settings WHERE company_id = companies.id
);

-- Insert default vat_settings pentru companii existente
-- Preia valorile existente din companies (vat_payer, vat_rate)
INSERT INTO vat_settings (
  company_id, 
  vat_payer, 
  standard_vat_rate
)
SELECT 
  id, 
  COALESCE(vat_payer, true), 
  COALESCE(vat_rate, 19)
FROM companies
WHERE NOT EXISTS (
  SELECT 1 FROM vat_settings WHERE company_id = companies.id
);

-- ============================================================
-- 7. GRANT PERMISSIONS
-- ============================================================

-- Grant permissions pentru tabele noi
-- Nota: Adaptați rolurile în funcție de setup-ul dvs. de securitate

-- GRANT SELECT, INSERT, UPDATE, DELETE ON accounting_settings TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON vat_settings TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON account_relationships TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON opening_balances TO app_user;

-- ============================================================
-- FIN MIGRAȚIE
-- ============================================================

-- Log success
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully: accounting_settings tables created';
  RAISE NOTICE 'Tables created: accounting_settings, vat_settings, account_relationships, opening_balances';
  RAISE NOTICE 'Indexes and triggers created successfully';
  RAISE NOTICE 'Default data populated for existing companies';
END $$;

