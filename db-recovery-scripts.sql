-- Database Recovery Script
-- Generated for GeniusERP after HDD format
-- Date: 2025-10-07T23:11:06.323Z

-- ====================================
-- STEP 1: CORE SYSTEM DATA
-- ====================================

-- Plan de conturi românesc (Clasa 1-9)
INSERT INTO account_classes (code, name, description, default_account_function)
VALUES
  ('1', 'Conturi de capitaluri', 'Capital, rezerve, rezultat reportat', 'P'),
  ('2', 'Conturi de imobilizări', 'Imobilizări necorporale, corporale, financiare', 'A'),
  ('3', 'Conturi de stocuri și producție', 'Materii prime, produse finite', 'A'),
  ('4', 'Conturi de terți', 'Furnizori, clienți, personal, stat', 'B'),
  ('5', 'Conturi de trezorerie', 'Bănci, case, acreditive', 'A'),
  ('6', 'Conturi de cheltuieli', 'Cheltuieli de exploatare', 'A'),
  ('7', 'Conturi de venituri', 'Venituri din exploatare', 'P'),
  ('8', 'Conturi speciale', 'Angajamente, conturi în afara bilanțului', 'B')
ON CONFLICT (code) DO NOTHING;

-- Unități de măsură
INSERT INTO inventory_units (name, abbreviation)
VALUES
  ('Bucată', 'buc'),
  ('Kilogram', 'kg'),
  ('Litru', 'l'),
  ('Metru', 'm'),
  ('Metru pătrat', 'mp'),
  ('Metru cub', 'mc'),
  ('Pachet', 'pach'),
  ('Set', 'set'),
  ('Cutie', 'cutie'),
  ('Oră', 'h')
ON CONFLICT (name) DO NOTHING;

-- Permisiuni de bază
INSERT INTO permissions (name, description, resource, action)
VALUES
  ('users.read', 'Vizualizare utilizatori', 'users', 'read'),
  ('users.create', 'Creare utilizatori', 'users', 'create'),
  ('users.update', 'Modificare utilizatori', 'users', 'update'),
  ('users.delete', 'Ștergere utilizatori', 'users', 'delete'),
  ('invoices.read', 'Vizualizare facturi', 'invoices', 'read'),
  ('invoices.create', 'Creare facturi', 'invoices', 'create'),
  ('invoices.update', 'Modificare facturi', 'invoices', 'update'),
  ('invoices.delete', 'Ștergere facturi', 'invoices', 'delete'),
  ('products.read', 'Vizualizare produse', 'products', 'read'),
  ('products.create', 'Creare produse', 'products', 'create'),
  ('products.update', 'Modificare produse', 'products', 'update'),
  ('products.delete', 'Ștergere produse', 'products', 'delete'),
  ('accounting.read', 'Vizualizare contabilitate', 'accounting', 'read'),
  ('accounting.create', 'Creare înregistrări contabile', 'accounting', 'create'),
  ('accounting.update', 'Modificare înregistrări contabile', 'accounting', 'update'),
  ('accounting.delete', 'Ștergere înregistrări contabile', 'accounting', 'delete')
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- STEP 2: RECOMMENDED INITIAL DATA
-- ====================================
-- Uncomment and modify the following as needed:

-- Create default company
-- INSERT INTO companies (name, fiscal_code, registration_number, address, city, county, country)
-- VALUES ('Compania Mea SRL', 'RO12345678', 'J40/1234/2024', 'Str. Exemplu nr. 1', 'București', 'București', 'Romania');

-- Create admin user (password: admin123 - CHANGE IMMEDIATELY!)
-- INSERT INTO users (username, email, password, first_name, last_name, role)
-- VALUES ('admin', 'admin@example.com', '$2b$10$..hash..', 'Admin', 'System', 'admin');

-- Create admin role
-- INSERT INTO roles (company_id, name, description)
-- VALUES ((SELECT id FROM companies LIMIT 1), 'Administrator', 'Administrator sistem cu toate permisiunile');
