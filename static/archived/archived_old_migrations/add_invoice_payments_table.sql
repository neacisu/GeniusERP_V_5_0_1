-- Migration: Add Invoice Payments Table
-- Description: Tabelă pentru tracking plăți facturi și TVA la încasare
-- Date: 2025-10-02

-- Creare tabelă invoice_payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_date TIMESTAMP NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL,
    
    -- Reference documents
    payment_reference TEXT,
    bank_transaction_id UUID,
    cash_transaction_id UUID,
    
    -- TVA transfer tracking (pentru TVA la încasare)
    vat_transfer_ledger_id UUID,
    vat_amount_transferred DECIMAL(15, 2),
    
    -- Notes and metadata
    notes TEXT,
    metadata JSONB,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_idx ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS invoice_payments_company_idx ON invoice_payments(company_id);
CREATE INDEX IF NOT EXISTS invoice_payments_date_idx ON invoice_payments(payment_date);
CREATE INDEX IF NOT EXISTS invoice_payments_method_idx ON invoice_payments(payment_method);

-- Comments
COMMENT ON TABLE invoice_payments IS 'Tracking plăți pentru facturi - esențial pentru TVA la încasare';
COMMENT ON COLUMN invoice_payments.vat_transfer_ledger_id IS 'Link către nota contabilă de transfer TVA (4428 -> 4427)';
COMMENT ON COLUMN invoice_payments.vat_amount_transferred IS 'Suma TVA transferată din neexigibil în exigibil la această plată';

-- Verificare
SELECT 'Payments table created successfully' as status;

