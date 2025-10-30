-- Migration: Adăugare conturi lipsă din planul de conturi românesc OMFP 1802/2014
-- Data: 2025-10-07
-- Descriere: Completare conturi esențiale care lipsesc pentru conformitate cu standardele contabile românești

-- =================================================================
-- CLASA 1: CONTURI DE CAPITALURI
-- =================================================================

-- 1013 - Capital subscris nevărsat, neexigibil (grad 2)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '1013',
    'Capital subscris nevărsat, neexigibil',
    'Capital subscris de acţionari/asociaţi care nu a fost încă vărsat şi nu este încă exigibil',
    'ASSET',
    2,
    (SELECT id FROM account_groups WHERE code = '10'),
    (SELECT id FROM synthetic_accounts WHERE code = '101'),
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '1013');

-- 1014 - Capital subscris, apelat, nevărsat (grad 2)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '1014',
    'Capital subscris, apelat, nevărsat',
    'Capital subscris de acţionari/asociaţi care a fost apelat dar nu a fost încă vărsat',
    'ASSET',
    2,
    (SELECT id FROM account_groups WHERE code = '10'),
    (SELECT id FROM synthetic_accounts WHERE code = '101'),
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '1014');

-- 105 - Rezerve din reevaluare (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '105',
    'Rezerve din reevaluare',
    'Surplus din reevaluarea imobilizărilor corporale şi necorporale conform reglementărilor contabile',
    'EQUITY',
    1,
    (SELECT id FROM account_groups WHERE code = '10'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '105');

-- 107 - Câștiguri sau pierderi legate de instrumentele de capitaluri proprii (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '107',
    'Câştiguri sau pierderi legate de instrumentele de capitaluri proprii',
    'Rezultate din emisiunea, răscumpărarea, vânzarea sau anularea instrumentelor de capitaluri proprii',
    'EQUITY',
    1,
    (SELECT id FROM account_groups WHERE code = '10'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '107');

-- 121 - Profit sau pierdere (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '121',
    'Profit sau pierdere',
    'Rezultatul exerciţiului curent - profit sau pierdere',
    'EQUITY',
    1,
    (SELECT id FROM account_groups WHERE code = '12'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '121');

-- 129 - Repartizarea profitului (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '129',
    'Repartizarea profitului',
    'Cont tranzitoriu pentru repartizarea profitului conform hotărârii adunării generale',
    'EQUITY',
    1,
    (SELECT id FROM account_groups WHERE code = '12'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '129');

-- 165 - Împrumuturi din emisiuni de titluri de participare (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '165',
    'Împrumuturi din emisiuni de titluri de participare',
    'Împrumuturi obţinute prin emisiunea de titluri de participare rambursabile',
    'LIABILITY',
    1,
    (SELECT id FROM account_groups WHERE code = '16'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '165');

-- 167 - Împrumuturi de la entităţile afiliate (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '167',
    'Împrumuturi de la entităţile afiliate',
    'Împrumuturi pe termen lung de la societăţi afiliate sau entităţi aparţinând aceluiaşi grup',
    'LIABILITY',
    1,
    (SELECT id FROM account_groups WHERE code = '16'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '167');

-- =================================================================
-- CLASA 2: CONTURI DE IMOBILIZĂRI
-- =================================================================

-- 204 - Achiziții de imobilizări necorporale (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '204',
    'Achiziţii de imobilizări necorporale',
    'Achiziţii de brevete, licenţe, mărci comerciale, programe informatice şi alte imobilizări necorporale în curs de achiziţie',
    'ASSET',
    1,
    (SELECT id FROM account_groups WHERE code = '20'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '204');

-- 2804 - Amortizarea achiziţiilor de imobilizări necorporale (grad 2)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '2804',
    'Amortizarea achiziţiilor de imobilizări necorporale',
    'Amortizarea cumulată a imobilizărilor necorporale în curs de achiziţie',
    'CONTRA_ASSET',
    2,
    (SELECT id FROM account_groups WHERE code = '28'),
    (SELECT id FROM synthetic_accounts WHERE code = '280'),
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '2804');

-- =================================================================
-- CLASA 4: CONTURI DE TERȚI
-- =================================================================

-- 422 - Prime şi premii datorate personalului (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '422',
    'Prime şi premii datorate personalului',
    'Prime, premii şi alte sume similare datorate personalului conform contractului colectiv de muncă sau contractelor individuale',
    'LIABILITY',
    1,
    (SELECT id FROM account_groups WHERE code = '42'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '422');

-- 4271 - Contribuţia angajatorilor pentru asigurări sociale de stat (grad 2)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '4271',
    'Contribuţia angajatorilor pentru asigurări sociale de stat',
    'Contribuţia datorată de angajator la bugetul asigurărilor sociale de stat (CAS)',
    'LIABILITY',
    2,
    (SELECT id FROM account_groups WHERE code = '42'),
    (SELECT id FROM synthetic_accounts WHERE code = '427'),
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '4271');

-- 4272 - Contribuţia angajatorilor pentru fondul de şomaj (grad 2)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '4272',
    'Contribuţia angajatorilor pentru fondul de şomaj',
    'Contribuţia datorată de angajator la bugetul asigurărilor pentru şomaj',
    'LIABILITY',
    2,
    (SELECT id FROM account_groups WHERE code = '42'),
    (SELECT id FROM synthetic_accounts WHERE code = '427'),
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '4272');

-- 465 - Creditori - facturi nesosite (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '465',
    'Creditori - facturi nesosite',
    'Contravaloarea bunurilor sau serviciilor primite pentru care nu a fost primită încă factura fiscală',
    'LIABILITY',
    1,
    (SELECT id FROM account_groups WHERE code = '46'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '465');

-- =================================================================
-- CLASA 6: CONTURI DE CHELTUIELI
-- =================================================================

-- 647 - Cheltuieli cu politicile de personal (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '647',
    'Cheltuieli cu politicile de personal',
    'Cheltuieli cu recrutarea, pregătirea profesională, formarea continuă a personalului',
    'EXPENSE',
    1,
    (SELECT id FROM account_groups WHERE code = '64'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '647');

-- 648 - Cheltuieli cu alte beneficii acordate salariaţilor (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '648',
    'Cheltuieli cu alte beneficii acordate salariaţilor',
    'Cheltuieli cu beneficii acordate angajaţilor în afara salariilor (ex: tichete cadou, reduceri la produse/servicii)',
    'EXPENSE',
    1,
    (SELECT id FROM account_groups WHERE code = '64'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '648');

-- =================================================================
-- CLASA 7: CONTURI DE VENITURI
-- =================================================================

-- 713 - Venituri din lucrări (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '713',
    'Venituri din lucrări',
    'Venituri aferente lucrărilor executate în cadrul activităţii de bază',
    'REVENUE',
    1,
    (SELECT id FROM account_groups WHERE code = '71'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '713');

-- 791 - Venituri din provizioane pentru riscuri și cheltuieli (grad 1)
INSERT INTO synthetic_accounts (id, code, name, description, account_function, grade, group_id, parent_id, is_active)
SELECT 
    gen_random_uuid(),
    '791',
    'Venituri din provizioane pentru riscuri și cheltuieli',
    'Venituri din reluarea (diminuarea sau anularea) provizioanelor pentru riscuri şi cheltuieli',
    'REVENUE',
    1,
    (SELECT id FROM account_groups WHERE code = '79'),
    NULL,
    true
WHERE NOT EXISTS (SELECT 1 FROM synthetic_accounts WHERE code = '791');

-- =================================================================
-- VERIFICARE FINALĂ
-- =================================================================

SELECT 
    'Conturi adăugate cu succes!' as status,
    COUNT(*) as total_conturi_active,
    COUNT(CASE WHEN grade = 1 THEN 1 END) as grad_1,
    COUNT(CASE WHEN grade = 2 THEN 1 END) as grad_2
FROM synthetic_accounts 
WHERE is_active = true;

-- Verificare conturi critice
SELECT 
    'AUDIT FINAL' as tip_raport,
    CASE 
        WHEN COUNT(*) = 18 THEN 'TOATE CONTURILE AU FOST ADĂUGATE'
        ELSE 'UNELE CONTURI LIPSESC ÎNCĂ'
    END as status_adaugare
FROM synthetic_accounts 
WHERE code IN ('1013', '1014', '105', '107', '121', '129', '165', '167', '204', '2804', '422', '4271', '4272', '465', '647', '648', '713', '791')
AND is_active = true;

