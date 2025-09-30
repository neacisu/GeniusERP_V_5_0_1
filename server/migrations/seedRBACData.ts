import { seedDefaultCompany } from './seedDefaultCompany';
import { seedDefaultAdmin } from './seedDefaultAdmin';

/**
 * Seed all necessary data for the RBAC system
 */
async function seedRBACData() {
  try {
    console.log('=== Seeding RBAC Data ===');
    
    // First seed the company (which triggers role creation)
    await seedDefaultCompany();
    
    // Then seed the admin user (and assign admin role)
    await seedDefaultAdmin();
    
    console.log('=== RBAC Data Seeding Complete ===');
  } catch (error) {
    console.error('Failed to seed RBAC data:', error);
    throw error;
  }
}

// Run the seeder if this is the main module
// Using import.meta.url check for ES modules
if (import.meta.url === import.meta.resolve('./seedRBACData.ts')) {
  seedRBACData()
    .then(() => {
      console.log('RBAC data seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed RBAC data:', error);
      process.exit(1);
    });
}

export { seedRBACData };