-- Migrație: Adăugare câmpuri pentru mecanism postare și stornare note contabile
-- Data: 2025-10-09
-- Autor: System
-- Scop: Implementare completă mecanism de postare conform audit

-- ==============================================================================
-- PASUL 1: Adăugare câmpuri pentru POSTARE (Finalizare note contabile)
-- ==============================================================================

-- Câmp pentru marcarea notelor ca fiind postate (finalizate)
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS is_posted BOOLEAN NOT NULL DEFAULT FALSE;

-- Timestamp când a fost postată nota
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP;

-- Utilizatorul care a postat nota
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES users(id);

-- ==============================================================================
-- PASUL 2: Adăugare câmpuri pentru STORNARE (Reversare note postate)
-- ==============================================================================

-- Câmp pentru marcarea notelor ca fiind stornate
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS is_reversed BOOLEAN NOT NULL DEFAULT FALSE;

-- Timestamp când a fost stornată nota
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMP;

-- Utilizatorul care a stornat nota
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES users(id);

-- Referință la nota originală (pentru notele de stornare)
-- O notă de stornare va avea original_entry_id setat la nota pe care o anulează
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS original_entry_id UUID REFERENCES ledger_entries(id);

-- Referință la nota de stornare (pentru notele originale stornate)
-- Nota originală va avea reversal_entry_id setat la nota care o anulează
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS reversal_entry_id UUID REFERENCES ledger_entries(id);

-- Motiv pentru stornare (obligatoriu la stornare)
ALTER TABLE ledger_entries 
ADD COLUMN IF NOT EXISTS reversal_reason TEXT;

-- ==============================================================================
-- PASUL 3: Creeare indecși pentru performanță
-- ==============================================================================

-- Index pentru căutarea notelor postate
CREATE INDEX IF NOT EXISTS idx_ledger_entries_is_posted 
ON ledger_entries(is_posted);

-- Index pentru căutarea notelor postate după dată
CREATE INDEX IF NOT EXISTS idx_ledger_entries_posted_at 
ON ledger_entries(posted_at) WHERE posted_at IS NOT NULL;

-- Index pentru căutarea notelor stornate
CREATE INDEX IF NOT EXISTS idx_ledger_entries_is_reversed 
ON ledger_entries(is_reversed) WHERE is_reversed = TRUE;

-- Index compus pentru status complet
CREATE INDEX IF NOT EXISTS idx_ledger_entries_status 
ON ledger_entries(company_id, is_posted, is_reversed);

-- Index pentru legături între note originale și stornări
CREATE INDEX IF NOT EXISTS idx_ledger_entries_original 
ON ledger_entries(original_entry_id) WHERE original_entry_id IS NOT NULL;

-- ==============================================================================
-- PASUL 4: Adăugare constrângeri de validare
-- ==============================================================================

-- Constrângere: Dacă is_posted = true, atunci posted_at și posted_by trebuie completate
ALTER TABLE ledger_entries
ADD CONSTRAINT chk_posted_requires_data 
CHECK (
  (is_posted = FALSE) OR 
  (is_posted = TRUE AND posted_at IS NOT NULL AND posted_by IS NOT NULL)
);

-- Constrângere: Dacă is_reversed = true, atunci reversed_at, reversed_by și reversal_reason trebuie completate
ALTER TABLE ledger_entries
ADD CONSTRAINT chk_reversed_requires_data 
CHECK (
  (is_reversed = FALSE) OR 
  (is_reversed = TRUE AND reversed_at IS NOT NULL AND reversed_by IS NOT NULL AND reversal_reason IS NOT NULL)
);

-- Constrângere: O notă nu poate fi stornată dacă nu este postată
ALTER TABLE ledger_entries
ADD CONSTRAINT chk_reverse_requires_posted 
CHECK (
  (is_reversed = FALSE) OR 
  (is_reversed = TRUE AND is_posted = TRUE)
);

-- Constrângere: O notă de stornare trebuie să aibă original_entry_id
-- (doar dacă type = 'REVERSAL')
ALTER TABLE ledger_entries
ADD CONSTRAINT chk_reversal_has_original 
CHECK (
  (type != 'REVERSAL') OR 
  (type = 'REVERSAL' AND original_entry_id IS NOT NULL)
);

-- ==============================================================================
-- PASUL 5: Adăugare comentarii pentru documentație
-- ==============================================================================

COMMENT ON COLUMN ledger_entries.is_posted IS 
'Marcaj dacă nota contabilă a fost postată (finalizată). O notă postată nu poate fi modificată.';

COMMENT ON COLUMN ledger_entries.posted_at IS 
'Data și ora când nota a fost postată. Obligatoriu dacă is_posted = true.';

COMMENT ON COLUMN ledger_entries.posted_by IS 
'Utilizatorul care a postat nota. Obligatoriu dacă is_posted = true. Referință la users(id).';

COMMENT ON COLUMN ledger_entries.is_reversed IS 
'Marcaj dacă nota contabilă a fost stornată (anulată). O notă poate fi stornată doar dacă este postată.';

COMMENT ON COLUMN ledger_entries.reversed_at IS 
'Data și ora când nota a fost stornată. Obligatoriu dacă is_reversed = true.';

COMMENT ON COLUMN ledger_entries.reversed_by IS 
'Utilizatorul care a stornat nota. Obligatoriu dacă is_reversed = true. Referință la users(id).';

COMMENT ON COLUMN ledger_entries.original_entry_id IS 
'Pentru notele de stornare (type = REVERSAL), referință la nota originală care a fost stornată.';

COMMENT ON COLUMN ledger_entries.reversal_entry_id IS 
'Pentru notele originale stornate, referință la nota de stornare care o anulează.';

COMMENT ON COLUMN ledger_entries.reversal_reason IS 
'Motivul pentru care nota a fost stornată. Obligatoriu dacă is_reversed = true.';

-- ==============================================================================
-- PASUL 6: Update pentru notele existente (dacă există)
-- ==============================================================================

-- Marcăm toate notele existente ca fiind draft (nepostate)
-- Acestea pot fi apoi postate manual de către utilizatori
UPDATE ledger_entries 
SET is_posted = FALSE, 
    is_reversed = FALSE
WHERE is_posted IS NULL OR is_reversed IS NULL;

-- ==============================================================================
-- PASUL 7: Trigger pentru audit trail (opțional dar recomandat)
-- ==============================================================================

-- Funcție trigger pentru a înregistra în audit_logs când o notă este postată
CREATE OR REPLACE FUNCTION audit_ledger_entry_posted()
RETURNS TRIGGER AS $$
BEGIN
  -- Când o notă trece de la nepostată la postată
  IF (OLD.is_posted = FALSE AND NEW.is_posted = TRUE) THEN
    INSERT INTO audit_logs (
      entity_type,
      entity_id,
      action,
      user_id,
      severity,
      metadata,
      created_at
    ) VALUES (
      'ledger_entry',
      NEW.id,
      'POSTED',
      NEW.posted_by,
      'INFO',
      jsonb_build_object(
        'reference_number', NEW.reference_number,
        'amount', NEW.amount,
        'posted_at', NEW.posted_at
      ),
      NOW()
    );
  END IF;
  
  -- Când o notă este stornată
  IF (OLD.is_reversed = FALSE AND NEW.is_reversed = TRUE) THEN
    INSERT INTO audit_logs (
      entity_type,
      entity_id,
      action,
      user_id,
      severity,
      metadata,
      created_at
    ) VALUES (
      'ledger_entry',
      NEW.id,
      'REVERSED',
      NEW.reversed_by,
      'WARNING',
      jsonb_build_object(
        'reference_number', NEW.reference_number,
        'amount', NEW.amount,
        'reversed_at', NEW.reversed_at,
        'reversal_reason', NEW.reversal_reason,
        'reversal_entry_id', NEW.reversal_entry_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creare trigger
DROP TRIGGER IF EXISTS trg_audit_ledger_entry_posted ON ledger_entries;
CREATE TRIGGER trg_audit_ledger_entry_posted
  AFTER UPDATE ON ledger_entries
  FOR EACH ROW
  WHEN (OLD.is_posted IS DISTINCT FROM NEW.is_posted OR OLD.is_reversed IS DISTINCT FROM NEW.is_reversed)
  EXECUTE FUNCTION audit_ledger_entry_posted();

-- ==============================================================================
-- PASUL 8: Funcție helper pentru verificare dacă nota poate fi modificată
-- ==============================================================================

CREATE OR REPLACE FUNCTION can_modify_ledger_entry(entry_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_posted BOOLEAN;
  v_is_reversed BOOLEAN;
BEGIN
  SELECT is_posted, is_reversed 
  INTO v_is_posted, v_is_reversed
  FROM ledger_entries 
  WHERE id = entry_id;
  
  -- O notă poate fi modificată doar dacă nu este postată și nu este stornată
  RETURN (v_is_posted = FALSE AND v_is_reversed = FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_modify_ledger_entry IS 
'Verifică dacă o notă contabilă poate fi modificată. Returnează TRUE doar pentru notele draft (nepostate și nestornate).';

-- ==============================================================================
-- Finalizare migrație
-- ==============================================================================

-- Afișare sumar
DO $$
DECLARE
  v_total_entries INTEGER;
  v_posted_entries INTEGER;
  v_reversed_entries INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_entries FROM ledger_entries;
  SELECT COUNT(*) INTO v_posted_entries FROM ledger_entries WHERE is_posted = TRUE;
  SELECT COUNT(*) INTO v_reversed_entries FROM ledger_entries WHERE is_reversed = TRUE;
  
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'Migrație completă: Mecanism postare note contabile';
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'Total note contabile: %', v_total_entries;
  RAISE NOTICE 'Note postate: %', v_posted_entries;
  RAISE NOTICE 'Note stornate: %', v_reversed_entries;
  RAISE NOTICE 'Note draft (nepostate): %', (v_total_entries - v_posted_entries);
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'Câmpuri adăugate: 9 (is_posted, posted_at, posted_by, is_reversed, etc.)';
  RAISE NOTICE 'Indecși creați: 5';
  RAISE NOTICE 'Constrângeri: 4';
  RAISE NOTICE 'Trigger-uri: 1 (audit trail)';
  RAISE NOTICE 'Funcții helper: 1';
  RAISE NOTICE '==============================================================================';
END $$;

COMMIT;

