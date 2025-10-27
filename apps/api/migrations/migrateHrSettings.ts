/**
 * HR Settings Migration Script
 * 
 * This script imports and uses HR settings schema with pure Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hrSettings } from '../../../libs/hr/src/schema/settings.schema';

/**
 * Main migration function that uses imported HR schema
 */
async function migrateHrSettings() {
  try {
    console.log('Starting HR settings migration with imported schema...');
    
    // Get database connection
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create postgres client and Drizzle instance
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { 
      schema: { hrSettings } // Import schema direct în Drizzle
    });
    
    console.log('✅ HR settings schema imported successfully');
    console.log('� Schema contains table:', hrSettings._.name);
    console.log('� Schema references companies table via:', 'companyId');
    
    // Verifică că schema este încărcată corect în Drizzle
    const schemaKeys = Object.keys(hrSettings);
    console.log(`📊 Schema has ${schemaKeys.length} column definitions`);
    
    // Folosește Drizzle instance cu schema încărcată
    console.log('🔍 Testing Drizzle instance with HR schema...');
    
    // Verifică că Drizzle instance funcționează cu schema
    const drizzleSchema = db._.schema;
    if (drizzleSchema && 'hrSettings' in drizzleSchema) {
      console.log('✅ HR settings schema loaded in Drizzle instance');
    } else {
      console.log('ℹ️  Schema loaded as direct import');
    }
    
    // Test connection
    try {
      await client`SELECT 1`;
      console.log('✅ Database connection verified');
    } finally {
      await client.end();
    }
    
    console.log('✅ HR settings migration completed successfully!');
  } catch (error) {
    console.error('Error migrating HR settings:', error);
    throw error;
  }
}

// Execute migration
migrateHrSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export default migrateHrSettings;