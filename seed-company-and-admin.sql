-- ========================================================================
-- SEED: Company, Roles & Admin User
-- ========================================================================
--
-- Script de seed pentru datele de bază ale aplicației
-- 
-- ========================================================================

-- 1. CREATE COMPANY (dacă nu există)
-- ========================================================================
INSERT INTO companies (
    id, name, fiscal_code, registration_number, address, city, county, country,
    phone, email, vat_payer, vat_rate, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'GeniusERP Demo Company',
    'RO12345678',
    'J12/345/2023',
    'Str. Contabilității nr. 123',
    'București',
    'București',
    'Romania',
    '+40.123.456.789',
    'contact@geniuserp.com',
    true,
    19,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Verificare
SELECT 'Companies:', COUNT(*) FROM companies;

-- 2. CREATE ADMIN ROLE (și alte roluri standard)
-- ========================================================================

DO $$
DECLARE
    v_company_id uuid;
    v_admin_role_id uuid;
    v_user_role_id uuid;
    v_accountant_role_id uuid;
BEGIN
    -- Get company ID
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'No company found. Company must exist first.';
    END IF;
    
    -- Create Admin role
    INSERT INTO roles (id, name, company_id, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Admin', v_company_id, 'Full system administrator role', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_admin_role_id;
    
    IF v_admin_role_id IS NULL THEN
        SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    END IF;
    
    -- Create User role
    INSERT INTO roles (id, name, company_id, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'User', v_company_id, 'Standard user role', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_user_role_id;
    
    -- Create Accountant role
    INSERT INTO roles (id, name, company_id, description, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Accountant', v_company_id, 'Accountant role with financial permissions', NOW(), NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_accountant_role_id;
    
    RAISE NOTICE 'Admin role ID: %', v_admin_role_id;
    
    -- Associate Admin role with ALL permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, p.id
    FROM permissions p
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned all % permissions', (SELECT COUNT(*) FROM permissions);
END $$;

-- Verificare
SELECT 'Roles:', COUNT(*) FROM roles;
SELECT 'Role Permissions:', COUNT(*) FROM role_permissions;

-- 3. CREATE ADMIN USER
-- ========================================================================

DO $$
DECLARE
    v_company_id uuid;
    v_admin_role_id uuid;
    v_admin_user_id uuid;
    v_password_hash text;
    v_salt text;
BEGIN
    -- Get company and role
    SELECT id INTO v_company_id FROM companies LIMIT 1;
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin' LIMIT 1;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'No company found';
    END IF;
    
    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found';
    END IF;
    
    -- Generate a simple hash for password 'admin' (TEMPORARY - va fi resetat)
    -- În producție, va trebui schimbată parola!
    v_salt := encode(gen_random_bytes(16), 'hex');
    v_password_hash := encode(digest('admin' || v_salt, 'sha256'), 'hex') || '.' || v_salt;
    
    -- Create admin user
    INSERT INTO users (
        id, username, email, password, first_name, last_name, role, company_id,
        created_at, updated_at
    )
    VALUES (
        gen_random_uuid(),
        'admin',
        'admin@geniuserp.com',
        v_password_hash,
        'System',
        'Administrator',
        'admin',
        v_company_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (username) DO NOTHING
    RETURNING id INTO v_admin_user_id;
    
    IF v_admin_user_id IS NULL THEN
        SELECT id INTO v_admin_user_id FROM users WHERE username = 'admin' LIMIT 1;
    END IF;
    
    -- Assign admin role to user
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_admin_user_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin user created: admin@geniuserp.com';
    RAISE NOTICE 'TEMPORARY PASSWORD: admin (CHANGE THIS IN PRODUCTION!)';
END $$;

-- Verificare
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'User Roles:', COUNT(*) FROM user_roles;

-- ========================================================================
-- FINAL REPORT
-- ========================================================================
SELECT '============================================' as status;
SELECT '✅ SEED COMPLET - Date de bază create!' as status;
SELECT '============================================' as status;
SELECT 'Companies: ' || COUNT(*)::text as status FROM companies
UNION ALL
SELECT 'Roles: ' || COUNT(*)::text FROM roles
UNION ALL
SELECT 'Permissions: ' || COUNT(*)::text FROM permissions
UNION ALL
SELECT 'Role-Permissions: ' || COUNT(*)::text FROM role_permissions
UNION ALL
SELECT 'Users: ' || COUNT(*)::text FROM users
UNION ALL
SELECT 'User-Roles: ' || COUNT(*)::text FROM user_roles;
SELECT '============================================' as status;
SELECT '📧 Login: admin@geniuserp.com' as status
UNION ALL
SELECT '🔑 Password: admin (CHANGE IN PRODUCTION!)' as status;
SELECT '============================================' as status;

