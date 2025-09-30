/**
 * Migration to add 'name' column to inventory_assessments table
 * 
 * This script adds the 'name' column to the inventory_assessments table
 * to match the schema definition in the codebase.
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

/**
 * Add the 'name' column to the inventory_assessments table
 */
async function addNameColumn() {
  try {
    console.log('Adding name column to inventory_assessments table...');
    
    // Check if the column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_assessments' AND column_name = 'name'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('Column name already exists in inventory_assessments table. Skipping.');
      return;
    }
    
    // Add the column to the table
    await db.execute(sql`
      ALTER TABLE inventory_assessments 
      ADD COLUMN name text
    `);
    
    // Copy data from assessment_number to name
    await db.execute(sql`
      UPDATE inventory_assessments 
      SET name = assessment_number 
      WHERE name IS NULL
    `);
    
    console.log('Successfully added name column to inventory_assessments table');
  } catch (error) {
    console.error('Error adding name column to inventory_assessments table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addNameColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });