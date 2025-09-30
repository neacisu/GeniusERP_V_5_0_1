-- COR Occupations SQL - Batch 42

INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831202', 'manevrant vagoane', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831203', 'sef manevra', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831204', 'acar', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831205', 'sef tren', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831206', 'paznic bariera', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('831207', 'revizor ace', '', '8312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832101', 'conducator de motocicleta', '', '8321', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832102', 'conducator de motoscuter', '', '8321', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832201', 'sofer de autoturisme si camionete', '', '8322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832202', 'sofer autosanitara', '', '8322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832203', 'sofer autoambulanta', '', '8322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('832204', 'pilot încercare auto', '', '8322', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833101', 'sofer autobuz', '', '8331', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833102', 'conducator troleibuz', '', '8331', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833103', 'conducator tramvai (vatman)', '', '8331', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833201', 'sofer autocamion/masina de mare tonaj', '', '8332', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833202', 'sofer transport valori bancare', '', '8332', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833203', 'lucrator operativ pentru autocontainere', '', '8332', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833204', 'conducator autospeciala', '', '8332', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('833205', 'camionagiu', '', '8332', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834101', 'tractorist', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834102', 'combiner agricol', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834103', 'motorist la motoagregate si masini în silvicultura', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834104', 'mecanic de exploatare în cultura mare', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834105', 'mecanic de exploatare în zootehnie', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834106', 'operator la colectatul si manipulatul lemnului', '', '8341', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834201', 'masinist la masini pentru terasamente (ifronist)', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834202', 'masinist la instalatiile de preparat si turnat beton si mixturi asfaltice', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834203', 'masinist la masini cale mecanizare usoara si grea', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834204', 'operator la utilaje de forjat dirijat', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834205', 'operator la utilaje de reabilitari conducte subterane', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834206', 'operator la utilaje pentru subtraversari', '', '8342', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834301', 'macaragiu', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834302', 'masinist pod rulant', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834303', 'funicularist', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834304', 'macaragiu macarale plutitoare', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834305', 'sofer automacaragiu', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834306', 'supraveghetor statie senal navigabil', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834307', 'funicularist, funiculare pasagere', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834308', 'mecanizator (muncitor portuar)', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834309', 'liftier', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834310', 'docher', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834311', 'sef echipa docheri', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834312', 'docher instalatii de încarcare/descarcare la bordul navei si cheu', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834313', 'docher-amarator', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834314', 'docher-mecanizator', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834315', 'macaragiu portuar', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834316', 'operator la platforme pentru lucru la înaltime', '', '8343', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834401', 'masinist la masini mobile pentru transporturi interioare', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834402', 'masinist la alte masini fixe de transport pe orizontala si verticala', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834403', 'stivuitorist', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834404', 'tractorist portuar', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834405', 'conducator autotrailer', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834406', 'conducator autoîncarcator portuar', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('834407', 'stivuitorist portuar', '', '8344', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835001', 'marinar, pilot naval, barjist', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835002', 'observator far maritim si statie semnal de ceata', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835003', 'marinar legator', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835004', 'conducator ambarcatiuni agrement pe ape interioare', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835005', 'pontonier feribot', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835006', 'servator far maritim si statie semnal de ceata', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835007', 'conducator de salupa maritima/fluviala', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835008', 'timonier maritim/fluvial', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('835009', 'motopompist', '', '8350', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('911101', 'menajera', '', '9111', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('911201', 'femeie de serviciu', '', '9112', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('911202', 'îngrijitor spatii hoteliere', '', '9112', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('911203', 'lucrator room-service hotel', '', '9112', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912101', 'calcatoreasa lenjerie', '', '9121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912102', 'curatatoreasa lenjerie', '', '9121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912103', 'spalatoreasa lenjerie', '', '9121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912104', 'spalator covoare înnodate', '', '9121', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912201', 'spalator vehicule', '', '9122', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('912301', 'spalator vitrine si geamuri', '', '9123', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921201', 'îngrijitor animale', '', '9212', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921301', 'muncitor manipulare si pregatire furaje', '', '9213', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921302', 'muncitor necalificat în agricultura', '', '9213', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921303', 'vacar', '', '9213', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921501', 'îngrijitor pomi', '', '9215', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921502', 'muncitor necalificat în silvicultura', '', '9215', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921503', 'taietor manual lemn de foc', '', '9215', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921601', 'muncitor necalificat în pescuit si vânatoare', '', '9216', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('921602', 'muncitor piscicol', '', '9216', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931101', 'muncitor necalificat în mine si cariere', '', '9311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931102', 'împingator vagoneti', '', '9311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931201', 'lucrator la amenajarea terenurilor sportive (amenajator baza sportiva)', '', '9312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931202', 'îngrijitor spatii verzi', '', '9312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931203', 'muncitor necalificat la întretinerea de drumuri, sosele, poduri, baraje', '', '9312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931204', 'sapator manual', '', '9312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931301', 'muncitor necalificat la demolarea cladirilor, captuseli zidarie, placi mozaic, faianta, gresie, parchet', '', '9313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('931302', 'muncitor necalificat la spargerea si taierea materialelor de constructii', '', '9313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932101', 'ambalator manual', '', '9321', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932901', 'îmbuteliator fluide sub presiune', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932902', 'marcator piese', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932903', 'muncitor necalificat la ambalarea produselor sub forma de praf si granule', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932904', 'muncitor necalificat la ambalarea produselor solide si semisolide', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932905', 'muncitor necalificat în industria confectiilor', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932906', 'muncitor necalificat la asamblarea, montarea pieselor', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932907', 'lucrator sortator deseuri reciclabile', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('932908', 'îmbuteliator gaz petrol lichefiat', '', '9329', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
