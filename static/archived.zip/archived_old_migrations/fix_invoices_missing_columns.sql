-- Fix missing columns in invoices table
-- This adds all columns defined in the Drizzle schema but missing from the database

-- Add invoice_number column (full formatted invoice number)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Add customer information
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add date columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS date TIMESTAMP NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- Add amount columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(15,2);

-- Add exchange_rate (already has currency)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,4) NOT NULL DEFAULT 1.0000;

-- Add type and related invoice columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS related_invoice_id UUID;

-- Add description and notes
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add audit columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add validated_by reference if not exists (from earlier migration)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS validated_by UUID;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS invoice_customer_idx ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS invoice_date_idx ON invoices(date);
CREATE INDEX IF NOT EXISTS invoice_status_idx ON invoices(status);
CREATE INDEX IF NOT EXISTS invoice_validation_idx ON invoices(is_validated, validated_at);

-- Update existing records to populate new columns with calculated values
-- Copy total_amount to amount for existing records
UPDATE invoices 
SET amount = total_amount 
WHERE amount = 0 OR amount IS NULL;

-- Set default type for existing invoices
UPDATE invoices 
SET type = 'INVOICE' 
WHERE type IS NULL;

COMMENT ON COLUMN invoices.invoice_number IS 'Full formatted invoice number (e.g., FDI-2024-00001)';
COMMENT ON COLUMN invoices.amount IS 'Gross amount with VAT';
COMMENT ON COLUMN invoices.net_amount IS 'Net amount without VAT';
COMMENT ON COLUMN invoices.vat_amount IS 'Total VAT amount';
COMMENT ON COLUMN invoices.type IS 'Invoice type: INVOICE, CREDIT_NOTE, PROFORMA, etc.';
COMMENT ON COLUMN invoices.related_invoice_id IS 'For credit notes - reference to original invoice';

-- Commit
COMMIT;

