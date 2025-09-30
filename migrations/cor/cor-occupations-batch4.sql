-- COR Occupations SQL - Batch 4

INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132215', 'sef centru prelucrare', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132216', 'sef laborator control tehnic de calitate a combustibilului nuclear', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132217', 'sef serviciu tehnic si componente nucleare', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132218', 'sef serviciu termochimic', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132219', 'sef uzina, centrala electrica, gaze, apa', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132220', 'sef centrala electrica, gaze si apa', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132221', 'sef atelier reparatii capitale', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132222', 'inspector general industria petroliera', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132223', 'sef formatie industria petroliera/petrochimica', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132224', 'sef instalatie petroliera', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132225', 'sef laborator industria petroliera', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132226', 'sef statie epurare ape reziduale', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132227', 'supervizor geolog si foraj', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132228', 'sef formatie în industria de masini si echipamente', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132229', 'sef/sef adjunct statie electrica', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132230', 'sef/sef adjunct centru exploatare retele electrice', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132231', 'sef dispecer energetic central (DEC)', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132232', 'sef dispecer energetic teritorial (DET)', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132233', 'sef formatie la fabricarea armamentului si munitiei', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132234', 'sef schimb', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132235', 'sef formatie', '', '1322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132301', 'ajutor sef brigada în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132302', 'inginer-sef în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132303', 'conducator antrepriza constructii-montaj', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132304', 'sef atelier în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132305', 'sef brigada complexa sau specializata', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132306', 'sef laborator în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132307', 'sef lot', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132308', 'sef santier', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132309', 'sef sector (sectie) drumuri-poduri', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132310', 'sef sectie productie, exploatare, întretinere, reparatii în constructii si lucrari publice', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132311', 'sef serviciu în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132312', 'sef birou în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132313', 'sef sector exploatare îmbunatatiri funciare', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132314', 'sef sistem exploatare îmbunatatiri funciare', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132315', 'conducator întreprindere mica - patron (girant) în constructii', '', '1323', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132401', 'capitan sef port', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132402', 'comandant nave maritime', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132403', 'comandant coordonator grup mare pescuit oceanic', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132404', 'conducator (director si director adjunct) Administratia Filiala Dunarea de Jos (AFDJ)', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132405', 'director zbor', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132406', 'inginer-sef transporturi', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132407', 'picher sef district', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132408', 'revizor general siguranta circulatiei', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132409', 'sef agentie navala', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132410', 'sef atelier aeroport', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132411', 'sef atelier transporturi', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132412', 'sef autobaza', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132413', 'sef birou aeroport', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132414', 'sef birou/serviciu relatii internationale', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132415', 'sef birou/serviciu transport maritim si fluvial', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132416', 'sef coloana auto', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132417', 'sef depou/adjunct', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132418', 'sef district cai ferate, poduri, drumuri', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132419', 'sef divizie cai ferate', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132420', 'sef laborator aeroport', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132421', 'sef port', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132422', 'sef regulator circulatie cai ferate', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132423', 'sef revizie locomotive, automotoare', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132424', 'sef revizie vagoane', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132425', 'sef sectie/adjunct (sector) transporturi', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132426', 'sef serviciu, centru, statie, aeroport', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132427', 'sef serviciu filiala Administratia Filiala Dunarea de Jos', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132428', 'sef statie cai ferate', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132429', 'sef statie teleferic', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132430', 'sef agentie pilotaj', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132431', 'sef cart', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132432', 'diriginte oficiu transporturi', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132433', 'sef garaj', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132434', 'comandant instructor', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132435', 'sef mecanic instructor', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132436', 'sef mecanic maritim/fluvial', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132437', 'sef electrician maritim', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132438', 'sef atelier reparatii', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132439', 'conducator activitate de transport rutier', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132440', 'sef trafic auto intern', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132441', 'sef trafic curierat intern', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132442', 'sef departament logistica', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132443', 'sef birou aprovizionare-desfacere', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132444', 'sef depozit', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132445', 'sef serviciu aprovizionare-desfacere', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132446', 'sef siloz', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132447', 'sef statie uscare-conditionare cereale', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132448', 'manager achizitii', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132449', 'manager farmacii', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132450', 'manager aprovizionare', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132451', 'manager relatia cu furnizorii', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132452', 'conducator întreprindere mica - patron (girant) în transporturi', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('132453', 'sef birou import-export', '', '1324', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133001', 'director centru de calcul', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133002', 'sef oficiu de calcul', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133003', 'sef atelier informatica', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133004', 'sef laborator informatica', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133005', 'director divizie informatica', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133006', 'director departament informatica', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133007', 'manager tehnologia informatiilor si comunicatii', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('134920', 'director departament securitate', '', '1349', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133009', 'conducator de întreprindere mica - patron (girant) în informatica', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133010', 'sef atelier telecomunicatii', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('133011', 'sef birou exploatare postala', '', '1330', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
