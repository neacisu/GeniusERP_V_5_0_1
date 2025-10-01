-- Migration: Add Romanian Accounting Standards fields to journal_entries
-- Date: 2025-10-01
-- Purpose: Adapt journal_entries to support "Notă Contabilă" requirements per Romanian legislation

-- Add status field (draft, approved, posted, cancelled)
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' NOT NULL;

-- Add document reference fields (for source documents like invoices, receipts)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_id UUID;

-- Add validation/approval fields (required for Romanian accounting standards)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id);

-- Add currency and exchange rate fields (for foreign currency transactions)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'RON' NOT NULL,
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL;

-- Add posting date (data înregistrării în contabilitate)
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Add cancellation fields
ALTER TABLE journal_entries
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

-- Add index on date for reporting
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);

-- Add index on company and date for company-specific reports
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date ON journal_entries(company_id, date);

-- Add constraint to ensure number is unique per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_entries_company_number 
ON journal_entries(company_id, number) 
WHERE number IS NOT NULL;

-- Add check constraint for status values
ALTER TABLE journal_entries
ADD CONSTRAINT chk_journal_entries_status 
CHECK (status IN ('draft', 'approved', 'posted', 'cancelled'));

-- Comments for documentation
COMMENT ON COLUMN journal_entries.status IS 'Status notei contabile: draft (ciornă), approved (aprobată), posted (înregistrată), cancelled (anulată)';
COMMENT ON COLUMN journal_entries.document_type IS 'Tipul documentului sursă (invoice, receipt, payment, etc.)';
COMMENT ON COLUMN journal_entries.document_id IS 'ID-ul documentului sursă în sistem';
COMMENT ON COLUMN journal_entries.validated IS 'Indică dacă nota contabilă a fost validată de contabil';
COMMENT ON COLUMN journal_entries.validated_at IS 'Data și ora validării';
COMMENT ON COLUMN journal_entries.validated_by IS 'Utilizatorul care a validat nota contabilă';
COMMENT ON COLUMN journal_entries.currency_code IS 'Codul monedei (RON, EUR, USD, etc.)';
COMMENT ON COLUMN journal_entries.exchange_rate IS 'Cursul de schimb față de RON';
COMMENT ON COLUMN journal_entries.posted_at IS 'Data înregistrării efective în contabilitate';
COMMENT ON COLUMN journal_entries.number IS 'Număr unic al notei contabile (ex: NC-202510-001)';
COMMENT ON COLUMN journal_entries.reference IS 'Referință externă sau număr document sursă';

