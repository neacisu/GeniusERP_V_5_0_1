/**
 * Seed pentru useri administrativi inițiali
 * Creează:
 * 1. Admin generic (admin@geniuserp.ro / admin1234)
 * 2. SuperAdmin developer (superadmin@geniuserp.ro / %up3r@dm1n)
 */

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seed(db: any) {
  console.log('🌱 Seeding initial admin users...');
  
  // Hash parolelor
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const superAdminPassword = await bcrypt.hash('%up3r@dm1n', 10);
  
  // Verifică dacă există deja o companie
  const [existingCompany] = await db.execute(`
    SELECT id FROM companies LIMIT 1
  `);
  
  let companyId = existingCompany?.id;
  
  // Dacă nu există companie, creează una
  if (!companyId) {
    const [newCompany] = await db.execute(`
      INSERT INTO companies (id, name, email, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id
    `, [uuidv4(), 'GeniusERP Default Company', 'admin@geniuserp.ro']);
    
    companyId = newCompany.id;
    console.log('✅ Created default company:', companyId);
  }
  
  // Creează rolurile dacă nu există
  const adminRoleId = uuidv4();
  const superAdminRoleId = uuidv4();
  const userRoleId = uuidv4();
  const managerRoleId = uuidv4();
  
  await db.execute(`
    INSERT INTO roles (id, name, description, company_id, is_system, created_at, updated_at)
    VALUES 
      ($1, 'admin', 'Administrator', $5, true, NOW(), NOW()),
      ($2, 'superadmin', 'Super Administrator (Developer)', $5, true, NOW(), NOW()),
      ($3, 'user', 'User Standard', $5, true, NOW(), NOW()),
      ($4, 'manager', 'Manager', $5, true, NOW(), NOW())
    ON CONFLICT (name, company_id) DO UPDATE 
    SET description = EXCLUDED.description
    RETURNING id
  `, [adminRoleId, superAdminRoleId, userRoleId, managerRoleId, companyId]);
  
  console.log('✅ Created/updated roles');
  
  // Obține ID-urile rolurilor (în caz că existau deja)
  const [adminRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'admin' AND company_id = $1
  `, [companyId]);
  
  const [superAdminRole] = await db.execute(`
    SELECT id FROM roles WHERE name = 'superadmin' AND company_id = $1
  `, [companyId]);
  
  // Creează user admin generic
  const adminUserId = uuidv4();
  await db.execute(`
    INSERT INTO users (id, email, password, first_name, last_name, role, company_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE 
    SET password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING id
  `, [adminUserId, 'admin@geniuserp.ro', adminPassword, 'Admin', 'Generic', 'admin', companyId]);
  
  console.log('✅ Created admin user: admin@geniuserp.ro / admin1234');
  
  // Creează user SuperAdmin developer
  const superAdminUserId = uuidv4();
  await db.execute(`
    INSERT INTO users (id, email, password, first_name, last_name, role, company_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE 
    SET password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW()
    RETURNING id
  `, [superAdminUserId, 'superadmin@geniuserp.ro', superAdminPassword, 'SuperAdmin', 'Developer', 'admin', companyId]);
  
  console.log('✅ Created superadmin user: superadmin@geniuserp.ro / %up3r@dm1n');
  
  // Obține ID-urile userilor (în caz că existau deja)
  const [adminUser] = await db.execute(`
    SELECT id FROM users WHERE email = 'admin@geniuserp.ro'
  `);
  
  const [superAdminUser] = await db.execute(`
    SELECT id FROM users WHERE email = 'superadmin@geniuserp.ro'
  `);
  
  // Asignează rolurile userilor
  if (adminRole?.id && adminUser?.id) {
    await db.execute(`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [adminUser.id, adminRole.id]);
    
    console.log('✅ Assigned admin role to admin user');
  }
  
  if (superAdminRole?.id && superAdminUser?.id) {
    await db.execute(`
      INSERT INTO user_roles (user_id, role_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [superAdminUser.id, superAdminRole.id]);
    
    console.log('✅ Assigned superadmin role to superadmin user');
  }
  
  console.log('🎉 Initial admin users seeding completed!');
}

export default seed;

