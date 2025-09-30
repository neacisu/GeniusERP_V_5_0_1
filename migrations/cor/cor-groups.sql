-- COR Groups SQL

-- Major Groups
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('1', 'Grupa majora 1', 'Grupa majora 1')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('5', 'Grupa majora 5', 'Grupa majora 5')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('2', 'Grupa majora 2', 'Grupa majora 2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('3', 'Grupa majora 3', 'Grupa majora 3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('4', 'Grupa majora 4', 'Grupa majora 4')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('6', 'Grupa majora 6', 'Grupa majora 6')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('7', 'Grupa majora 7', 'Grupa majora 7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('8', 'Grupa majora 8', 'Grupa majora 8')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();
INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('9', 'Grupa majora 9', 'Grupa majora 9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();

-- Submajor Groups
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('11', 'Subgrupa majora 11', 'Subgrupa majora 11', '1')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('12', 'Subgrupa majora 12', 'Subgrupa majora 12', '1')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('54', 'Subgrupa majora 54', 'Subgrupa majora 54', '5')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('13', 'Subgrupa majora 13', 'Subgrupa majora 13', '1')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('14', 'Subgrupa majora 14', 'Subgrupa majora 14', '1')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('21', 'Subgrupa majora 21', 'Subgrupa majora 21', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('22', 'Subgrupa majora 22', 'Subgrupa majora 22', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('23', 'Subgrupa majora 23', 'Subgrupa majora 23', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('24', 'Subgrupa majora 24', 'Subgrupa majora 24', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('25', 'Subgrupa majora 25', 'Subgrupa majora 25', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('26', 'Subgrupa majora 26', 'Subgrupa majora 26', '2')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('31', 'Subgrupa majora 31', 'Subgrupa majora 31', '3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('32', 'Subgrupa majora 32', 'Subgrupa majora 32', '3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('33', 'Subgrupa majora 33', 'Subgrupa majora 33', '3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('34', 'Subgrupa majora 34', 'Subgrupa majora 34', '3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('35', 'Subgrupa majora 35', 'Subgrupa majora 35', '3')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('41', 'Subgrupa majora 41', 'Subgrupa majora 41', '4')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('42', 'Subgrupa majora 42', 'Subgrupa majora 42', '4')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('43', 'Subgrupa majora 43', 'Subgrupa majora 43', '4')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('44', 'Subgrupa majora 44', 'Subgrupa majora 44', '4')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('51', 'Subgrupa majora 51', 'Subgrupa majora 51', '5')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('52', 'Subgrupa majora 52', 'Subgrupa majora 52', '5')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('53', 'Subgrupa majora 53', 'Subgrupa majora 53', '5')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('61', 'Subgrupa majora 61', 'Subgrupa majora 61', '6')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('62', 'Subgrupa majora 62', 'Subgrupa majora 62', '6')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('71', 'Subgrupa majora 71', 'Subgrupa majora 71', '7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('72', 'Subgrupa majora 72', 'Subgrupa majora 72', '7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('73', 'Subgrupa majora 73', 'Subgrupa majora 73', '7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('74', 'Subgrupa majora 74', 'Subgrupa majora 74', '7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('75', 'Subgrupa majora 75', 'Subgrupa majora 75', '7')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('81', 'Subgrupa majora 81', 'Subgrupa majora 81', '8')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('82', 'Subgrupa majora 82', 'Subgrupa majora 82', '8')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('83', 'Subgrupa majora 83', 'Subgrupa majora 83', '8')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('91', 'Subgrupa majora 91', 'Subgrupa majora 91', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('92', 'Subgrupa majora 92', 'Subgrupa majora 92', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('93', 'Subgrupa majora 93', 'Subgrupa majora 93', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('94', 'Subgrupa majora 94', 'Subgrupa majora 94', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('95', 'Subgrupa majora 95', 'Subgrupa majora 95', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();
INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('96', 'Subgrupa majora 96', 'Subgrupa majora 96', '9')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();

-- Minor Groups
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('111', 'Grupa minora 111', 'Grupa minora 111', '11')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('112', 'Grupa minora 112', 'Grupa minora 112', '11')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('121', 'Grupa minora 121', 'Grupa minora 121', '12')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('541', 'Grupa minora 541', 'Grupa minora 541', '54')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('122', 'Grupa minora 122', 'Grupa minora 122', '12')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('131', 'Grupa minora 131', 'Grupa minora 131', '13')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('132', 'Grupa minora 132', 'Grupa minora 132', '13')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('133', 'Grupa minora 133', 'Grupa minora 133', '13')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('134', 'Grupa minora 134', 'Grupa minora 134', '13')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('141', 'Grupa minora 141', 'Grupa minora 141', '14')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('142', 'Grupa minora 142', 'Grupa minora 142', '14')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('143', 'Grupa minora 143', 'Grupa minora 143', '14')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('211', 'Grupa minora 211', 'Grupa minora 211', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('212', 'Grupa minora 212', 'Grupa minora 212', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('213', 'Grupa minora 213', 'Grupa minora 213', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('214', 'Grupa minora 214', 'Grupa minora 214', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('215', 'Grupa minora 215', 'Grupa minora 215', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('216', 'Grupa minora 216', 'Grupa minora 216', '21')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('221', 'Grupa minora 221', 'Grupa minora 221', '22')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('222', 'Grupa minora 222', 'Grupa minora 222', '22')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('223', 'Grupa minora 223', 'Grupa minora 223', '22')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('225', 'Grupa minora 225', 'Grupa minora 225', '22')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('226', 'Grupa minora 226', 'Grupa minora 226', '22')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('231', 'Grupa minora 231', 'Grupa minora 231', '23')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('232', 'Grupa minora 232', 'Grupa minora 232', '23')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('233', 'Grupa minora 233', 'Grupa minora 233', '23')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('234', 'Grupa minora 234', 'Grupa minora 234', '23')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('235', 'Grupa minora 235', 'Grupa minora 235', '23')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('241', 'Grupa minora 241', 'Grupa minora 241', '24')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('242', 'Grupa minora 242', 'Grupa minora 242', '24')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('243', 'Grupa minora 243', 'Grupa minora 243', '24')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('251', 'Grupa minora 251', 'Grupa minora 251', '25')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('252', 'Grupa minora 252', 'Grupa minora 252', '25')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('261', 'Grupa minora 261', 'Grupa minora 261', '26')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('262', 'Grupa minora 262', 'Grupa minora 262', '26')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('263', 'Grupa minora 263', 'Grupa minora 263', '26')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('264', 'Grupa minora 264', 'Grupa minora 264', '26')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('265', 'Grupa minora 265', 'Grupa minora 265', '26')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('311', 'Grupa minora 311', 'Grupa minora 311', '31')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('312', 'Grupa minora 312', 'Grupa minora 312', '31')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('313', 'Grupa minora 313', 'Grupa minora 313', '31')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('314', 'Grupa minora 314', 'Grupa minora 314', '31')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('315', 'Grupa minora 315', 'Grupa minora 315', '31')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('321', 'Grupa minora 321', 'Grupa minora 321', '32')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('322', 'Grupa minora 322', 'Grupa minora 322', '32')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('324', 'Grupa minora 324', 'Grupa minora 324', '32')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('325', 'Grupa minora 325', 'Grupa minora 325', '32')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('331', 'Grupa minora 331', 'Grupa minora 331', '33')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('332', 'Grupa minora 332', 'Grupa minora 332', '33')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('333', 'Grupa minora 333', 'Grupa minora 333', '33')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('334', 'Grupa minora 334', 'Grupa minora 334', '33')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('335', 'Grupa minora 335', 'Grupa minora 335', '33')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('341', 'Grupa minora 341', 'Grupa minora 341', '34')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('342', 'Grupa minora 342', 'Grupa minora 342', '34')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('343', 'Grupa minora 343', 'Grupa minora 343', '34')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('351', 'Grupa minora 351', 'Grupa minora 351', '35')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('352', 'Grupa minora 352', 'Grupa minora 352', '35')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('411', 'Grupa minora 411', 'Grupa minora 411', '41')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('412', 'Grupa minora 412', 'Grupa minora 412', '41')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('413', 'Grupa minora 413', 'Grupa minora 413', '41')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('421', 'Grupa minora 421', 'Grupa minora 421', '42')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('422', 'Grupa minora 422', 'Grupa minora 422', '42')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('431', 'Grupa minora 431', 'Grupa minora 431', '43')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('432', 'Grupa minora 432', 'Grupa minora 432', '43')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('441', 'Grupa minora 441', 'Grupa minora 441', '44')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('511', 'Grupa minora 511', 'Grupa minora 511', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('512', 'Grupa minora 512', 'Grupa minora 512', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('513', 'Grupa minora 513', 'Grupa minora 513', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('514', 'Grupa minora 514', 'Grupa minora 514', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('515', 'Grupa minora 515', 'Grupa minora 515', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('516', 'Grupa minora 516', 'Grupa minora 516', '51')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('521', 'Grupa minora 521', 'Grupa minora 521', '52')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('522', 'Grupa minora 522', 'Grupa minora 522', '52')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('523', 'Grupa minora 523', 'Grupa minora 523', '52')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('524', 'Grupa minora 524', 'Grupa minora 524', '52')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('531', 'Grupa minora 531', 'Grupa minora 531', '53')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('532', 'Grupa minora 532', 'Grupa minora 532', '53')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('611', 'Grupa minora 611', 'Grupa minora 611', '61')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('612', 'Grupa minora 612', 'Grupa minora 612', '61')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('613', 'Grupa minora 613', 'Grupa minora 613', '61')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('621', 'Grupa minora 621', 'Grupa minora 621', '62')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('622', 'Grupa minora 622', 'Grupa minora 622', '62')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('711', 'Grupa minora 711', 'Grupa minora 711', '71')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('712', 'Grupa minora 712', 'Grupa minora 712', '71')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('713', 'Grupa minora 713', 'Grupa minora 713', '71')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('721', 'Grupa minora 721', 'Grupa minora 721', '72')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('722', 'Grupa minora 722', 'Grupa minora 722', '72')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('723', 'Grupa minora 723', 'Grupa minora 723', '72')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('731', 'Grupa minora 731', 'Grupa minora 731', '73')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('732', 'Grupa minora 732', 'Grupa minora 732', '73')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('741', 'Grupa minora 741', 'Grupa minora 741', '74')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('742', 'Grupa minora 742', 'Grupa minora 742', '74')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('751', 'Grupa minora 751', 'Grupa minora 751', '75')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('752', 'Grupa minora 752', 'Grupa minora 752', '75')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('753', 'Grupa minora 753', 'Grupa minora 753', '75')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('754', 'Grupa minora 754', 'Grupa minora 754', '75')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('811', 'Grupa minora 811', 'Grupa minora 811', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('812', 'Grupa minora 812', 'Grupa minora 812', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('813', 'Grupa minora 813', 'Grupa minora 813', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('814', 'Grupa minora 814', 'Grupa minora 814', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('815', 'Grupa minora 815', 'Grupa minora 815', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('816', 'Grupa minora 816', 'Grupa minora 816', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('817', 'Grupa minora 817', 'Grupa minora 817', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('818', 'Grupa minora 818', 'Grupa minora 818', '81')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('821', 'Grupa minora 821', 'Grupa minora 821', '82')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('831', 'Grupa minora 831', 'Grupa minora 831', '83')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('832', 'Grupa minora 832', 'Grupa minora 832', '83')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('833', 'Grupa minora 833', 'Grupa minora 833', '83')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('834', 'Grupa minora 834', 'Grupa minora 834', '83')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('835', 'Grupa minora 835', 'Grupa minora 835', '83')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('911', 'Grupa minora 911', 'Grupa minora 911', '91')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('912', 'Grupa minora 912', 'Grupa minora 912', '91')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('921', 'Grupa minora 921', 'Grupa minora 921', '92')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('931', 'Grupa minora 931', 'Grupa minora 931', '93')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('932', 'Grupa minora 932', 'Grupa minora 932', '93')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('933', 'Grupa minora 933', 'Grupa minora 933', '93')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('941', 'Grupa minora 941', 'Grupa minora 941', '94')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('951', 'Grupa minora 951', 'Grupa minora 951', '95')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('952', 'Grupa minora 952', 'Grupa minora 952', '95')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('961', 'Grupa minora 961', 'Grupa minora 961', '96')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();
INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('962', 'Grupa minora 962', 'Grupa minora 962', '96')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();

-- Subminor Groups
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1111', 'Subgrupa minora 1111', 'Subgrupa minora 1111', '111')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1112', 'Subgrupa minora 1112', 'Subgrupa minora 1112', '111')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1113', 'Subgrupa minora 1113', 'Subgrupa minora 1113', '111')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1114', 'Subgrupa minora 1114', 'Subgrupa minora 1114', '111')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1120', 'Subgrupa minora 1120', 'Subgrupa minora 1120', '112')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1211', 'Subgrupa minora 1211', 'Subgrupa minora 1211', '121')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1212', 'Subgrupa minora 1212', 'Subgrupa minora 1212', '121')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1213', 'Subgrupa minora 1213', 'Subgrupa minora 1213', '121')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5414', 'Subgrupa minora 5414', 'Subgrupa minora 5414', '541')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1219', 'Subgrupa minora 1219', 'Subgrupa minora 1219', '121')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1221', 'Subgrupa minora 1221', 'Subgrupa minora 1221', '122')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1222', 'Subgrupa minora 1222', 'Subgrupa minora 1222', '122')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1223', 'Subgrupa minora 1223', 'Subgrupa minora 1223', '122')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1311', 'Subgrupa minora 1311', 'Subgrupa minora 1311', '131')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1312', 'Subgrupa minora 1312', 'Subgrupa minora 1312', '131')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1321', 'Subgrupa minora 1321', 'Subgrupa minora 1321', '132')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1322', 'Subgrupa minora 1322', 'Subgrupa minora 1322', '132')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1323', 'Subgrupa minora 1323', 'Subgrupa minora 1323', '132')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1324', 'Subgrupa minora 1324', 'Subgrupa minora 1324', '132')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1330', 'Subgrupa minora 1330', 'Subgrupa minora 1330', '133')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1349', 'Subgrupa minora 1349', 'Subgrupa minora 1349', '134')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1342', 'Subgrupa minora 1342', 'Subgrupa minora 1342', '134')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1344', 'Subgrupa minora 1344', 'Subgrupa minora 1344', '134')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1345', 'Subgrupa minora 1345', 'Subgrupa minora 1345', '134')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1346', 'Subgrupa minora 1346', 'Subgrupa minora 1346', '134')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1411', 'Subgrupa minora 1411', 'Subgrupa minora 1411', '141')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1412', 'Subgrupa minora 1412', 'Subgrupa minora 1412', '141')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1420', 'Subgrupa minora 1420', 'Subgrupa minora 1420', '142')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1431', 'Subgrupa minora 1431', 'Subgrupa minora 1431', '143')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('1439', 'Subgrupa minora 1439', 'Subgrupa minora 1439', '143')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2111', 'Subgrupa minora 2111', 'Subgrupa minora 2111', '211')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2112', 'Subgrupa minora 2112', 'Subgrupa minora 2112', '211')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2113', 'Subgrupa minora 2113', 'Subgrupa minora 2113', '211')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2114', 'Subgrupa minora 2114', 'Subgrupa minora 2114', '211')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2120', 'Subgrupa minora 2120', 'Subgrupa minora 2120', '212')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2131', 'Subgrupa minora 2131', 'Subgrupa minora 2131', '213')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2132', 'Subgrupa minora 2132', 'Subgrupa minora 2132', '213')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2133', 'Subgrupa minora 2133', 'Subgrupa minora 2133', '213')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2141', 'Subgrupa minora 2141', 'Subgrupa minora 2141', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2142', 'Subgrupa minora 2142', 'Subgrupa minora 2142', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2143', 'Subgrupa minora 2143', 'Subgrupa minora 2143', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2144', 'Subgrupa minora 2144', 'Subgrupa minora 2144', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2145', 'Subgrupa minora 2145', 'Subgrupa minora 2145', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2146', 'Subgrupa minora 2146', 'Subgrupa minora 2146', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2149', 'Subgrupa minora 2149', 'Subgrupa minora 2149', '214')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2151', 'Subgrupa minora 2151', 'Subgrupa minora 2151', '215')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2152', 'Subgrupa minora 2152', 'Subgrupa minora 2152', '215')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2153', 'Subgrupa minora 2153', 'Subgrupa minora 2153', '215')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2161', 'Subgrupa minora 2161', 'Subgrupa minora 2161', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2162', 'Subgrupa minora 2162', 'Subgrupa minora 2162', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2163', 'Subgrupa minora 2163', 'Subgrupa minora 2163', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2164', 'Subgrupa minora 2164', 'Subgrupa minora 2164', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2165', 'Subgrupa minora 2165', 'Subgrupa minora 2165', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2166', 'Subgrupa minora 2166', 'Subgrupa minora 2166', '216')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2211', 'Subgrupa minora 2211', 'Subgrupa minora 2211', '221')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2212', 'Subgrupa minora 2212', 'Subgrupa minora 2212', '221')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2221', 'Subgrupa minora 2221', 'Subgrupa minora 2221', '222')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2222', 'Subgrupa minora 2222', 'Subgrupa minora 2222', '222')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2230', 'Subgrupa minora 2230', 'Subgrupa minora 2230', '223')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2250', 'Subgrupa minora 2250', 'Subgrupa minora 2250', '225')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2261', 'Subgrupa minora 2261', 'Subgrupa minora 2261', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2262', 'Subgrupa minora 2262', 'Subgrupa minora 2262', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2263', 'Subgrupa minora 2263', 'Subgrupa minora 2263', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2264', 'Subgrupa minora 2264', 'Subgrupa minora 2264', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2265', 'Subgrupa minora 2265', 'Subgrupa minora 2265', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2266', 'Subgrupa minora 2266', 'Subgrupa minora 2266', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2267', 'Subgrupa minora 2267', 'Subgrupa minora 2267', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2269', 'Subgrupa minora 2269', 'Subgrupa minora 2269', '226')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2310', 'Subgrupa minora 2310', 'Subgrupa minora 2310', '231')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2320', 'Subgrupa minora 2320', 'Subgrupa minora 2320', '232')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2330', 'Subgrupa minora 2330', 'Subgrupa minora 2330', '233')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2341', 'Subgrupa minora 2341', 'Subgrupa minora 2341', '234')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2342', 'Subgrupa minora 2342', 'Subgrupa minora 2342', '234')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2351', 'Subgrupa minora 2351', 'Subgrupa minora 2351', '235')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2352', 'Subgrupa minora 2352', 'Subgrupa minora 2352', '235')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2359', 'Subgrupa minora 2359', 'Subgrupa minora 2359', '235')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2411', 'Subgrupa minora 2411', 'Subgrupa minora 2411', '241')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2412', 'Subgrupa minora 2412', 'Subgrupa minora 2412', '241')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2413', 'Subgrupa minora 2413', 'Subgrupa minora 2413', '241')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2421', 'Subgrupa minora 2421', 'Subgrupa minora 2421', '242')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2422', 'Subgrupa minora 2422', 'Subgrupa minora 2422', '242')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2423', 'Subgrupa minora 2423', 'Subgrupa minora 2423', '242')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2424', 'Subgrupa minora 2424', 'Subgrupa minora 2424', '242')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2429', 'Subgrupa minora 2429', 'Subgrupa minora 2429', '242')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2431', 'Subgrupa minora 2431', 'Subgrupa minora 2431', '243')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2432', 'Subgrupa minora 2432', 'Subgrupa minora 2432', '243')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2433', 'Subgrupa minora 2433', 'Subgrupa minora 2433', '243')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2511', 'Subgrupa minora 2511', 'Subgrupa minora 2511', '251')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2512', 'Subgrupa minora 2512', 'Subgrupa minora 2512', '251')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2513', 'Subgrupa minora 2513', 'Subgrupa minora 2513', '251')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2514', 'Subgrupa minora 2514', 'Subgrupa minora 2514', '251')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2519', 'Subgrupa minora 2519', 'Subgrupa minora 2519', '251')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2521', 'Subgrupa minora 2521', 'Subgrupa minora 2521', '252')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2522', 'Subgrupa minora 2522', 'Subgrupa minora 2522', '252')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2523', 'Subgrupa minora 2523', 'Subgrupa minora 2523', '252')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2529', 'Subgrupa minora 2529', 'Subgrupa minora 2529', '252')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2611', 'Subgrupa minora 2611', 'Subgrupa minora 2611', '261')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2612', 'Subgrupa minora 2612', 'Subgrupa minora 2612', '261')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2619', 'Subgrupa minora 2619', 'Subgrupa minora 2619', '261')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2621', 'Subgrupa minora 2621', 'Subgrupa minora 2621', '262')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2622', 'Subgrupa minora 2622', 'Subgrupa minora 2622', '262')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2631', 'Subgrupa minora 2631', 'Subgrupa minora 2631', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2632', 'Subgrupa minora 2632', 'Subgrupa minora 2632', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2633', 'Subgrupa minora 2633', 'Subgrupa minora 2633', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2634', 'Subgrupa minora 2634', 'Subgrupa minora 2634', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2635', 'Subgrupa minora 2635', 'Subgrupa minora 2635', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2636', 'Subgrupa minora 2636', 'Subgrupa minora 2636', '263')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2641', 'Subgrupa minora 2641', 'Subgrupa minora 2641', '264')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2642', 'Subgrupa minora 2642', 'Subgrupa minora 2642', '264')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2643', 'Subgrupa minora 2643', 'Subgrupa minora 2643', '264')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2651', 'Subgrupa minora 2651', 'Subgrupa minora 2651', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2652', 'Subgrupa minora 2652', 'Subgrupa minora 2652', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2653', 'Subgrupa minora 2653', 'Subgrupa minora 2653', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2654', 'Subgrupa minora 2654', 'Subgrupa minora 2654', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2655', 'Subgrupa minora 2655', 'Subgrupa minora 2655', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2656', 'Subgrupa minora 2656', 'Subgrupa minora 2656', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('2659', 'Subgrupa minora 2659', 'Subgrupa minora 2659', '265')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3111', 'Subgrupa minora 3111', 'Subgrupa minora 3111', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3112', 'Subgrupa minora 3112', 'Subgrupa minora 3112', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3113', 'Subgrupa minora 3113', 'Subgrupa minora 3113', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3114', 'Subgrupa minora 3114', 'Subgrupa minora 3114', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3115', 'Subgrupa minora 3115', 'Subgrupa minora 3115', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3116', 'Subgrupa minora 3116', 'Subgrupa minora 3116', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3117', 'Subgrupa minora 3117', 'Subgrupa minora 3117', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3118', 'Subgrupa minora 3118', 'Subgrupa minora 3118', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3119', 'Subgrupa minora 3119', 'Subgrupa minora 3119', '311')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3121', 'Subgrupa minora 3121', 'Subgrupa minora 3121', '312')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3122', 'Subgrupa minora 3122', 'Subgrupa minora 3122', '312')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3131', 'Subgrupa minora 3131', 'Subgrupa minora 3131', '313')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3132', 'Subgrupa minora 3132', 'Subgrupa minora 3132', '313')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3134', 'Subgrupa minora 3134', 'Subgrupa minora 3134', '313')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3139', 'Subgrupa minora 3139', 'Subgrupa minora 3139', '313')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3141', 'Subgrupa minora 3141', 'Subgrupa minora 3141', '314')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3142', 'Subgrupa minora 3142', 'Subgrupa minora 3142', '314')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3143', 'Subgrupa minora 3143', 'Subgrupa minora 3143', '314')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3151', 'Subgrupa minora 3151', 'Subgrupa minora 3151', '315')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3152', 'Subgrupa minora 3152', 'Subgrupa minora 3152', '315')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3153', 'Subgrupa minora 3153', 'Subgrupa minora 3153', '315')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3154', 'Subgrupa minora 3154', 'Subgrupa minora 3154', '315')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3155', 'Subgrupa minora 3155', 'Subgrupa minora 3155', '315')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3211', 'Subgrupa minora 3211', 'Subgrupa minora 3211', '321')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3212', 'Subgrupa minora 3212', 'Subgrupa minora 3212', '321')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3213', 'Subgrupa minora 3213', 'Subgrupa minora 3213', '321')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3214', 'Subgrupa minora 3214', 'Subgrupa minora 3214', '321')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3215', 'Subgrupa minora 3215', 'Subgrupa minora 3215', '321')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3221', 'Subgrupa minora 3221', 'Subgrupa minora 3221', '322')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3222', 'Subgrupa minora 3222', 'Subgrupa minora 3222', '322')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3240', 'Subgrupa minora 3240', 'Subgrupa minora 3240', '324')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3251', 'Subgrupa minora 3251', 'Subgrupa minora 3251', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3253', 'Subgrupa minora 3253', 'Subgrupa minora 3253', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3254', 'Subgrupa minora 3254', 'Subgrupa minora 3254', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3255', 'Subgrupa minora 3255', 'Subgrupa minora 3255', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3256', 'Subgrupa minora 3256', 'Subgrupa minora 3256', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3257', 'Subgrupa minora 3257', 'Subgrupa minora 3257', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3258', 'Subgrupa minora 3258', 'Subgrupa minora 3258', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3259', 'Subgrupa minora 3259', 'Subgrupa minora 3259', '325')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3311', 'Subgrupa minora 3311', 'Subgrupa minora 3311', '331')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3312', 'Subgrupa minora 3312', 'Subgrupa minora 3312', '331')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3313', 'Subgrupa minora 3313', 'Subgrupa minora 3313', '331')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3314', 'Subgrupa minora 3314', 'Subgrupa minora 3314', '331')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3315', 'Subgrupa minora 3315', 'Subgrupa minora 3315', '331')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3321', 'Subgrupa minora 3321', 'Subgrupa minora 3321', '332')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3322', 'Subgrupa minora 3322', 'Subgrupa minora 3322', '332')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3323', 'Subgrupa minora 3323', 'Subgrupa minora 3323', '332')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3324', 'Subgrupa minora 3324', 'Subgrupa minora 3324', '332')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3331', 'Subgrupa minora 3331', 'Subgrupa minora 3331', '333')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3333', 'Subgrupa minora 3333', 'Subgrupa minora 3333', '333')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3334', 'Subgrupa minora 3334', 'Subgrupa minora 3334', '333')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3339', 'Subgrupa minora 3339', 'Subgrupa minora 3339', '333')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3342', 'Subgrupa minora 3342', 'Subgrupa minora 3342', '334')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3343', 'Subgrupa minora 3343', 'Subgrupa minora 3343', '334')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3344', 'Subgrupa minora 3344', 'Subgrupa minora 3344', '334')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3351', 'Subgrupa minora 3351', 'Subgrupa minora 3351', '335')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3352', 'Subgrupa minora 3352', 'Subgrupa minora 3352', '335')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3354', 'Subgrupa minora 3354', 'Subgrupa minora 3354', '335')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3355', 'Subgrupa minora 3355', 'Subgrupa minora 3355', '335')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3359', 'Subgrupa minora 3359', 'Subgrupa minora 3359', '335')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3411', 'Subgrupa minora 3411', 'Subgrupa minora 3411', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3412', 'Subgrupa minora 3412', 'Subgrupa minora 3412', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3413', 'Subgrupa minora 3413', 'Subgrupa minora 3413', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3414', 'Subgrupa minora 3414', 'Subgrupa minora 3414', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3415', 'Subgrupa minora 3415', 'Subgrupa minora 3415', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3416', 'Subgrupa minora 3416', 'Subgrupa minora 3416', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3419', 'Subgrupa minora 3419', 'Subgrupa minora 3419', '341')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3421', 'Subgrupa minora 3421', 'Subgrupa minora 3421', '342')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3422', 'Subgrupa minora 3422', 'Subgrupa minora 3422', '342')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3423', 'Subgrupa minora 3423', 'Subgrupa minora 3423', '342')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3431', 'Subgrupa minora 3431', 'Subgrupa minora 3431', '343')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3432', 'Subgrupa minora 3432', 'Subgrupa minora 3432', '343')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3433', 'Subgrupa minora 3433', 'Subgrupa minora 3433', '343')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3434', 'Subgrupa minora 3434', 'Subgrupa minora 3434', '343')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3435', 'Subgrupa minora 3435', 'Subgrupa minora 3435', '343')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3511', 'Subgrupa minora 3511', 'Subgrupa minora 3511', '351')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3512', 'Subgrupa minora 3512', 'Subgrupa minora 3512', '351')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3521', 'Subgrupa minora 3521', 'Subgrupa minora 3521', '352')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('3522', 'Subgrupa minora 3522', 'Subgrupa minora 3522', '352')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4110', 'Subgrupa minora 4110', 'Subgrupa minora 4110', '411')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4120', 'Subgrupa minora 4120', 'Subgrupa minora 4120', '412')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4131', 'Subgrupa minora 4131', 'Subgrupa minora 4131', '413')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4132', 'Subgrupa minora 4132', 'Subgrupa minora 4132', '413')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4211', 'Subgrupa minora 4211', 'Subgrupa minora 4211', '421')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4212', 'Subgrupa minora 4212', 'Subgrupa minora 4212', '421')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4213', 'Subgrupa minora 4213', 'Subgrupa minora 4213', '421')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4214', 'Subgrupa minora 4214', 'Subgrupa minora 4214', '421')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4221', 'Subgrupa minora 4221', 'Subgrupa minora 4221', '422')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4223', 'Subgrupa minora 4223', 'Subgrupa minora 4223', '422')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4224', 'Subgrupa minora 4224', 'Subgrupa minora 4224', '422')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4225', 'Subgrupa minora 4225', 'Subgrupa minora 4225', '422')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4226', 'Subgrupa minora 4226', 'Subgrupa minora 4226', '422')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4311', 'Subgrupa minora 4311', 'Subgrupa minora 4311', '431')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4312', 'Subgrupa minora 4312', 'Subgrupa minora 4312', '431')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4313', 'Subgrupa minora 4313', 'Subgrupa minora 4313', '431')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4321', 'Subgrupa minora 4321', 'Subgrupa minora 4321', '432')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4322', 'Subgrupa minora 4322', 'Subgrupa minora 4322', '432')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4323', 'Subgrupa minora 4323', 'Subgrupa minora 4323', '432')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4411', 'Subgrupa minora 4411', 'Subgrupa minora 4411', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4412', 'Subgrupa minora 4412', 'Subgrupa minora 4412', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4413', 'Subgrupa minora 4413', 'Subgrupa minora 4413', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4415', 'Subgrupa minora 4415', 'Subgrupa minora 4415', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4416', 'Subgrupa minora 4416', 'Subgrupa minora 4416', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('4419', 'Subgrupa minora 4419', 'Subgrupa minora 4419', '441')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5111', 'Subgrupa minora 5111', 'Subgrupa minora 5111', '511')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5112', 'Subgrupa minora 5112', 'Subgrupa minora 5112', '511')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5113', 'Subgrupa minora 5113', 'Subgrupa minora 5113', '511')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5120', 'Subgrupa minora 5120', 'Subgrupa minora 5120', '512')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5131', 'Subgrupa minora 5131', 'Subgrupa minora 5131', '513')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5132', 'Subgrupa minora 5132', 'Subgrupa minora 5132', '513')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5141', 'Subgrupa minora 5141', 'Subgrupa minora 5141', '514')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5142', 'Subgrupa minora 5142', 'Subgrupa minora 5142', '514')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5151', 'Subgrupa minora 5151', 'Subgrupa minora 5151', '515')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5152', 'Subgrupa minora 5152', 'Subgrupa minora 5152', '515')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5153', 'Subgrupa minora 5153', 'Subgrupa minora 5153', '515')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5161', 'Subgrupa minora 5161', 'Subgrupa minora 5161', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5162', 'Subgrupa minora 5162', 'Subgrupa minora 5162', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5163', 'Subgrupa minora 5163', 'Subgrupa minora 5163', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5164', 'Subgrupa minora 5164', 'Subgrupa minora 5164', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5165', 'Subgrupa minora 5165', 'Subgrupa minora 5165', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5169', 'Subgrupa minora 5169', 'Subgrupa minora 5169', '516')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5212', 'Subgrupa minora 5212', 'Subgrupa minora 5212', '521')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5221', 'Subgrupa minora 5221', 'Subgrupa minora 5221', '522')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5222', 'Subgrupa minora 5222', 'Subgrupa minora 5222', '522')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5223', 'Subgrupa minora 5223', 'Subgrupa minora 5223', '522')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5230', 'Subgrupa minora 5230', 'Subgrupa minora 5230', '523')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5241', 'Subgrupa minora 5241', 'Subgrupa minora 5241', '524')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5243', 'Subgrupa minora 5243', 'Subgrupa minora 5243', '524')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5246', 'Subgrupa minora 5246', 'Subgrupa minora 5246', '524')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5311', 'Subgrupa minora 5311', 'Subgrupa minora 5311', '531')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5312', 'Subgrupa minora 5312', 'Subgrupa minora 5312', '531')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5321', 'Subgrupa minora 5321', 'Subgrupa minora 5321', '532')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5322', 'Subgrupa minora 5322', 'Subgrupa minora 5322', '532')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5329', 'Subgrupa minora 5329', 'Subgrupa minora 5329', '532')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5411', 'Subgrupa minora 5411', 'Subgrupa minora 5411', '541')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5412', 'Subgrupa minora 5412', 'Subgrupa minora 5412', '541')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5413', 'Subgrupa minora 5413', 'Subgrupa minora 5413', '541')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('5419', 'Subgrupa minora 5419', 'Subgrupa minora 5419', '541')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6111', 'Subgrupa minora 6111', 'Subgrupa minora 6111', '611')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6112', 'Subgrupa minora 6112', 'Subgrupa minora 6112', '611')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6113', 'Subgrupa minora 6113', 'Subgrupa minora 6113', '611')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6121', 'Subgrupa minora 6121', 'Subgrupa minora 6121', '612')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6122', 'Subgrupa minora 6122', 'Subgrupa minora 6122', '612')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6123', 'Subgrupa minora 6123', 'Subgrupa minora 6123', '612')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6129', 'Subgrupa minora 6129', 'Subgrupa minora 6129', '612')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6130', 'Subgrupa minora 6130', 'Subgrupa minora 6130', '613')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6210', 'Subgrupa minora 6210', 'Subgrupa minora 6210', '621')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6221', 'Subgrupa minora 6221', 'Subgrupa minora 6221', '622')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6222', 'Subgrupa minora 6222', 'Subgrupa minora 6222', '622')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6223', 'Subgrupa minora 6223', 'Subgrupa minora 6223', '622')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('6224', 'Subgrupa minora 6224', 'Subgrupa minora 6224', '622')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7111', 'Subgrupa minora 7111', 'Subgrupa minora 7111', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7112', 'Subgrupa minora 7112', 'Subgrupa minora 7112', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7113', 'Subgrupa minora 7113', 'Subgrupa minora 7113', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7114', 'Subgrupa minora 7114', 'Subgrupa minora 7114', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7115', 'Subgrupa minora 7115', 'Subgrupa minora 7115', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7119', 'Subgrupa minora 7119', 'Subgrupa minora 7119', '711')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7121', 'Subgrupa minora 7121', 'Subgrupa minora 7121', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7122', 'Subgrupa minora 7122', 'Subgrupa minora 7122', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7123', 'Subgrupa minora 7123', 'Subgrupa minora 7123', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7124', 'Subgrupa minora 7124', 'Subgrupa minora 7124', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7125', 'Subgrupa minora 7125', 'Subgrupa minora 7125', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7126', 'Subgrupa minora 7126', 'Subgrupa minora 7126', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7127', 'Subgrupa minora 7127', 'Subgrupa minora 7127', '712')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7131', 'Subgrupa minora 7131', 'Subgrupa minora 7131', '713')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7132', 'Subgrupa minora 7132', 'Subgrupa minora 7132', '713')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7133', 'Subgrupa minora 7133', 'Subgrupa minora 7133', '713')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7211', 'Subgrupa minora 7211', 'Subgrupa minora 7211', '721')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7212', 'Subgrupa minora 7212', 'Subgrupa minora 7212', '721')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7213', 'Subgrupa minora 7213', 'Subgrupa minora 7213', '721')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7214', 'Subgrupa minora 7214', 'Subgrupa minora 7214', '721')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7215', 'Subgrupa minora 7215', 'Subgrupa minora 7215', '721')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7221', 'Subgrupa minora 7221', 'Subgrupa minora 7221', '722')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7222', 'Subgrupa minora 7222', 'Subgrupa minora 7222', '722')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7223', 'Subgrupa minora 7223', 'Subgrupa minora 7223', '722')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7224', 'Subgrupa minora 7224', 'Subgrupa minora 7224', '722')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7231', 'Subgrupa minora 7231', 'Subgrupa minora 7231', '723')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7232', 'Subgrupa minora 7232', 'Subgrupa minora 7232', '723')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7233', 'Subgrupa minora 7233', 'Subgrupa minora 7233', '723')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7311', 'Subgrupa minora 7311', 'Subgrupa minora 7311', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7312', 'Subgrupa minora 7312', 'Subgrupa minora 7312', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7313', 'Subgrupa minora 7313', 'Subgrupa minora 7313', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7314', 'Subgrupa minora 7314', 'Subgrupa minora 7314', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7315', 'Subgrupa minora 7315', 'Subgrupa minora 7315', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7316', 'Subgrupa minora 7316', 'Subgrupa minora 7316', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7317', 'Subgrupa minora 7317', 'Subgrupa minora 7317', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7318', 'Subgrupa minora 7318', 'Subgrupa minora 7318', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7319', 'Subgrupa minora 7319', 'Subgrupa minora 7319', '731')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7321', 'Subgrupa minora 7321', 'Subgrupa minora 7321', '732')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7322', 'Subgrupa minora 7322', 'Subgrupa minora 7322', '732')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7323', 'Subgrupa minora 7323', 'Subgrupa minora 7323', '732')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7411', 'Subgrupa minora 7411', 'Subgrupa minora 7411', '741')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7412', 'Subgrupa minora 7412', 'Subgrupa minora 7412', '741')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7413', 'Subgrupa minora 7413', 'Subgrupa minora 7413', '741')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7421', 'Subgrupa minora 7421', 'Subgrupa minora 7421', '742')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7422', 'Subgrupa minora 7422', 'Subgrupa minora 7422', '742')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7511', 'Subgrupa minora 7511', 'Subgrupa minora 7511', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7512', 'Subgrupa minora 7512', 'Subgrupa minora 7512', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7513', 'Subgrupa minora 7513', 'Subgrupa minora 7513', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7514', 'Subgrupa minora 7514', 'Subgrupa minora 7514', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7515', 'Subgrupa minora 7515', 'Subgrupa minora 7515', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7516', 'Subgrupa minora 7516', 'Subgrupa minora 7516', '751')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7521', 'Subgrupa minora 7521', 'Subgrupa minora 7521', '752')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7522', 'Subgrupa minora 7522', 'Subgrupa minora 7522', '752')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7523', 'Subgrupa minora 7523', 'Subgrupa minora 7523', '752')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7531', 'Subgrupa minora 7531', 'Subgrupa minora 7531', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7532', 'Subgrupa minora 7532', 'Subgrupa minora 7532', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7533', 'Subgrupa minora 7533', 'Subgrupa minora 7533', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7534', 'Subgrupa minora 7534', 'Subgrupa minora 7534', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7535', 'Subgrupa minora 7535', 'Subgrupa minora 7535', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7536', 'Subgrupa minora 7536', 'Subgrupa minora 7536', '753')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7541', 'Subgrupa minora 7541', 'Subgrupa minora 7541', '754')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7542', 'Subgrupa minora 7542', 'Subgrupa minora 7542', '754')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('7543', 'Subgrupa minora 7543', 'Subgrupa minora 7543', '754')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8111', 'Subgrupa minora 8111', 'Subgrupa minora 8111', '811')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8112', 'Subgrupa minora 8112', 'Subgrupa minora 8112', '811')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8113', 'Subgrupa minora 8113', 'Subgrupa minora 8113', '811')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8114', 'Subgrupa minora 8114', 'Subgrupa minora 8114', '811')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8121', 'Subgrupa minora 8121', 'Subgrupa minora 8121', '812')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8122', 'Subgrupa minora 8122', 'Subgrupa minora 8122', '812')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8131', 'Subgrupa minora 8131', 'Subgrupa minora 8131', '813')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8132', 'Subgrupa minora 8132', 'Subgrupa minora 8132', '813')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8141', 'Subgrupa minora 8141', 'Subgrupa minora 8141', '814')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8142', 'Subgrupa minora 8142', 'Subgrupa minora 8142', '814')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8143', 'Subgrupa minora 8143', 'Subgrupa minora 8143', '814')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8151', 'Subgrupa minora 8151', 'Subgrupa minora 8151', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8152', 'Subgrupa minora 8152', 'Subgrupa minora 8152', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8153', 'Subgrupa minora 8153', 'Subgrupa minora 8153', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8154', 'Subgrupa minora 8154', 'Subgrupa minora 8154', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8155', 'Subgrupa minora 8155', 'Subgrupa minora 8155', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8156', 'Subgrupa minora 8156', 'Subgrupa minora 8156', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8159', 'Subgrupa minora 8159', 'Subgrupa minora 8159', '815')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8160', 'Subgrupa minora 8160', 'Subgrupa minora 8160', '816')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8171', 'Subgrupa minora 8171', 'Subgrupa minora 8171', '817')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8172', 'Subgrupa minora 8172', 'Subgrupa minora 8172', '817')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8181', 'Subgrupa minora 8181', 'Subgrupa minora 8181', '818')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8182', 'Subgrupa minora 8182', 'Subgrupa minora 8182', '818')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8183', 'Subgrupa minora 8183', 'Subgrupa minora 8183', '818')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8189', 'Subgrupa minora 8189', 'Subgrupa minora 8189', '818')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8211', 'Subgrupa minora 8211', 'Subgrupa minora 8211', '821')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8212', 'Subgrupa minora 8212', 'Subgrupa minora 8212', '821')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8219', 'Subgrupa minora 8219', 'Subgrupa minora 8219', '821')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8311', 'Subgrupa minora 8311', 'Subgrupa minora 8311', '831')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8312', 'Subgrupa minora 8312', 'Subgrupa minora 8312', '831')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8321', 'Subgrupa minora 8321', 'Subgrupa minora 8321', '832')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8322', 'Subgrupa minora 8322', 'Subgrupa minora 8322', '832')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8331', 'Subgrupa minora 8331', 'Subgrupa minora 8331', '833')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8332', 'Subgrupa minora 8332', 'Subgrupa minora 8332', '833')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8341', 'Subgrupa minora 8341', 'Subgrupa minora 8341', '834')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8342', 'Subgrupa minora 8342', 'Subgrupa minora 8342', '834')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8343', 'Subgrupa minora 8343', 'Subgrupa minora 8343', '834')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8344', 'Subgrupa minora 8344', 'Subgrupa minora 8344', '834')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('8350', 'Subgrupa minora 8350', 'Subgrupa minora 8350', '835')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9111', 'Subgrupa minora 9111', 'Subgrupa minora 9111', '911')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9112', 'Subgrupa minora 9112', 'Subgrupa minora 9112', '911')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9121', 'Subgrupa minora 9121', 'Subgrupa minora 9121', '912')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9122', 'Subgrupa minora 9122', 'Subgrupa minora 9122', '912')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9123', 'Subgrupa minora 9123', 'Subgrupa minora 9123', '912')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9212', 'Subgrupa minora 9212', 'Subgrupa minora 9212', '921')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9213', 'Subgrupa minora 9213', 'Subgrupa minora 9213', '921')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9215', 'Subgrupa minora 9215', 'Subgrupa minora 9215', '921')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9216', 'Subgrupa minora 9216', 'Subgrupa minora 9216', '921')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9311', 'Subgrupa minora 9311', 'Subgrupa minora 9311', '931')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9312', 'Subgrupa minora 9312', 'Subgrupa minora 9312', '931')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9313', 'Subgrupa minora 9313', 'Subgrupa minora 9313', '931')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9321', 'Subgrupa minora 9321', 'Subgrupa minora 9321', '932')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9329', 'Subgrupa minora 9329', 'Subgrupa minora 9329', '932')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9331', 'Subgrupa minora 9331', 'Subgrupa minora 9331', '933')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9333', 'Subgrupa minora 9333', 'Subgrupa minora 9333', '933')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9412', 'Subgrupa minora 9412', 'Subgrupa minora 9412', '941')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9510', 'Subgrupa minora 9510', 'Subgrupa minora 9510', '951')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9520', 'Subgrupa minora 9520', 'Subgrupa minora 9520', '952')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9611', 'Subgrupa minora 9611', 'Subgrupa minora 9611', '961')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9613', 'Subgrupa minora 9613', 'Subgrupa minora 9613', '961')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9621', 'Subgrupa minora 9621', 'Subgrupa minora 9621', '962')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9622', 'Subgrupa minora 9622', 'Subgrupa minora 9622', '962')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9623', 'Subgrupa minora 9623', 'Subgrupa minora 9623', '962')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9624', 'Subgrupa minora 9624', 'Subgrupa minora 9624', '962')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('9629', 'Subgrupa minora 9629', 'Subgrupa minora 9629', '962')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();
