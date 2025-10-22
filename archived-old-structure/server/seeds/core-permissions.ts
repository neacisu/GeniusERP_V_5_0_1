/**
 * Seed pentru permisiunile fundamentale ale sistemului
 * Creează permisiuni pentru toate modulele și le asignează rolurilor
 */

import { v4 as uuidv4 } from 'uuid';

export async function seed(db: any) {
  console.log('🌱 Seeding core permissions...');
  
  // Obține compania
  const [company] = await db.execute(`SELECT id FROM companies LIMIT 1`);
  const companyId = company?.id;
  
  if (!companyId) {
    console.error('❌ No company found - skipping permissions');
    return;
  }
  
  // Define permisiunile fundamentale pe module
  const corePermissions = [
    // Admin Module
    { resource: 'admin', action: 'view', description: 'View admin panel' },
    { resource: 'admin', action: 'manage', description: 'Manage admin settings' },
    
    // Users Management
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'users', action: 'manage_roles', description: 'Manage user roles' },
    
    // Roles Management
    { resource: 'roles', action: 'create', description: 'Create roles' },
    { resource: 'roles', action: 'read', description: 'View roles' },
    { resource: 'roles', action: 'update', description: 'Update roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'roles', action: 'manage_permissions', description: 'Manage role permissions' },
    
    // Permissions Management
    { resource: 'permissions', action: 'create', description: 'Create permissions' },
    { resource: 'permissions', action: 'read', description: 'View permissions' },
    { resource: 'permissions', action: 'update', description: 'Update permissions' },
    { resource: 'permissions', action: 'delete', description: 'Delete permissions' },
    
    // Companies Management
    { resource: 'companies', action: 'create', description: 'Create companies' },
    { resource: 'companies', action: 'read', description: 'View companies' },
    { resource: 'companies', action: 'update', description: 'Update companies' },
    { resource: 'companies', action: 'delete', description: 'Delete companies' },
    
    // Accounting Module
    { resource: 'accounting', action: 'view', description: 'View accounting' },
    { resource: 'accounting', action: 'create', description: 'Create accounting entries' },
    { resource: 'accounting', action: 'update', description: 'Update accounting entries' },
    { resource: 'accounting', action: 'delete', description: 'Delete accounting entries' },
    { resource: 'accounting', action: 'approve', description: 'Approve accounting entries' },
    
    // CRM Module
    { resource: 'crm', action: 'view', description: 'View CRM' },
    { resource: 'crm', action: 'create', description: 'Create CRM entries' },
    { resource: 'crm', action: 'update', description: 'Update CRM entries' },
    { resource: 'crm', action: 'delete', description: 'Delete CRM entries' },
    
    // HR Module
    { resource: 'hr', action: 'view', description: 'View HR' },
    { resource: 'hr', action: 'create', description: 'Create HR entries' },
    { resource: 'hr', action: 'update', description: 'Update HR entries' },
    { resource: 'hr', action: 'delete', description: 'Delete HR entries' },
    
    // Inventory Module
    { resource: 'inventory', action: 'view', description: 'View inventory' },
    { resource: 'inventory', action: 'create', description: 'Create inventory entries' },
    { resource: 'inventory', action: 'update', description: 'Update inventory entries' },
    { resource: 'inventory', action: 'delete', description: 'Delete inventory entries' },
    
    // Documents Module
    { resource: 'documents', action: 'view', description: 'View documents' },
    { resource: 'documents', action: 'create', description: 'Create documents' },
    { resource: 'documents', action: 'update', description: 'Update documents' },
    { resource: 'documents', action: 'delete', description: 'Delete documents' },
    { resource: 'documents', action: 'sign', description: 'Sign documents' },
    
    // Analytics Module
    { resource: 'analytics', action: 'view', description: 'View analytics' },
    { resource: 'analytics', action: 'export', description: 'Export analytics' },
    
    // Settings
    { resource: 'settings', action: 'view', description: 'View settings' },
    { resource: 'settings', action: 'update', description: 'Update settings' },
    
    // License Management
    { resource: 'license', action: 'view', description: 'View license' },
    { resource: 'license', action: 'manage', description: 'Manage license' },
    
    // API Keys
    { resource: 'api_keys', action: 'view', description: 'View API keys' },
    { resource: 'api_keys', action: 'create', description: 'Create API keys' },
    { resource: 'api_keys', action: 'delete', description: 'Delete API keys' },
  ];
  
  console.log(`Creating ${corePermissions.length} permissions...`);
  
  // Inserează permisiunile
  const permissionIds: Record<string, string> = {};
  
  for (const perm of corePermissions) {
    const permId = uuidv4();
    const key = `${perm.resource}:${perm.action}`;
    
    await db.execute(`
      INSERT INTO permissions (id, resource, action, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (resource, action) DO UPDATE 
      SET description = EXCLUDED.description
      RETURNING id
    `, [permId, perm.resource, perm.action, perm.description]);
    
    // Obține ID-ul permisiunii (în caz că exista deja)
    const [existingPerm] = await db.execute(`
      SELECT id FROM permissions WHERE resource = $1 AND action = $2
    `, [perm.resource, perm.action]);
    
    permissionIds[key] = existingPerm?.id || permId;
  }
  
  console.log('✅ Created/updated core permissions');
  
  // Obține rolurile
  const [adminRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'admin' AND company_id = $1
  `, [companyId]);
  
  const [superAdminRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'superadmin' AND company_id = $1
  `, [companyId]);
  
  const [managerRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'manager' AND company_id = $1
  `, [companyId]);
  
  const [userRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'user' AND company_id = $1
  `, [companyId]);
  
  // Asignează TOATE permisiunile rolului SuperAdmin
  if (superAdminRole?.id) {
    for (const permId of Object.values(permissionIds)) {
      await db.execute(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [superAdminRole.id, permId]);
    }
    console.log('✅ Assigned all permissions to SuperAdmin role');
  }
  
  // Asignează permisiuni pentru rolul Admin (mai restrictiv decât SuperAdmin)
  if (adminRole?.id) {
    const adminPermKeys = [
      'admin:view',
      'users:read', 'users:create', 'users:update', 'users:manage_roles',
      'roles:read', 'roles:create', 'roles:update',
      'permissions:read',
      'companies:read', 'companies:update',
      'accounting:view', 'accounting:create', 'accounting:update',
      'crm:view', 'crm:create', 'crm:update',
      'hr:view', 'hr:create', 'hr:update',
      'inventory:view', 'inventory:create', 'inventory:update',
      'documents:view', 'documents:create', 'documents:update',
      'analytics:view',
      'settings:view', 'settings:update'
    ];
    
    for (const key of adminPermKeys) {
      const permId = permissionIds[key];
      if (permId) {
        await db.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [adminRole.id, permId]);
      }
    }
    console.log('✅ Assigned permissions to Admin role');
  }
  
  // Asignează permisiuni pentru rolul Manager
  if (managerRole?.id) {
    const managerPermKeys = [
      'users:read',
      'roles:read',
      'companies:read',
      'accounting:view', 'accounting:create', 'accounting:update',
      'crm:view', 'crm:create', 'crm:update',
      'hr:view', 'hr:create', 'hr:update',
      'inventory:view', 'inventory:create', 'inventory:update',
      'documents:view', 'documents:create',
      'analytics:view'
    ];
    
    for (const key of managerPermKeys) {
      const permId = permissionIds[key];
      if (permId) {
        await db.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [managerRole.id, permId]);
      }
    }
    console.log('✅ Assigned permissions to Manager role');
  }
  
  // Asignează permisiuni pentru rolul User (cele mai restrictive)
  if (userRole?.id) {
    const userPermKeys = [
      'accounting:view',
      'crm:view',
      'hr:view',
      'inventory:view',
      'documents:view'
    ];
    
    for (const key of userPermKeys) {
      const permId = permissionIds[key];
      if (permId) {
        await db.execute(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [userRole.id, permId]);
      }
    }
    console.log('✅ Assigned permissions to User role');
  }
  
  console.log('🎉 Core permissions seeding completed!');
}

export default seed;

