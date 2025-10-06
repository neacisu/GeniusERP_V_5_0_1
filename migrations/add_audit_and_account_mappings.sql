-- Migration: Add audit_logs and account_mappings tables
-- RECOMANDARE 4 și 5: Audit logging și conturi configurabile
-- Created: 2025-10-06

-- =====================================================
-- RECOMANDARE 4: Tabel pentru audit logging
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    
    -- Action details
    action TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Entity reference
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Description and metadata
    description TEXT NOT NULL,
    metadata JSONB,
    
    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pentru audit_logs
CREATE INDEX IF NOT EXISTS audit_logs_company_idx ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

-- =====================================================
-- RECOMANDARE 5: Tabel pentru mapări conturi configurabile
-- =====================================================

-- Enum pentru tipuri de mapări
DO $$ BEGIN
    CREATE TYPE account_mapping_type AS ENUM (
        'CASH_RON',
        'CASH_CURRENCY',
        'PETTY_CASH',
        'BANK_PRIMARY',
        'BANK_CURRENCY',
        'CUSTOMERS',
        'SUPPLIERS',
        'EMPLOYEE_ADVANCES',
        'EMPLOYEE_PAYROLL',
        'VAT_COLLECTED',
        'VAT_DEDUCTIBLE',
        'UTILITIES',
        'SUPPLIES',
        'TRANSPORT',
        'OTHER_SERVICES',
        'BANK_FEES',
        'INTEREST_EXPENSE',
        'MERCHANDISE_SALES',
        'SERVICE_REVENUE',
        'INTEREST_INCOME',
        'INTERNAL_TRANSFERS',
        'CASH_SHORTAGES',
        'CASH_OVERAGES',
        'EXCHANGE_DIFF_INCOME',
        'EXCHANGE_DIFF_EXPENSE',
        'SHORT_TERM_LOANS',
        'LONG_TERM_LOANS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Mapping details
    mapping_type account_mapping_type NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    
    -- Configuration
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    -- Unique constraint: o singură mapare activă per tip per companie
    UNIQUE(company_id, mapping_type, is_active)
);

-- Indexes pentru account_mappings
CREATE INDEX IF NOT EXISTS account_mappings_company_idx ON account_mappings(company_id);
CREATE INDEX IF NOT EXISTS account_mappings_type_idx ON account_mappings(mapping_type);
CREATE INDEX IF NOT EXISTS account_mappings_active_idx ON account_mappings(is_active);

-- =====================================================
-- Inserare mapări default pentru companii existente
-- =====================================================

-- Inserăm mapări default pentru fiecare companie care nu le are deja
INSERT INTO account_mappings (company_id, mapping_type, account_code, account_name, is_default, is_active)
SELECT 
    c.id as company_id,
    mapping_type::account_mapping_type,
    account_code,
    account_name,
    true as is_default,
    true as is_active
FROM companies c
CROSS JOIN (VALUES
    ('CASH_RON', '5311', 'Casa în lei'),
    ('CASH_CURRENCY', '5314', 'Casa în valută'),
    ('PETTY_CASH', '5321', 'Casa de avansuri'),
    ('BANK_PRIMARY', '5121', 'Conturi la bănci în lei'),
    ('BANK_CURRENCY', '5124', 'Conturi la bănci în valută'),
    ('CUSTOMERS', '4111', 'Clienți'),
    ('SUPPLIERS', '401', 'Furnizori'),
    ('EMPLOYEE_ADVANCES', '425', 'Avansuri de trezorerie'),
    ('EMPLOYEE_PAYROLL', '421', 'Personal - salarii datorate'),
    ('VAT_COLLECTED', '4427', 'TVA colectată'),
    ('VAT_DEDUCTIBLE', '4426', 'TVA deductibilă'),
    ('BANK_FEES', '627', 'Comisioane bancare'),
    ('INTEREST_INCOME', '766', 'Venituri din dobânzi'),
    ('INTEREST_EXPENSE', '666', 'Cheltuieli cu dobânzi'),
    ('INTERNAL_TRANSFERS', '581', 'Viramente interne'),
    ('CASH_SHORTAGES', '6581', 'Lipsuri de casa'),
    ('CASH_OVERAGES', '7588', 'Plusuri de casa'),
    ('EXCHANGE_DIFF_INCOME', '765', 'Venituri din diferențe de curs'),
    ('EXCHANGE_DIFF_EXPENSE', '665', 'Cheltuieli din diferențe de curs')
) AS defaults(mapping_type, account_code, account_name)
WHERE NOT EXISTS (
    SELECT 1 FROM account_mappings am 
    WHERE am.company_id = c.id 
    AND am.mapping_type = defaults.mapping_type::account_mapping_type
);

-- =====================================================
-- Comentarii și documentație
-- =====================================================

COMMENT ON TABLE audit_logs IS 'Jurnal de audit pentru toate acțiunile critice din sistem (RECOMANDARE 4)';
COMMENT ON TABLE account_mappings IS 'Mapări configurabile pentru planul de conturi contabile (RECOMANDARE 5)';

COMMENT ON COLUMN audit_logs.severity IS 'Severitate: info, warning, critical';
COMMENT ON COLUMN audit_logs.metadata IS 'Date suplimentare în format JSON pentru context complet';

COMMENT ON COLUMN account_mappings.mapping_type IS 'Tipul de operațiune contabilă pentru care se folosește acest cont';
COMMENT ON COLUMN account_mappings.is_default IS 'Marcaj pentru mapări default create automat de sistem';

-- =====================================================
-- Trigger pentru updated_at pe account_mappings
-- =====================================================

CREATE OR REPLACE FUNCTION update_account_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER account_mappings_updated_at_trigger
    BEFORE UPDATE ON account_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_account_mappings_updated_at();

-- =====================================================
-- FINALIZARE
-- =====================================================

-- Verificare finală
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as row_count 
FROM audit_logs
UNION ALL
SELECT 
    'account_mappings' as table_name,
    COUNT(*) as row_count
FROM account_mappings;
