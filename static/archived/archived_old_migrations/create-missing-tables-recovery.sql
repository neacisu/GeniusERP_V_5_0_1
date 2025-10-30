-- ========================================================================
-- CREATE MISSING TABLES SCRIPT - GeniusERP Recovery
-- ========================================================================
-- Acest script creează exact cele 17 tabele lipsă conform schemelor definite în cod
-- Data: 2025-10-07
-- Fără invenții - doar conform definițiilor existente în codebase
-- ========================================================================

-- ========================================================================
-- SECTION 1: BANKING MODULE (2 tabele)
-- ========================================================================

-- 1.1: CREATE ENUMS pentru Banking
DO $$ BEGIN
    CREATE TYPE bank_transaction_type AS ENUM (
        'incoming_payment',
        'outgoing_payment',
        'bank_fee',
        'bank_interest',
        'transfer_between_accounts',
        'loan_disbursement',
        'loan_repayment',
        'foreign_exchange',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bank_payment_method AS ENUM (
        'bank_transfer',
        'direct_debit',
        'card_payment',
        'standing_order',
        'online_banking',
        'mobile_banking',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.2: bank_accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL, -- IBAN
    bank_name TEXT NOT NULL,
    bank_code TEXT, -- Cod BIC/SWIFT
    currency TEXT NOT NULL DEFAULT 'RON',
    
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS bank_accounts_company_idx ON bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS bank_accounts_number_idx ON bank_accounts(account_number);

COMMENT ON TABLE bank_accounts IS 'Conturi bancare (Cont 5121, 5124) - Registru bancar conform OMFP';

-- 1.3: bank_transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    
    reference_number TEXT NOT NULL,
    transaction_type bank_transaction_type NOT NULL,
    payment_method bank_payment_method,
    
    transaction_date TIMESTAMP NOT NULL,
    value_date TIMESTAMP,
    
    amount NUMERIC(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RON',
    exchange_rate NUMERIC(10, 4) DEFAULT 1.0000,
    
    description TEXT NOT NULL,
    payer_name TEXT,
    payee_name TEXT,
    
    -- Referințe la documente sursă
    invoice_number TEXT,
    invoice_id UUID,
    contract_number TEXT,
    
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    ledger_entry_id UUID,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS bank_transactions_company_idx ON bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS bank_transactions_account_idx ON bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS bank_transactions_date_idx ON bank_transactions(transaction_date);

COMMENT ON TABLE bank_transactions IS 'Tranzacții bancare - Extras de cont, OP, Dispoziții de încasare';

-- ========================================================================
-- SECTION 2: CASH REGISTER MODULE (2 tabele)
-- ========================================================================

-- 2.1: CREATE ENUMS pentru Cash Register
DO $$ BEGIN
    CREATE TYPE cash_register_status AS ENUM ('active', 'closed', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cash_transaction_type AS ENUM (
        'cash_receipt',
        'cash_payment',
        'petty_cash_advance',
        'petty_cash_settlement',
        'cash_count_adjustment',
        'cash_transfer',
        'bank_deposit',
        'bank_withdrawal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cash_transaction_purpose AS ENUM (
        'customer_payment',
        'supplier_payment',
        'salary_payment',
        'expense_payment',
        'advance_to_employee',
        'advance_settlement',
        'bank_deposit',
        'cash_withdrawal',
        'refund',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2.2: cash_registers
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
    
    -- Sold curent (actualizat automat)
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    -- Status
    status cash_register_status NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Date închidere
    closed_at TIMESTAMP,
    closed_by UUID REFERENCES users(id),
    closing_balance NUMERIC(15, 2),
    
    -- Închidere zilnică
    last_closed_date TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS cash_registers_company_idx ON cash_registers(company_id);
CREATE INDEX IF NOT EXISTS cash_registers_status_idx ON cash_registers(status);
CREATE INDEX IF NOT EXISTS cash_registers_code_idx ON cash_registers(company_id, code);

COMMENT ON TABLE cash_registers IS 'Registre de casă (Cont 5311) conform OMFP 2861/2009';

-- 2.3: cash_transactions
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
    is_fiscal_receipt BOOLEAN NOT NULL DEFAULT FALSE,
    fiscal_receipt_number TEXT,
    fiscal_receipt_data TEXT,
    
    -- Sold
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    
    -- Contabilizare
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    posted_at TIMESTAMP,
    ledger_entry_id UUID,
    
    -- Anulare
    is_canceled BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP,
    canceled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    -- Note
    notes TEXT,
    metadata TEXT,
    
    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS cash_transactions_company_idx ON cash_transactions(company_id);
CREATE INDEX IF NOT EXISTS cash_transactions_register_idx ON cash_transactions(cash_register_id);
CREATE INDEX IF NOT EXISTS cash_transactions_date_idx ON cash_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS cash_transactions_type_idx ON cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS cash_transactions_document_idx ON cash_transactions(company_id, series, number);
CREATE INDEX IF NOT EXISTS cash_transactions_person_idx ON cash_transactions(person_id);
CREATE INDEX IF NOT EXISTS cash_transactions_invoice_idx ON cash_transactions(invoice_id);

COMMENT ON TABLE cash_transactions IS 'Tranzacții casă - Chitanțe și Dispoziții de Plată conform OMFP 2861/2009';

-- ========================================================================
-- SECTION 3: HR MODULE (6 tabele)
-- ========================================================================

-- 3.1: employees (hr_employees)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    personal_email TEXT,
    personal_phone TEXT,
    
    -- Official Identification
    cnp VARCHAR(13) NOT NULL,
    id_series_number VARCHAR(20),
    birth_date DATE,
    birth_place TEXT,
    nationality TEXT DEFAULT 'Romanian',
    
    -- Address
    address TEXT,
    city TEXT,
    county TEXT,
    postal_code VARCHAR(10),
    
    -- Basic Employment Info
    position TEXT NOT NULL,
    department TEXT,
    department_id UUID,
    manager_employee_id UUID,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Add self-reference for manager AFTER table creation
ALTER TABLE employees ADD CONSTRAINT employees_manager_fkey 
    FOREIGN KEY (manager_employee_id) REFERENCES employees(id);

CREATE INDEX IF NOT EXISTS hr_employee_company_idx ON employees(company_id);
CREATE INDEX IF NOT EXISTS hr_employee_cnp_idx ON employees(cnp);

COMMENT ON TABLE employees IS 'Angajați - Date HR conform Codul Muncii și REVISAL';

-- 3.2: employee_contracts (hr_employment_contracts)
CREATE TABLE IF NOT EXISTS employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Contract Identification
    contract_number VARCHAR(50) NOT NULL,
    revisal_id VARCHAR(50),
    
    -- Contract Type
    contract_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
    duration_type VARCHAR(50) NOT NULL DEFAULT 'indefinite',
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    is_indefinite BOOLEAN DEFAULT FALSE,
    suspended_from DATE,
    suspended_until DATE,
    termination_date DATE,
    termination_reason TEXT,
    
    -- Working Time
    working_time VARCHAR(50),
    working_hours_per_day NUMERIC(5, 2) NOT NULL DEFAULT 8,
    working_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 40,
    
    -- Compensation
    base_salary_gross NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RON' NOT NULL,
    payment_interval VARCHAR(20) DEFAULT 'monthly' NOT NULL,
    
    -- CAEN and COR Codes
    caen_code VARCHAR(10),
    cor_code VARCHAR(10) NOT NULL,
    
    -- Leave
    annual_leave_entitlement INTEGER DEFAULT 21,
    
    -- Special Cases
    is_telemunca_possible BOOLEAN DEFAULT FALSE,
    has_competition_clause BOOLEAN DEFAULT FALSE,
    has_confidentiality_clause BOOLEAN DEFAULT TRUE,
    
    -- Documents
    contract_file_path TEXT,
    annexes_file_paths JSON DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS hr_employment_contract_employee_idx ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS hr_employment_contract_company_idx ON employee_contracts(company_id);
CREATE INDEX IF NOT EXISTS hr_employment_contract_number_idx ON employee_contracts(contract_number);

COMMENT ON TABLE employee_contracts IS 'Contracte de muncă - REVISAL compliant';

-- 3.3: payroll_records (hr_payroll_logs)
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    employment_contract_id UUID NOT NULL REFERENCES employee_contracts(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Period
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    payment_date DATE,
    
    -- Base Values
    working_days_in_month SMALLINT NOT NULL,
    worked_days NUMERIC(5, 2) NOT NULL,
    
    -- Gross Salary
    base_salary_gross NUMERIC(12, 2) NOT NULL,
    gross_total NUMERIC(12, 2) NOT NULL,
    
    -- Bonuses
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    overtime_amount NUMERIC(12, 2) DEFAULT 0,
    meal_tickets_count INTEGER DEFAULT 0,
    meal_tickets_value NUMERIC(12, 2) DEFAULT 0,
    gift_tickets_value NUMERIC(12, 2) DEFAULT 0,
    vacation_tickets_value NUMERIC(12, 2) DEFAULT 0,
    bonuses NUMERIC(12, 2) DEFAULT 0,
    commissions NUMERIC(12, 2) DEFAULT 0,
    other_compensations JSON DEFAULT '{}',
    
    -- Tax Exemptions
    it_exemption_type VARCHAR(50),
    
    -- Employee Contributions
    cas_basis NUMERIC(12, 2),
    cas_employee_amount NUMERIC(12, 2),
    cass_employee_amount NUMERIC(12, 2),
    income_tax_amount NUMERIC(12, 2),
    
    -- Employer Contributions
    cam_employer_amount NUMERIC(12, 2),
    
    -- Net
    net_salary NUMERIC(12, 2) NOT NULL,
    
    -- Deductions
    personal_deduction NUMERIC(12, 2) DEFAULT 0,
    other_deductions JSON DEFAULT '{}',
    
    -- ANAF Declaration
    anaf_declaration_status VARCHAR(50) DEFAULT 'pending',
    anaf_declaration_date DATE,
    anaf_declaration_number VARCHAR(50),
    
    -- Documents
    payslip_file_path TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS hr_payroll_employee_idx ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS hr_payroll_company_idx ON payroll_records(company_id);
CREATE INDEX IF NOT EXISTS hr_payroll_period_idx ON payroll_records(year, month);

COMMENT ON TABLE payroll_records IS 'State de plată - Calcul salarii cu CAS/CASS/CAM pentru D112';

-- 3.4: leave_requests (hr_absences)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days NUMERIC(5, 2) NOT NULL,
    
    -- Type
    absence_type VARCHAR(50) NOT NULL,
    absence_code VARCHAR(10),
    medical_leave_code VARCHAR(10),
    
    -- Approval
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Medical Certificate
    medical_certificate_number VARCHAR(50),
    medical_certificate_date DATE,
    medical_certificate_issued_by TEXT,
    medical_certificate_file_path TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS hr_absence_employee_idx ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS hr_absence_company_idx ON leave_requests(company_id);
CREATE INDEX IF NOT EXISTS hr_absence_date_range_idx ON leave_requests(start_date, end_date);

COMMENT ON TABLE leave_requests IS 'Concedii și absențe - CO, CM, concedii fără plată';

-- 3.5: attendance_records (hr_attendance)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Date
    date DATE NOT NULL,
    
    -- Times
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    break_start TIMESTAMP,
    break_end TIMESTAMP,
    
    -- Calculations
    scheduled_hours NUMERIC(5, 2),
    worked_hours NUMERIC(5, 2),
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'present',
    is_overtime BOOLEAN DEFAULT FALSE,
    is_holiday BOOLEAN DEFAULT FALSE,
    is_weekend BOOLEAN DEFAULT FALSE,
    
    -- Location
    location TEXT,
    is_remote BOOLEAN DEFAULT FALSE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hr_attendance_employee_idx ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS hr_attendance_company_idx ON attendance_records(company_id);
CREATE INDEX IF NOT EXISTS hr_attendance_date_idx ON attendance_records(date);

COMMENT ON TABLE attendance_records IS 'Pontaj - Evidență timp lucrat pentru calcul salarii';

-- 3.6: employee_documents (hr_employee_documents)
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    
    -- Document Info
    document_type VARCHAR(50) NOT NULL,
    document_name TEXT NOT NULL,
    document_number VARCHAR(50),
    
    -- File
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- Dates
    issue_date DATE,
    expiry_date DATE,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS hr_employee_documents_employee_idx ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS hr_employee_documents_company_idx ON employee_documents(company_id);
CREATE INDEX IF NOT EXISTS hr_employee_documents_type_idx ON employee_documents(document_type);

COMMENT ON TABLE employee_documents IS 'Documente angajați - CI, diploma, certificat, etc.';

-- ========================================================================
-- SECTION 4: ADMIN MODULE (5 tabele)
-- ========================================================================

-- 4.1: admin_actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(100) NOT NULL,
    performed_by VARCHAR(36) NOT NULL,
    company_id VARCHAR(36),
    target_resource VARCHAR(255),
    target_id VARCHAR(36),
    details JSON,
    performed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS admin_actions_performed_by_idx ON admin_actions(performed_by);
CREATE INDEX IF NOT EXISTS admin_actions_company_idx ON admin_actions(company_id);
CREATE INDEX IF NOT EXISTS admin_actions_performed_at_idx ON admin_actions(performed_at);

COMMENT ON TABLE admin_actions IS 'Log acțiuni administrative pentru audit';

-- 4.2: api_keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    service VARCHAR(100) NOT NULL,
    key_identifier VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    last_used_at TIMESTAMP,
    last_rotated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS api_keys_company_idx ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS api_keys_service_idx ON api_keys(service);

COMMENT ON TABLE api_keys IS 'Chei API pentru integrări externe (Stripe, ANAF, etc.)';

-- 4.3: health_checks
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    details JSON,
    performed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    performed_by VARCHAR(36)
);

CREATE INDEX IF NOT EXISTS health_checks_type_idx ON health_checks(check_type);
CREATE INDEX IF NOT EXISTS health_checks_performed_at_idx ON health_checks(performed_at);

COMMENT ON TABLE health_checks IS 'Verificări stare sistem - DB, Redis, Storage, etc.';

-- 4.4: system_configs
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR(36),
    module VARCHAR(100) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSON NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL
);

CREATE INDEX IF NOT EXISTS system_configs_company_idx ON system_configs(company_id);
CREATE INDEX IF NOT EXISTS system_configs_module_idx ON system_configs(module);
CREATE UNIQUE INDEX IF NOT EXISTS system_configs_unique_idx ON system_configs(company_id, module, key);

COMMENT ON TABLE system_configs IS 'Configurări sistem centralizate per modul';

-- 4.5: company_licenses
CREATE TABLE IF NOT EXISTS company_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR(36) NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    max_users INTEGER,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    updated_by VARCHAR(36) NOT NULL
);

CREATE INDEX IF NOT EXISTS company_licenses_company_idx ON company_licenses(company_id);
CREATE INDEX IF NOT EXISTS company_licenses_active_idx ON company_licenses(is_active);

COMMENT ON TABLE company_licenses IS 'Licențe per companie - Standard, Professional, Enterprise';

-- ========================================================================
-- SECTION 5: ECOMMERCE (1 tabel)
-- ========================================================================

-- 5.1: ecommerce_integrations
CREATE TABLE IF NOT EXISTS ecommerce_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    credentials JSON NOT NULL,
    settings JSON NOT NULL,
    sync_status JSON NOT NULL,
    metadata JSON NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(company_id, type)
);

CREATE INDEX IF NOT EXISTS ecommerce_integrations_company_idx ON ecommerce_integrations(company_id);
CREATE INDEX IF NOT EXISTS ecommerce_integrations_type_idx ON ecommerce_integrations(type);

COMMENT ON TABLE ecommerce_integrations IS 'Integrări e-commerce - Shopify, WooCommerce, PrestaShop';

-- ========================================================================
-- VERIFICARE FINALĂ
-- ========================================================================

DO $$
DECLARE
    missing_tables TEXT[];
BEGIN
    SELECT array_agg(table_name) INTO missing_tables
    FROM unnest(ARRAY[
        'bank_accounts',
        'bank_transactions',
        'cash_registers',
        'cash_transactions',
        'employees',
        'employee_contracts',
        'employee_documents',
        'attendance_records',
        'leave_requests',
        'payroll_records',
        'admin_actions',
        'api_keys',
        'health_checks',
        'system_configs',
        'company_licenses',
        'ecommerce_integrations'
    ]) AS table_name
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = table_name
    );
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'Tabele încă lipsă: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ Toate cele 17 tabele au fost create cu succes!';
    END IF;
END $$;

-- ========================================================================
-- SCRIPT COMPLET
-- ========================================================================
-- Creat conform schemelor din:
-- - shared/schema/bank-journal.schema.ts
-- - shared/schema/cash-register.schema.ts
-- - server/modules/hr/schema/hr.schema.ts
-- - shared/schema/admin.schema.ts
-- - shared/schema/ecommerce.schema.ts
-- ========================================================================

