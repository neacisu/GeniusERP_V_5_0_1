-- Migration: Unify invoice_items and invoice_lines into invoice_items
-- Date: 2025-10-17
-- Description: Merge invoice_lines into invoice_items, add missing columns, migrate data, drop invoice_lines

BEGIN;

-- Step 1: Add missing columns from invoice_lines to invoice_items
ALTER TABLE invoice_items 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS vat_category vat_category DEFAULT 'STANDARD_19',
  ADD COLUMN IF NOT EXISTS vat_code TEXT,
  ADD COLUMN IF NOT EXISTS original_item_id UUID;

-- Step 2: Migrate data from invoice_lines to invoice_items (if any exists)
-- Map columns appropriately
INSERT INTO invoice_items (
  id,
  invoice_id,
  product_id,
  product_name,
  product_code,
  description,
  quantity,
  unit_price,
  net_amount,
  vat_rate,
  vat_amount,
  gross_amount,
  discount,
  sequence,
  notes,
  vat_category,
  vat_code,
  original_item_id,
  created_at,
  updated_at
)
SELECT 
  il.id,
  il.invoice_id,
  il.product_id,
  il.product_name,
  NULL as product_code, -- invoice_lines doesn't have this
  il.description,
  il.quantity,
  il.unit_price,
  il.net_amount,
  il.vat_rate::numeric, -- Convert integer to numeric
  il.vat_amount,
  il.gross_amount,
  0 as discount, -- invoice_lines doesn't have this, default to 0
  1 as sequence, -- invoice_lines doesn't have this, default to 1
  NULL as notes, -- invoice_lines doesn't have this
  il.vat_category,
  il.vat_code,
  il.original_item_id,
  il.created_at,
  il.updated_at
FROM invoice_lines il
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_items ii WHERE ii.id = il.id
);

-- Step 3: Drop the invoice_lines table
DROP TABLE IF EXISTS invoice_lines CASCADE;

-- Step 4: Add comment to invoice_items table
COMMENT ON TABLE invoice_items IS 'Unified invoice items table (merged from invoice_lines)';
COMMENT ON COLUMN invoice_items.description IS 'Item description (additional details beyond product name)';
COMMENT ON COLUMN invoice_items.vat_category IS 'VAT category for Romanian accounting (STANDARD_19, REDUCED_9, etc.)';
COMMENT ON COLUMN invoice_items.vat_code IS 'Specific VAT code for detailed mapping';
COMMENT ON COLUMN invoice_items.original_item_id IS 'Reference to original invoice item (for credit notes)';
COMMENT ON COLUMN invoice_items.product_code IS 'Product SKU or code';
COMMENT ON COLUMN invoice_items.discount IS 'Discount amount applied to this item';
COMMENT ON COLUMN invoice_items.sequence IS 'Display order sequence';
COMMENT ON COLUMN invoice_items.notes IS 'Additional notes for this item';

COMMIT;

-- Verification queries (run separately after migration)
-- SELECT COUNT(*) as invoice_items_count FROM invoice_items;
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'invoice_%';

