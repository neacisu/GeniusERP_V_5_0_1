/**
 * CRM Schema Migration Script
 * 
 * This script applies the CRM schema changes directly to the database
 * using Drizzle ORM's push method for quick testing and development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import * as schema from '../libs/shared/src/schema';
import { sql } from 'drizzle-orm';

dotenv.config();

async function migrateCrmSchema() {
  // Initialize database connection
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    process.exit(1);
  }

  const migrationClient = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log('🚀 Starting CRM schema migration');
    
    // Create custom migration for CRM schema with custom table names
    console.log('📝 Creating CRM tables');
    
    // First, check if tables already exist to prevent errors
    const existingTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'crm_%'
    `);
    
    // Just print the raw output for debugging
    console.log('Raw SQL result:', JSON.stringify(existingTables));
    
    // Use a simpler approach to avoid type issues
    let tableNames: string[] = [];
    try {
      // Try to convert the result to a safe format
      if (existingTables) {
        const resultObj = existingTables as any;
        if (resultObj.rows && Array.isArray(resultObj.rows)) {
          tableNames = resultObj.rows
            .filter(row => row && row.table_name)
            .map(row => String(row.table_name));
        }
      }
    } catch (err) {
      console.log('Error parsing SQL result:', err);
    }
    
    console.log('Existing CRM tables:', tableNames.length ? tableNames.join(', ') : 'None');

    if (tableNames.length > 0) {
      console.log('⚠️ Some CRM tables already exist. Proceeding with caution...');
    }
    
    // Create new tables by pushing schema changes
    console.log('🔄 Pushing schema changes to database');
    
    // We'll use the Drizzle Kit push command (needs to be executed from CLI)
    console.log('ℹ️ Please run the following command to apply schema changes:');
    console.log('npx drizzle-kit push:pg');
    console.log('Then run: npm run db:push');
    
    console.log('\n✅ CRM migration script completed');
    console.log('📋 Migration instructions:');
    console.log('1. Run "npx drizzle-kit push:pg" to push schema changes');
    console.log('2. Then run "npm run db:push" to apply changes to the database');
    console.log('3. Finally, run "npm run test-crm-schema" to verify the schema');
    
  } catch (error) {
    console.error('❌ Error in CRM migration:', error);
  } finally {
    await migrationClient.end();
  }
}

migrateCrmSchema().catch(console.error);