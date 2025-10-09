/**
 * Migrație: Sincronizare fiscal_periods cu schema Drizzle + extindere companies
 * 
 * Această migrație sincronizează DB-ul cu schema Drizzle și adaugă configurări
 * necesare pentru închiderea fiscală conformă cu OMFP 1802/2014
 * 
 * Data: 2025-10-09
 */

-- ============================================================================
-- PARTEA 1: Sincronizare fiscal_periods cu schema Drizzle
-- ============================================================================

-- Verifică și adaugă coloana 'status' dacă nu există
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiscal_periods' AND column_name = 'status'
    ) THEN
        ALTER TABLE fiscal_periods 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'open';
        
        COMMENT ON COLUMN fiscal_periods.status IS 'Status perioadă: open, soft_close, hard_close';
        
        RAISE NOTICE '✅ Coloană status adăugată la fiscal_periods';
    ELSE
        RAISE NOTICE 'ℹ️  Coloană status există deja în fiscal_periods';
    END IF;
END $$;

-- Convertește is_closed de la numeric la boolean dacă este necesar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiscal_periods' 
        AND column_name = 'is_closed' 
        AND data_type = 'numeric'
    ) THEN
        -- Creează coloană temporară boolean
        ALTER TABLE fiscal_periods ADD COLUMN is_closed_temp BOOLEAN;
        
        -- Copiază valorile convertite
        UPDATE fiscal_periods SET is_closed_temp = (is_closed::int != 0);
        
        -- Șterge coloana veche
        ALTER TABLE fiscal_periods DROP COLUMN is_closed;
        
        -- Redenumește coloana nouă
        ALTER TABLE fiscal_periods RENAME COLUMN is_closed_temp TO is_closed;
        
        -- Setează default
        ALTER TABLE fiscal_periods ALTER COLUMN is_closed SET DEFAULT FALSE;
        ALTER TABLE fiscal_periods ALTER COLUMN is_closed SET NOT NULL;
        
        RAISE NOTICE '✅ Coloană is_closed convertită de la numeric la boolean';
    ELSE
        RAISE NOTICE 'ℹ️  Coloană is_closed este deja boolean sau nu există';
    END IF;
END $$;

-- Adaugă coloane pentru redeschidere perioadă
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiscal_periods' AND column_name = 'reopened_at'
    ) THEN
        ALTER TABLE fiscal_periods ADD COLUMN reopened_at TIMESTAMP;
        COMMENT ON COLUMN fiscal_periods.reopened_at IS 'Data redeschiderii perioadei';
        RAISE NOTICE '✅ Coloană reopened_at adăugată';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiscal_periods' AND column_name = 'reopened_by'
    ) THEN
        ALTER TABLE fiscal_periods ADD COLUMN reopened_by UUID REFERENCES users(id);
        COMMENT ON COLUMN fiscal_periods.reopened_by IS 'Utilizatorul care a redeschis perioada';
        RAISE NOTICE '✅ Coloană reopened_by adăugată';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fiscal_periods' AND column_name = 'reopening_reason'
    ) THEN
        ALTER TABLE fiscal_periods ADD COLUMN reopening_reason TEXT;
        COMMENT ON COLUMN fiscal_periods.reopening_reason IS 'Motivul redeschiderii perioadei';
        RAISE NOTICE '✅ Coloană reopening_reason adăugată';
    END IF;
END $$;

-- Actualizează valorile status pentru perioade existente bazat pe is_closed
UPDATE fiscal_periods 
SET status = CASE 
    WHEN is_closed = TRUE THEN 'soft_close'
    ELSE 'open'
END
WHERE status = 'open' AND is_closed = TRUE;

-- Crează index pentru status
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON fiscal_periods(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company_year_month ON fiscal_periods(company_id, year, month);

RAISE NOTICE '✅ Indexuri create pentru fiscal_periods';

-- ============================================================================
-- PARTEA 2: Extindere tabel companies pentru închidere fiscală
-- ============================================================================

-- Crează ENUM pentru categoria entității conform OMFP 1802/2014
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_category') THEN
        CREATE TYPE entity_category AS ENUM ('micro', 'small', 'medium', 'large');
        RAISE NOTICE '✅ ENUM entity_category creat';
    ELSE
        RAISE NOTICE 'ℹ️  ENUM entity_category există deja';
    END IF;
END $$;

-- Adaugă coloană entity_category la companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'entity_category'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN entity_category entity_category DEFAULT 'small';
        
        COMMENT ON COLUMN companies.entity_category IS 'Categoria entității conform OMFP 1802/2014: micro, small, medium, large';
        
        RAISE NOTICE '✅ Coloană entity_category adăugată la companies';
    ELSE
        RAISE NOTICE 'ℹ️  Coloană entity_category există deja în companies';
    END IF;
END $$;

-- Adaugă coloană fiscal_year_end_month (pentru firme cu an fiscal diferit)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'fiscal_year_end_month'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN fiscal_year_end_month INTEGER DEFAULT 12 CHECK (fiscal_year_end_month BETWEEN 1 AND 12);
        
        COMMENT ON COLUMN companies.fiscal_year_end_month IS 'Luna de încheiere an fiscal (1-12), default 12 = Decembrie';
        
        RAISE NOTICE '✅ Coloană fiscal_year_end_month adăugată la companies';
    ELSE
        RAISE NOTICE 'ℹ️  Coloană fiscal_year_end_month există deja în companies';
    END IF;
END $$;

-- Adaugă coloană accounting_method
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'accounting_method'
    ) THEN
        ALTER TABLE companies 
        ADD COLUMN accounting_method TEXT DEFAULT 'accrual' CHECK (accounting_method IN ('accrual', 'cash'));
        
        COMMENT ON COLUMN companies.accounting_method IS 'Metodă contabilă: accrual (angajamente) sau cash (numerar)';
        
        RAISE NOTICE '✅ Coloană accounting_method adăugată la companies';
    ELSE
        RAISE NOTICE 'ℹ️  Coloană accounting_method există deja în companies';
    END IF;
END $$;

-- Crează index pentru categoria entității
CREATE INDEX IF NOT EXISTS idx_companies_entity_category ON companies(entity_category);

-- ============================================================================
-- PARTEA 3: Verificări și validări finale
-- ============================================================================

-- Verifică că toate coloanele au fost adăugate corect
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    -- Verifică fiscal_periods
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fiscal_periods' AND column_name = 'status') THEN
        missing_columns := missing_columns || 'fiscal_periods.status, ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fiscal_periods' AND column_name = 'reopened_at') THEN
        missing_columns := missing_columns || 'fiscal_periods.reopened_at, ';
    END IF;
    
    -- Verifică companies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'entity_category') THEN
        missing_columns := missing_columns || 'companies.entity_category, ';
    END IF;
    
    IF missing_columns != '' THEN
        RAISE EXCEPTION '❌ Coloane lipsă după migrație: %', missing_columns;
    ELSE
        RAISE NOTICE '✅ Toate coloanele au fost create cu succes!';
    END IF;
END $$;

-- Afișează statistici
DO $$
DECLARE
    period_count INTEGER;
    company_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO period_count FROM fiscal_periods;
    SELECT COUNT(*) INTO company_count FROM companies;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAȚIE COMPLETATĂ CU SUCCES!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Perioade fiscale în DB: %', period_count;
    RAISE NOTICE 'Companii în DB: %', company_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Schema fiscal_periods sincronizată cu Drizzle ✅';
    RAISE NOTICE 'Schema companies extinsă pentru închidere fiscală ✅';
    RAISE NOTICE '========================================';
END $$;

