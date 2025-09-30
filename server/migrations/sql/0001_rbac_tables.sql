-- Migration for adding Role-Based Access Control (RBAC) tables

-- Add company_id column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "companies"("id");
CREATE INDEX IF NOT EXISTS "users_company_idx" ON "users" ("company_id");

-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "roles_company_idx" ON "roles" ("company_id");

-- Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create user_roles junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "role_id")
);

-- Create role_permissions junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

-- Insert standard permissions
INSERT INTO "permissions" ("name", "resource", "action", "description")
VALUES 
-- User management permissions
('user.view', 'user', 'view', 'View users'),
('user.create', 'user', 'create', 'Create users'),
('user.edit', 'user', 'edit', 'Edit user information'),
('user.delete', 'user', 'delete', 'Delete users'),

-- Role management permissions
('role.view', 'role', 'view', 'View roles'),
('role.create', 'role', 'create', 'Create roles'),
('role.edit', 'role', 'edit', 'Edit roles'),
('role.delete', 'role', 'delete', 'Delete roles'),

-- Chart of accounts permissions
('chart.view', 'chart', 'view', 'View chart of accounts'),
('chart.create', 'chart', 'create', 'Create accounts'),
('chart.edit', 'chart', 'edit', 'Edit accounts'),
('chart.delete', 'chart', 'delete', 'Delete accounts'),

-- Journal permissions
('journal.view', 'journal', 'view', 'View journal entries'),
('journal.create', 'journal', 'create', 'Create journal entries'),
('journal.edit', 'journal', 'edit', 'Edit journal entries'),
('journal.delete', 'journal', 'delete', 'Delete journal entries'),

-- Inventory permissions
('inventory.view', 'inventory', 'view', 'View inventory'),
('inventory.create', 'inventory', 'create', 'Create inventory items'),
('inventory.edit', 'inventory', 'edit', 'Edit inventory items'),
('inventory.delete', 'inventory', 'delete', 'Delete inventory items'),
('inventory.movement', 'inventory', 'movement', 'Record inventory movements')
ON CONFLICT (name) DO NOTHING;

-- Create admin role
INSERT INTO "roles" ("name", "company_id", "description")
SELECT 'Admin', id, 'Full system administrator role'
FROM "companies"
LIMIT 1
ON CONFLICT DO NOTHING;

-- Associate admin role with all permissions
WITH admin_role AS (SELECT id FROM "roles" WHERE "name" = 'Admin' LIMIT 1)
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT admin_role.id, permissions.id
FROM admin_role, "permissions"
ON CONFLICT DO NOTHING;