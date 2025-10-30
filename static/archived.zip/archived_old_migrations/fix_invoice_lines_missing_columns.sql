-- Fix missing columns in invoice_lines table
-- This adds all columns defined in the Drizzle schema but missing from the database

-- Add product_name (snapshot of product name at time of invoice)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add calculated amount columns
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS net_amount NUMERIC(15,2) NOT NULL DEFAULT 0;

ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(15,2) NOT NULL DEFAULT 0;

ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Add original_item_id for credit notes (reference to original invoice line)
ALTER TABLE invoice_lines 
ADD COLUMN IF NOT EXISTS original_item_id UUID;

-- Update existing records to populate new columns with calculated values
-- Calculate net_amount from quantity * unit_price
UPDATE invoice_lines 
SET net_amount = quantity * unit_price 
WHERE net_amount = 0 OR net_amount IS NULL;

-- Calculate vat_amount from net_amount * vat_rate / 100
UPDATE invoice_lines 
SET vat_amount = net_amount * vat_rate / 100.0 
WHERE vat_amount = 0 OR vat_amount IS NULL;

-- Calculate gross_amount as net_amount + vat_amount
UPDATE invoice_lines 
SET gross_amount = net_amount + vat_amount 
WHERE gross_amount = 0 OR gross_amount IS NULL;

-- Update total_amount to match gross_amount for consistency
UPDATE invoice_lines 
SET total_amount = gross_amount 
WHERE total_amount != gross_amount;

-- Add comments for documentation
COMMENT ON COLUMN invoice_lines.product_name IS 'Snapshot of product name at time of invoice creation';
COMMENT ON COLUMN invoice_lines.net_amount IS 'Net amount without VAT (quantity × unit_price)';
COMMENT ON COLUMN invoice_lines.vat_amount IS 'VAT amount (net_amount × vat_rate / 100)';
COMMENT ON COLUMN invoice_lines.gross_amount IS 'Gross amount with VAT (net_amount + vat_amount)';
COMMENT ON COLUMN invoice_lines.original_item_id IS 'For credit notes - reference to original invoice line';

-- Commit
COMMIT;

