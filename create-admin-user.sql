-- CREATE ADMIN USER
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
    
    -- Generate a simple hash for password 'admin' (TEMPORARY)
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
    ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        updated_at = NOW()
    RETURNING id INTO v_admin_user_id;
    
    IF v_admin_user_id IS NULL THEN
        SELECT id INTO v_admin_user_id FROM users WHERE username = 'admin' LIMIT 1;
    END IF;
    
    -- Assign admin role to user
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_admin_user_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin user ID: %', v_admin_user_id;
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Email: admin@geniuserp.com';
    RAISE NOTICE 'TEMPORARY PASSWORD: admin (CHANGE IN PRODUCTION!)';
END $$;

-- Verificare
SELECT '✅ Users:', COUNT(*) FROM users;
SELECT '✅ User Roles:', COUNT(*) FROM user_roles;
SELECT username, email, first_name, last_name, role FROM users WHERE username = 'admin';

