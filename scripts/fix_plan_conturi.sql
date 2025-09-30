-- ============================================================================
-- SCRIPT COMPLET DE CORECTARE PLAN DE CONTURI
-- Bazat pe audit comparativ: Documentație vs DB
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTEA 1: INSERARE CONTURI LIPSĂ (3 conturi)
-- ============================================================================

-- Cont 105 | Rezerve din reevaluare | Grupa 10
INSERT INTO synthetic_accounts (id, code, name, account_function, grade, group_id, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  '105', 
  'Rezerve din reevaluare', 
  'P', 
  1, 
  '870ec668-7432-408e-bf49-8b1fd3555045',  -- Grupa 10
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_function = EXCLUDED.account_function,
  updated_at = CURRENT_TIMESTAMP;

-- Cont 167 | Alte împrumuturi şi datorii asimilate | Grupa 16
INSERT INTO synthetic_accounts (id, code, name, account_function, grade, group_id, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  '167', 
  'Alte împrumuturi şi datorii asimilate', 
  'P', 
  1, 
  '278bf79d-081d-4bc8-bdda-1a4df58c1c55',  -- Grupa 16
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_function = EXCLUDED.account_function,
  updated_at = CURRENT_TIMESTAMP;

-- Cont 227 | Active biologice productive în curs de aprovizionare | Grupa 22
INSERT INTO synthetic_accounts (id, code, name, account_function, grade, group_id, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  '227', 
  'Active biologice productive în curs de aprovizionare', 
  'A', 
  1, 
  'ef6ce7b6-567f-470a-a7cc-88850dd8a727',  -- Grupa 22
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_function = EXCLUDED.account_function,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- PARTEA 2: CORECTARE TIPURI CONTURI CLASA 8 (Extrabilanțier X, nu B)
-- ============================================================================

-- Conturi 801-809, 891, 892: Trebuie să fie X (Extrabilanțier), nu B
UPDATE synthetic_accounts SET account_function = 'X', updated_at = CURRENT_TIMESTAMP
WHERE code IN ('801', '802', '803', '804', '805', '806', '807', '808', '809', '891', '892')
  AND account_function != 'X';

-- ============================================================================
-- PARTEA 3: CORECTARE ALTE TIPURI GREȘITE
-- ============================================================================

-- Conturile de AMORTIZĂRI și AJUSTĂRI (clasa 2) trebuie să fie PASIV (P), nu ACTIV (A)
-- Amortizările și ajustările funcționează ca și conturi de Pasiv (corector de Activ)

UPDATE synthetic_accounts SET account_function = 'P', updated_at = CURRENT_TIMESTAMP
WHERE code IN (
  '269',  -- Vărsăminte de efectuat pentru imobilizări financiare
  '280',  -- Amortizări privind imobilizările necorporale
  '281',  -- Amortizări privind imobilizările corporale
  '290',  -- Ajustări pentru deprecierea imobilizărilor necorporale
  '291',  -- Ajustări pentru deprecierea imobilizărilor corporale
  '293',  -- Ajustări pentru deprecierea imobilizărilor în curs
  '296'   -- Ajustări pentru pierderea de valoare a imobilizărilor financiare
) AND account_function != 'P';

-- Conturile de AJUSTĂRI pentru deprecierea STOCURILOR (clasa 3) trebuie să fie PASIV (P)
UPDATE synthetic_accounts SET account_function = 'P', updated_at = CURRENT_TIMESTAMP
WHERE code IN ('392', '394', '395') 
  AND account_function != 'P';

-- Conturi de TERȚI (clasa 4) - corectări
UPDATE synthetic_accounts SET account_function = 'B', updated_at = CURRENT_TIMESTAMP
WHERE code IN (
  '409',  -- Furnizori - debitori (Bifuncțional)
  '411',  -- Clienţi (Bifuncțional)
  '431',  -- Asigurări sociale (Bifuncțional)
  '441',  -- Impozitul pe profit (Bifuncțional)
  '455',  -- Sume datorate acţionarilor (Bifuncțional)
  '475',  -- Subvenţii pentru investiţii (Bifuncțional)
  '490'   -- Ajustări pentru deprecierea creanţelor (Bifuncțional)
) AND account_function != 'B';

-- Conturi de TREZORERIE (clasa 5) - corectări
UPDATE synthetic_accounts SET account_function = 'P', updated_at = CURRENT_TIMESTAMP
WHERE code IN (
  '509',  -- Vărsăminte de efectuat pentru investiţii pe termen scurt
  '519'   -- Credite bancare pe termen scurt
) AND account_function != 'P';

UPDATE synthetic_accounts SET account_function = 'B', updated_at = CURRENT_TIMESTAMP
WHERE code = '518'  -- Dobânzi (Bifuncțional)
  AND account_function != 'B';

-- Conturi de CHELTUIELI (clasa 6)
UPDATE synthetic_accounts SET account_function = 'P', updated_at = CURRENT_TIMESTAMP
WHERE code = '609'  -- Reduceri comerciale primite (funcționează ca Pasiv/Venit)
  AND account_function != 'P';

-- Conturi de VENITURI (clasa 7)
UPDATE synthetic_accounts SET account_function = 'A', updated_at = CURRENT_TIMESTAMP
WHERE code = '709'  -- Reduceri comerciale acordate (funcționează ca Activ/Cheltuială)
  AND account_function != 'A';

-- Cont 207 - Fond comercial (corectare)
UPDATE synthetic_accounts SET account_function = 'B', updated_at = CURRENT_TIMESTAMP
WHERE code = '207' AND account_function != 'B';

-- ============================================================================
-- PARTEA 4: CORECTARE NUME CONTURI (diferențe minore)
-- ============================================================================

UPDATE synthetic_accounts SET 
  name = 'Mobilier, aparatură birotică, echipamente de protecţie a valorilor umane şi materiale şi alte active corporale în curs de aprovizionare',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '224';

UPDATE synthetic_accounts SET 
  name = 'Furnizori - facturi nesosite',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '408';

UPDATE synthetic_accounts SET 
  name = 'Furnizori - debitori',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '409';

UPDATE synthetic_accounts SET 
  name = 'Clienţi - facturi de întocmit',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '418';

UPDATE synthetic_accounts SET 
  name = 'Clienţi - creditori',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '419';

UPDATE synthetic_accounts SET 
  name = 'Personal - salarii datorate',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '421';

UPDATE synthetic_accounts SET 
  name = 'Personal - ajutoare materiale datorate',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '423';

UPDATE synthetic_accounts SET 
  name = 'Subvenţii',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '445';

UPDATE synthetic_accounts SET 
  name = 'Fonduri speciale - taxe şi vărsăminte asimilate',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '447';

UPDATE synthetic_accounts SET 
  name = 'Cheltuieli cu avantajele în natură şi tichetele acordate salariaţilor',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '642';

UPDATE synthetic_accounts SET 
  name = 'Cheltuieli din diferenţe de curs valutar',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '665';

UPDATE synthetic_accounts SET 
  name = 'Cheltuieli cu impozitul pe venit şi cu alte impozite care nu apar în elementele de mai sus',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '698';

UPDATE synthetic_accounts SET 
  name = 'Venituri din impozitul pe profit rezultat din decontările în cadrul grupului fiscal în domeniul impozitului pe profit',
  updated_at = CURRENT_TIMESTAMP
WHERE code = '794';

-- ============================================================================
-- VERIFICARE FINALĂ
-- ============================================================================

-- Afișează statistici după modificări
SELECT 
  'STATISTICI DUPĂ CORECTARE' AS info,
  '' AS detalii
UNION ALL
SELECT 
  'Total conturi grad 1:',
  COUNT(*)::text
FROM synthetic_accounts
WHERE grade = 1
UNION ALL
SELECT 
  'Tipuri de conturi:',
  ''
UNION ALL
SELECT 
  '  - Activ (A):',
  COUNT(*)::text
FROM synthetic_accounts
WHERE grade = 1 AND account_function = 'A'
UNION ALL
SELECT 
  '  - Pasiv (P):',
  COUNT(*)::text
FROM synthetic_accounts
WHERE grade = 1 AND account_function = 'P'
UNION ALL
SELECT 
  '  - Bifuncțional (B):',
  COUNT(*)::text
FROM synthetic_accounts
WHERE grade = 1 AND account_function = 'B'
UNION ALL
SELECT 
  '  - Extrabilanțier (X):',
  COUNT(*)::text
FROM synthetic_accounts
WHERE grade = 1 AND account_function = 'X';

COMMIT;

-- ============================================================================
-- FIN SCRIPT
-- ============================================================================
