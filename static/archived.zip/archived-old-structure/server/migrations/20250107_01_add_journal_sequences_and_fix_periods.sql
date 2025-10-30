-- Migration: Add journal sequences and fix fiscal periods
-- Date: 2025-01-07
-- Purpose: Add document_counters table and fix fiscal_periods schema for W1 implementation

-- Add document_counters table for sequential journal numbering
CREATE TABLE IF NOT EXISTS document_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  counter_type TEXT NOT NULL, -- 'JOURNAL', 'INVOICE', 'RECEIPT'
  series TEXT NOT NULL,      -- 'JV', 'SA', 'PU', 'CA', 'BA'
  year NUMERIC NOT NULL,
  last_number NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness per company/type/series/year
  UNIQUE(company_id, counter_type, series, year)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_counters_company_type ON document_counters(company_id, counter_type);
CREATE INDEX IF NOT EXISTS idx_document_counters_series_year ON document_counters(series, year);

-- Update fiscal_periods table - add new columns and fix isClosed type
ALTER TABLE fiscal_periods 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

ALTER TABLE fiscal_periods 
ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP;

ALTER TABLE fiscal_periods 
ADD COLUMN IF NOT EXISTS reopened_by UUID;

ALTER TABLE fiscal_periods 
ADD COLUMN IF NOT EXISTS reopening_reason TEXT;

-- Fix is_closed to be proper boolean (backup existing values first)
DO $$
BEGIN
  -- If is_closed is numeric, convert to boolean
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'fiscal_periods' 
             AND column_name = 'is_closed' 
             AND data_type = 'numeric') THEN
             
    -- Add temporary boolean column
    ALTER TABLE fiscal_periods ADD COLUMN is_closed_bool BOOLEAN DEFAULT false;
    
    -- Convert numeric to boolean (1 = true, 0 = false)
    UPDATE fiscal_periods SET is_closed_bool = (is_closed::integer = 1);
    
    -- Drop old column and rename new one
    ALTER TABLE fiscal_periods DROP COLUMN is_closed;
    ALTER TABLE fiscal_periods RENAME COLUMN is_closed_bool TO is_closed;
  END IF;
END
$$;

-- Add indexes for fiscal periods
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company_dates ON fiscal_periods(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON fiscal_periods(company_id, status, is_closed);

-- Add constraints
ALTER TABLE fiscal_periods 
ADD CONSTRAINT ck_fiscal_periods_status CHECK (status IN ('open', 'soft_close', 'hard_close'));

-- Comment pentru documentare
COMMENT ON TABLE document_counters IS 'Sequential numbering counters for journals and documents - OMFP 2634/2015 compliance';
COMMENT ON TABLE fiscal_periods IS 'Accounting periods with lock status - Romanian accounting standards';

-- Grant permissions to accounting service
-- GRANT SELECT, INSERT, UPDATE ON document_counters TO accounting_service;
-- GRANT SELECT, INSERT, UPDATE ON fiscal_periods TO accounting_service;

COMMIT;
