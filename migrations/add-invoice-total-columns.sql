-- Migration: Add net_total, vat_total, gross_total columns to invoices table
-- Date: 2025-10-17
-- Description: Add missing total columns for compatibility with invoice schema

BEGIN;

-- Add the missing columns
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS net_total NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS vat_total NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS gross_total NUMERIC(15,2);

-- Populate the new columns from existing data
-- net_total = net_amount (or total_amount if net_amount is null)
-- vat_total = vat_amount (or 0 if null)
-- gross_total = amount (total with VAT)
UPDATE invoices SET
  net_total = COALESCE(net_amount, total_amount / (1 + COALESCE(vat_amount, 0) / NULLIF(total_amount, 0))),
  vat_total = COALESCE(vat_amount, 0),
  gross_total = COALESCE(amount, total_amount);

-- Add comments
COMMENT ON COLUMN invoices.net_total IS 'Net total amount (without VAT) - alias for net_amount';
COMMENT ON COLUMN invoices.vat_total IS 'VAT total amount - alias for vat_amount';
COMMENT ON COLUMN invoices.gross_total IS 'Gross total amount (with VAT) - alias for amount/total_amount';

COMMIT;

-- Verification
-- SELECT id, net_amount, net_total, vat_amount, vat_total, amount, gross_total FROM invoices LIMIT 5;

