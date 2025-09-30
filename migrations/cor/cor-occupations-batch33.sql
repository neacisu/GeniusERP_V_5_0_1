-- COR Occupations SQL - Batch 33

INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731105', 'centrator, debordator piese optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731106', 'centrator, finisor aparate optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731107', 'degresator, curatator piese si aparate optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731108', 'lipitor lentile si prisme', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731109', 'montator aparatura optica', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731110', 'optician', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731111', 'optician armament', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731112', 'confectioner seringi', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731113', 'presator piese optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731114', 'reparator aparate foto', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731115', 'reparator stilouri, brichete', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731116', 'reparator umbrele', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731117', 'gravor piese optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731118', 'tratamentist piese optice', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731119', 'metrolog si depanator mecanica fina, tehnica digitala si analogica (MFTDA)', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731120', 'metrolog verificator', '', '7311', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731201', 'acordor acordeoane, armonici', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731202', 'acordor piane, pianine, orga, tambal', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731203', 'caserator si slefuitor de celuloid pentru carcase acordeoane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731204', 'ceruitor de piastrine pentru acordeoane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731205', 'constructor claviatura', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731206', 'constructor-reparator de acordeoane si armonici', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731207', 'constructor-reparator de alte instrumente muzicale (suflat, percutie)', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731208', 'filator corzi pentru piane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731209', 'montator corp sonor la piane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731210', 'montator-reglor piane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731211', 'montator-ajustor de acordeoane', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731212', 'lutier', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731213', 'constructor restaurator de orgi', '', '7312', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731301', 'argintar', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731302', 'bijutier metale pretioase', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731303', 'cizelator', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731304', 'cizelator clisee galvanice', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731305', 'confectioner stampile de cauciuc, metal, facsimile', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731306', 'gravor manual', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731307', 'tintuitor', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731308', 'bijutier metale comune', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731309', 'giuvaergiu', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731310', 'slefuitor diamante naturale', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731311', 'maistru bijutier', '', '7313', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731401', 'aplicator de detalii la produse din ceramica', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731402', 'debavurator-retusor la produse din ceramica fina', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731403', 'turnator produse ceramice', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731404', 'fasonator produse ceramice', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731405', 'glazurator produse din ceramica fina', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731406', 'modelator ceramica', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731407', 'olar ceramica (artizanat)', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731408', 'preparator mase ceramice', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731409', 'presator produse ceramice', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731410', 'râsnitor smalt', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731411', 'slefuitor produse din ceramica fina', '', '7314', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731501', 'brigadier la fabricarea sticlei', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731502', 'modelator tuburi spectrale', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731503', 'tragator, slefuitor, gradator nivele', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731504', 'prelucrator topitura sticla la presa', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731505', 'prelucrator topitura sticla la teava', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731506', 'formator tuburi spectrale', '', '7315', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731601', 'pictor decor', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731602', 'gradator vase si aparate de laborator', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731603', 'gravor produse de sticla', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731604', 'inscriptioner pe produse de sticla si ceramica', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731605', 'pictor pe sticla si ceramica', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731606', 'oglindar', '', '7316', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731701', 'confectioner piese, linguri, spite, albii, donite, cozi de unelte, sindrila, ciubere', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731702', 'confectioner jucarii', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731703', 'confectioner obiecte artizanale din lemn', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731704', 'confectioner plute', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731705', 'confectioner garnituri pentru etansare', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731706', 'pirogravor', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731707', 'ramar poleitor', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731708', 'sculptor în lemn', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731709', 'confectioner creta scolara', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731710', 'traforator manual lemn', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731711', 'dogar manual', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731712', 'rotar caretas', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731713', 'lumânarar', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731714', 'confectioner cutite, brice, bratari, andrele, agrafe, inele', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731715', 'confectioner nasturi, piepteni', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731716', 'confectioner obiecte casnice din deseuri de aluminiu si alte metale', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731717', 'confectioner obiecte din ipsos', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731718', 'confectioner obiecte din os, scoica, mica etc.', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731719', 'confectioner corzi din intestine', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731720', 'încadrator tablouri', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731721', 'confectioner materiale didactice pentru stiintele naturii', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731722', 'confectioner bidinele, pensule, perii', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731723', 'confectioner maturi', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731724', 'împletitor de nuiele', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731725', 'împletitor obiecte din foi de porumb', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731726', 'împletitor papura', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731727', 'legator de par', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731728', 'sortator, spalator par', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731729', 'prelucrator de par la masina', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731730', 'prelucrator manual de par', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731731', 'împletitor din panglica împletita', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731732', 'pieptanator de par la masina', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731733', 'fierbator-uscator de par', '', '7317', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731801', 'confectioner plase pescaresti', '', '7318', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731802', 'confectioner articole hârtie', '', '7318', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731803', 'confectioner bibelouri din Jenille', '', '7318', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('731804', 'decorator în piele', '', '7318', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();
