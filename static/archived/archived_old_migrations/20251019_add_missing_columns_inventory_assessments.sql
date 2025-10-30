-- Migration: Add missing columns to inventory_assessments and inventory_assessment_items
-- Date: 2025-10-19
-- Description: Adds name, created_by, legal_basis, document_number, valuation_method to inventory_assessments
--              and unit_of_measure to inventory_assessment_items

BEGIN;

-- Add missing columns to inventory_assessments table
ALTER TABLE inventory_assessments 
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS legal_basis TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS valuation_method TEXT;

-- Add missing column to inventory_assessment_items table
ALTER TABLE inventory_assessment_items 
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'buc';

-- Set default values for existing records
UPDATE inventory_assessments 
SET 
  name = COALESCE(name, assessment_number),
  legal_basis = COALESCE(legal_basis, 'OMFP 2861/2009, Legea contabilității 82/1991'),
  valuation_method = COALESCE(valuation_method, 'WEIGHTED_AVERAGE')
WHERE name IS NULL OR legal_basis IS NULL OR valuation_method IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN inventory_assessments.name IS 'Denumirea procesului de inventariere';
COMMENT ON COLUMN inventory_assessments.created_by IS 'UUID-ul utilizatorului care a creat inventarierea';
COMMENT ON COLUMN inventory_assessments.legal_basis IS 'Baza legală pentru inventariere (ex: OMFP 2861/2009)';
COMMENT ON COLUMN inventory_assessments.document_number IS 'Numărul documentului intern de inventariere';
COMMENT ON COLUMN inventory_assessments.valuation_method IS 'Metoda de evaluare folosită (FIFO, LIFO, WEIGHTED_AVERAGE, etc.)';
COMMENT ON COLUMN inventory_assessment_items.unit_of_measure IS 'Unitatea de măsură pentru produsul inventariat';

COMMIT;
