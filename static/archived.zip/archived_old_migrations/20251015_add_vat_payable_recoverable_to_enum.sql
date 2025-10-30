-- Migration: Add VAT_PAYABLE and VAT_RECOVERABLE to account_mapping_type enum
-- Date: 2025-10-15
-- Description: Adaugă conturile pentru TVA de plată (4423) și TVA de recuperat (4424)

-- Add VAT_PAYABLE to enum
ALTER TYPE account_mapping_type ADD VALUE IF NOT EXISTS 'VAT_PAYABLE';

-- Add VAT_RECOVERABLE to enum  
ALTER TYPE account_mapping_type ADD VALUE IF NOT EXISTS 'VAT_RECOVERABLE';

-- Verify enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'account_mapping_type'::regtype ORDER BY enumsortorder;

