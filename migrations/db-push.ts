/**
 * Drizzle ORM Push Script
 * 
 * This script pushes the schema changes directly to the database
 * for rapid development and testing. This approach is simpler than
 * running migrations but should not be used in production.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../libs/shared/src/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function pushSchemaChanges() {
  console.log('🔄 Pushing schema changes to database...');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  // Connect to the database
  const queryClient = postgres(databaseUrl);
  const db = drizzle(queryClient, { schema });
  
  try {
    // Push the schema changes
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'drizzle_migrations'
      );
    `);
    
    const hasMigrationsTable = result[0]?.exists;
    
    if (hasMigrationsTable) {
      console.log('📂 Using migration approach as drizzle_migrations table exists...');
      
      // Run migrations from the migrations folder
      try {
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Migrations applied successfully!');
      } catch (migrateError) {
        console.error('❌ Failed to apply migrations:', migrateError);
        throw migrateError;
      }
    } else {
      console.log('🚀 Pushing schema directly with "push" instead of migrations...');
      console.log('⚠️ This should only be used for development and testing!');
      
      // Import the necessary functions
      const { drizzle: pgDrizzle } = await import('drizzle-orm/postgres-js');
      const { migrate: pgMigrate } = await import('drizzle-orm/postgres-js/migrator');
      
      try {
        await pgMigrate(db, { migrationsFolder: './drizzle' });
        console.log('✅ Schema pushed successfully!');
      } catch (pushError) {
        console.error('❌ Failed to push schema:', pushError);
        
        // Check if the error is due to data loss warnings
        if (pushError.message.includes('data loss')) {
          console.log('⚠️ Schema push failed due to potential data loss warnings.');
          console.log('🛠️ To force update, use "--force" flag or handle by manually dropping data.');
        }
        
        throw pushError;
      }
    }
    
    console.log('✅ Schema update completed!');
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run the schema update
pushSchemaChanges().catch((err) => {
  console.error('Failed to update schema:', err);
  process.exit(1);
});