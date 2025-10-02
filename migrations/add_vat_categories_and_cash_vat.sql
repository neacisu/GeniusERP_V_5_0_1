-- Migration: Add VAT categories and Cash VAT support
-- Description: Implementare categorii fiscale și TVA la încasare conform OMFP 2634/2015
-- Date: 2025-10-02

-- 1. Adăugare câmp useCashVAT în tabela companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS use_cash_vat BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN companies.use_cash_vat IS 'Indicator dacă firma aplică TVA la încasare conform art. 282 Cod Fiscal';

-- 2. Adăugare câmp isCashVAT în tabela invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS is_cash_vat BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN invoices.is_cash_vat IS 'Indicator dacă factura este cu TVA la încasare - TVA devine exigibilă doar la momentul încasării';

-- 3. Creare enum pentru categoriile fiscale de TVA
DO $$ BEGIN
    CREATE TYPE vat_category AS ENUM (
        'STANDARD_19',        -- Livrări taxabile cota standard 19%
        'REDUCED_9',          -- Livrări taxabile cota redusă 9%
        'REDUCED_5',          -- Livrări taxabile cota redusă 5%
        'EXEMPT_WITH_CREDIT', -- Scutit cu drept de deducere (ex: export, livrări intracomunitare)
        'EXEMPT_NO_CREDIT',   -- Scutit fără drept de deducere (ex: operațiuni art.292)
        'REVERSE_CHARGE',     -- Taxare inversă
        'NOT_SUBJECT',        -- Neimpozabil
        'ZERO_RATE'           -- Cota zero (cazuri speciale)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE vat_category IS 'Categorii fiscale de TVA pentru jurnalul de vânzări conform legislației române';

-- 4. Adăugare câmpuri vatCategory și vatCode în invoice_lines
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS vat_category vat_category DEFAULT 'STANDARD_19';

ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS vat_code TEXT;

COMMENT ON COLUMN invoice_lines.vat_category IS 'Categoria fiscală a liniei de factură pentru raportare în jurnalul de vânzări';
COMMENT ON COLUMN invoice_lines.vat_code IS 'Cod TVA specific pentru mapare detaliată (opțional)';

-- 5. Creare index pentru performanță pe câmpurile noi
CREATE INDEX IF NOT EXISTS idx_companies_use_cash_vat ON companies(use_cash_vat);
CREATE INDEX IF NOT EXISTS idx_invoices_is_cash_vat ON invoices(is_cash_vat);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_vat_category ON invoice_lines(vat_category);

-- 6. Actualizare date existente - setat categorii implicite bazate pe vatRate
UPDATE invoice_lines 
SET vat_category = CASE
    WHEN vat_rate = 19 THEN 'STANDARD_19'::vat_category
    WHEN vat_rate = 9 THEN 'REDUCED_9'::vat_category
    WHEN vat_rate = 5 THEN 'REDUCED_5'::vat_category
    WHEN vat_rate = 0 THEN 'EXEMPT_WITH_CREDIT'::vat_category
    ELSE 'STANDARD_19'::vat_category
END
WHERE vat_category IS NULL;

-- Verificare și raportare
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as companies_with_cash_vat,
    (SELECT COUNT(*) FROM invoices WHERE is_cash_vat = TRUE) as invoices_with_cash_vat,
    (SELECT COUNT(DISTINCT vat_category) FROM invoice_lines) as distinct_vat_categories
FROM companies 
WHERE use_cash_vat = TRUE;

