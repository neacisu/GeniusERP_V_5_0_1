-- COR Occupations SQL - Batch 18

INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263409', 'psiholog în specialitatea psihologie aplicata în domeniul securitatii nationale', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263410', 'psiholog în specialitatea psihologie judiciara - evaluarea comportamentului simulat prin tehnica poligrafului', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263412', 'psihopedagog', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263413', 'expert poligraf', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263414', 'psiholog scolar', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263415', 'cercetator în psihologie', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263416', 'asistent de cercetare în psihologie', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263417', 'cercetator în psihopedagogie speciala', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263418', 'asistent de cercetare în psihopedagogie speciala', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263419', 'terapeut ocupational', '', '2634', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263501', 'asistent social', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263502', 'consilier în domeniul adictiilor', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263503', 'ofiter control doping', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263504', 'art-terapeut', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263505', 'asistent social cu competenta în sanatatea mintala', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263506', 'specialist în evaluarea vocationala a persoanelor cu dizabilitati', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263507', 'specialist în angajare asistata', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263508', 'instructor-educator pentru activitati de resocializare', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263509', 'asistent pentru îngrijirea persoanelor vârstnice', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263510', 'cercetator în asistenta sociala', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263511', 'asistent de cercetare în asistenta sociala', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263512', 'inspector social', '', '2635', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263601', 'arhiepiscop', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263602', 'arhiereu-vicar', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263603', 'arhondar', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263604', 'cantor', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263605', 'capelan', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263606', 'cardinal', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263607', 'chevrasames', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263608', 'cântaret bisericesc', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263609', 'consilier culte', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263610', 'conducator arhiepiscopal', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263611', 'diacon', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263612', 'episcop', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263613', 'exarh', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263614', 'haham', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263615', 'harmonist', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263616', 'hatip', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263617', 'imam', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263618', 'inspector culte', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263619', 'majghian', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263620', 'melamed', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263621', 'mitropolit', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263622', 'muezin', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263623', 'muftiu', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263624', 'organist', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263625', 'pastor', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263626', 'patriarh', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263627', 'preot', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263628', 'presedinte culte', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263629', 'protopop', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263630', 'provicar', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263631', 'rabin', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263632', 'secretar culte', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263633', 'staret - stareta', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263634', 'treibar', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263635', 'vestitor', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('263636', 'vicar', '', '2636', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264101', 'poet', '', '2641', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264102', 'scriitor', '', '2641', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264201', 'comentator publicist', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264202', 'corector (studii superioare)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264203', 'corespondent special (tara si strainatate)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264204', 'corespondent radio', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264205', 'corespondent presa', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264206', 'critic de arta', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264207', 'editorialist', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264208', 'fotoreporter', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264209', 'lector presa/editura', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264210', 'publicist comentator', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264211', 'redactor', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264212', 'reporter (studii superioare)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264213', 'reporter operator', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264214', 'secretar de emisie (studii superioare)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264215', 'secretar de redactie (studii superioare)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264216', 'secretar responsabil de agentie', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264217', 'sef agentie publicitate', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264218', 'tehnoredactor', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264219', 'ziarist', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264220', 'critic literar', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264221', 'critic muzical', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264222', 'comentator radio TV', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264223', 'redactor rubrica', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264224', 'jurnalist TV (studii medii)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264225', 'jurnalist TV (studii superioare)', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264226', 'jurnalist TV senior', '', '2642', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264301', 'filolog', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264302', 'interpret', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264303', 'interpret relatii diplomatice', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264304', 'referent literar', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264305', 'secretar literar', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264306', 'traducator (studii superioare)', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264307', 'translator', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264308', 'grafolog', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264309', 'revizor lingvist', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264310', 'terminolog', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264311', 'translator emisie', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264312', 'cercetator în lingvistica', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264313', 'asistent de cercetare în lingvistica', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('264314', 'cercetator în filologie', '', '2643', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
