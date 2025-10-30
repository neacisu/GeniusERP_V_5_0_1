-- Migration: Create configurations table
-- Description: Creates the configurations table with support for multiple scopes (global, company, user, module)
-- This table provides flexible configuration management with hierarchical scoping

-- Create configurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    value JSON NOT NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'global', -- 'global', 'company', 'user', 'module'
    company_id VARCHAR(36),
    user_id VARCHAR(36),
    module_id VARCHAR(100),
    description VARCHAR(500),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by VARCHAR(36),
    updated_by VARCHAR(36)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS configurations_key_idx ON configurations(key);
CREATE INDEX IF NOT EXISTS configurations_scope_idx ON configurations(scope);
CREATE INDEX IF NOT EXISTS configurations_company_id_idx ON configurations(company_id);
CREATE INDEX IF NOT EXISTS configurations_user_id_idx ON configurations(user_id);
CREATE INDEX IF NOT EXISTS configurations_module_id_idx ON configurations(module_id);

-- Create unique constraint to prevent duplicate configs for same scope
CREATE UNIQUE INDEX IF NOT EXISTS configurations_unique_global_idx 
    ON configurations(key, scope) 
    WHERE scope = 'global' AND company_id IS NULL AND user_id IS NULL AND module_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS configurations_unique_company_idx 
    ON configurations(key, scope, company_id) 
    WHERE scope = 'company' AND user_id IS NULL AND module_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS configurations_unique_user_idx 
    ON configurations(key, scope, company_id, user_id) 
    WHERE scope = 'user' AND module_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS configurations_unique_module_idx 
    ON configurations(key, scope, module_id) 
    WHERE scope = 'module' AND company_id IS NULL AND user_id IS NULL;

-- Add comment
COMMENT ON TABLE configurations IS 'System configurations with hierarchical scoping support (global, company, user, module)';

-- Optional: Migrate existing data from system_configs if needed
-- You can uncomment this if you want to migrate existing configurations
-- INSERT INTO configurations (id, key, value, scope, company_id, module_id, description, is_encrypted, created_at, updated_at, created_by, updated_by)
-- SELECT 
--     id,
--     key,
--     value,
--     CASE 
--         WHEN company_id IS NOT NULL THEN 'company'
--         WHEN module IS NOT NULL THEN 'module'
--         ELSE 'global'
--     END as scope,
--     company_id,
--     NULL as user_id,
--     module as module_id,
--     description,
--     is_encrypted,
--     created_at,
--     updated_at,
--     created_by,
--     updated_by
-- FROM system_configs
-- WHERE NOT EXISTS (
--     SELECT 1 FROM configurations c 
--     WHERE c.key = system_configs.key 
--     AND c.scope = CASE 
--         WHEN system_configs.company_id IS NOT NULL THEN 'company'
--         WHEN system_configs.module IS NOT NULL THEN 'module'
--         ELSE 'global'
--     END
-- );

