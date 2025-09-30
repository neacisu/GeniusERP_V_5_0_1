-- COR Occupations SQL - Batch 37

INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811313', 'primitor-preparator produse fluide', '', '8113', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811314', 'operator flotare produse fluide', '', '8113', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811401', 'cuptorar lianti', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811402', 'fasonator produse din azbociment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811403', 'finisor produse din azbociment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811404', 'morar lianti', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811405', 'preparator pasta de azbociment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811406', 'tratamentist produse din azbociment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811407', 'operator la impregnarea produselor hidroizolatoare', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811408', 'masinist pentru prefabricate din beton si beton armat', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811409', 'operator la fabricarea vatei si produselor din vata minerala', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811410', 'confectioner garnituri din azbest', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811411', 'operator camera comanda pentru fabrica de ciment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('811412', 'operator flux pentru fabrica de ciment', '', '8114', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812101', 'cocsar', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812102', 'furnalist', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812103', 'otelar', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812104', 'pregatitor materiale de sarje', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812105', 'melanjorist', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812106', 'operator oxizi de plumb', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812107', 'dezbatator lingouri', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812108', 'metalurgist pulberi din oxid de fier', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812109', 'curatitor lingouri', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812110', 'preparator la concentratele miniere', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812111', 'topitor la concentrate miniere', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812112', 'rafinator metale neferoase', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812113', 'electrometalurgist', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812114', 'conditioner-finisor', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812115', 'turnator fonta', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812116', 'granulator zgura', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812117', 'epurator gaze', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812118', 'masinist suflante', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812119', 'pregatitor de sarje', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812120', 'dozator la producerea aglomeratului', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812121', 'aglomeratorist', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812122', 'masinist exhaustor', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812123', 'operator separare magnetica', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812124', 'laminator semifabricate, profiluri tabla si platbanda', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812125', 'laminator, presator tevi plumb', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812126', 'topitor, turnator metale pretioase', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812127', 'laminator sârma', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812128', 'laminator tabla subtire', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812129', 'laminator de bandaje si discuri', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812130', 'laminator de tevi', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812131', 'laminator pe laminoare continue', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812132', 'laminator de benzi la rece', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812133', 'presator de tevi la cald si profiluri prin extruziune', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812134', 'alimentator-încalzitor de materiale', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812135', 'operator la cuptoare si instalatii pentru turnarea si laminarea metalelor', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812136', 'laminator', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812137', 'termist-tratamentist de produse brute, forjate, turnate sau laminate', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812138', 'termist tratamentist de piese semifabricate, finite', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812139', 'calitor prin inductie sau cu flacara', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812140', 'calitor scule', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812141', 'termist-tratamentist', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812142', 'operator la instalatii de tratament termic cu procesare', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812143', 'operator la pregatirea sarjelor pentru tratament termic', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812144', 'finisor laminate si trefilate', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812145', 'decapator', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812146', 'regulator tevi', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812147', 'trefilator, tragator', '', '8121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812201', 'galvanizator', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812202', 'metalizator prin pulverizare', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812203', 'metalizator prin cufundare în metal topit', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812204', 'confectioner protectii si obiecte anticorozive', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812205', 'emailator', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812206', 'operator la confectionarea materialelor electroizolante', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812207', 'matisor cabluri', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812208', 'metalizator-termist', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812209', 'arzator email', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812210', 'emailator insigne si decoratii', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812211', 'emailator firme si decoruri', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812212', 'emailator prin pudrare', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812213', 'emailator prin pulverizare', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812214', 'preparator email', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812215', 'emailator prin imersiune', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812216', 'acoperitor metale', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812217', 'poleitor filiere', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812218', 'protejator conductori cabluri si condensatori statici de forta', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812219', 'confectioner izolatii la conductori electrici', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812220', 'confectioner mantale de plumb prin presare la cabluri', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812221', 'confectioner toroane si cablaje la conductori electrici', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812222', 'pregatitor seturi de cabluri electrice pentru autotrac si accesorii', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812223', 'preparator electrolit si amestec depolarizator', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812224', 'confectioner si legator depolarizator', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812225', 'asamblator elemente si baterii galvanice', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812226', 'confectioner de elemente galvanice', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('812227', 'confectioner celule de electroliza', '', '8122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813101', 'operator la masini de macinare fina (produse chimice)', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813102', 'operator la masini de fragmentare (produse chimice)', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813103', 'operator la masini de amestecare (produse chimice)', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813104', 'operator la instalatii de ardere', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813105', 'uscator în industria chimica', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813106', 'preparator în industria chimica', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813107', 'sinterizator', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813108', 'operator la fabricarea sticlei', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813109', 'împâslitor pânza sticla', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813110', 'filator fibre sticla', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813111', 'preparator amestec si topitor sticla', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('813112', 'operator poliesteri armati cu fibra de sticla', '', '8131', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
