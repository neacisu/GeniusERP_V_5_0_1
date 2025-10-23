import { DrizzleService } from '../common/drizzle';
import { companies } from '../../libs/shared/src/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed a default company in the database if none exists.
 * This will trigger the creation of the Admin role (via migration constraint).
 */
async function seedDefaultCompany() {
  try {
    const drizzleService = new DrizzleService();
    
    console.log('Checking if default company exists...');

    const existingCompanies = await drizzleService.query(async (db: any) => {
      return await db.select().from(companies);
    });
    
    if (existingCompanies.length > 0) {
      console.log('Default company already exists. Skipping seeding.');
      return;
    }
    
    console.log('No companies found. Creating default company...');

    // Create a default company
    await drizzleService.query(async (db: any) => {
      const [company] = await db.insert(companies).values({
        id: uuidv4(),
        name: 'GeniusERP Demo Company',
        fiscalCode: 'RO12345678',
        registrationNumber: 'J12/345/2023',
        address: '123 Accounting Street',
        city: 'Bucharest',
        county: 'Bucharest',
        country: 'Romania',
        phone: '+40.123.456.789',
        email: 'contact@geniuserp.com',
        vatPayer: true,
        vatRate: 19,
      }).returning();
      
      console.log('Default company created:', company.name);
      
      // The Admin role will be created automatically via the migration logic
      // after the company exists
      
      // Execute the SQL from the migration to create the Admin role
      // and assign permissions
      await db.execute(`
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
      `);
      
      console.log('Admin role created and permissions assigned');
      
      return company;
    });
    
  } catch (error) {
    console.error('Failed to seed default company:', error);
    throw error;
  }
}

// Run the seeder if this is the main module
// Using import.meta.url check for ES modules
if (import.meta.url === import.meta.resolve('./seedDefaultCompany.ts')) {
  seedDefaultCompany()
    .then(() => {
      console.log('Default company seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed default company:', error);
      process.exit(1);
    });
}

export { seedDefaultCompany };