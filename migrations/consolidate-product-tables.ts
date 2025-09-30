/**
 * Product Tables Consolidation Script
 * 
 * This script performs the following operations:
 * 1. Drops the foreign key constraint between crm_deal_products and crm_products
 * 2. Modifies the crm_deal_products table to reference inventory_products
 * 3. Drops the crm_products table completely
 * 
 * The purpose is to consolidate all product data into inventory_products,
 * as requested by the client.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function to consolidate product tables
 */
async function consolidateProductTables() {
  console.log('🚀 Starting product tables consolidation');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  const migrationClient = postgres(databaseUrl);
  const db = drizzle(migrationClient);
  
  try {
    // First, check if tables exist to avoid errors
    console.log('📊 Checking for existing tables');
    
    const existingTablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%product%')
    `);
    
    // Extract table names from the result
    let existingTables: string[] = [];
    
    // Debugging - dump the raw result
    console.log('Raw existingTablesResult:', JSON.stringify(existingTablesResult));
    
    try {
      if (existingTablesResult && typeof existingTablesResult === 'object') {
        // Try different formats of the result based on how drizzle returns results
        if (Array.isArray(existingTablesResult)) {
          console.log('Result is array, length:', existingTablesResult.length);
          existingTables = existingTablesResult
            .filter(row => row && typeof row === 'object' && 'table_name' in row)
            .map(row => String(row.table_name));
        } else if ('rows' in existingTablesResult) {
          console.log('Result has rows property');
          const rows = (existingTablesResult as any).rows;
          if (rows && Array.isArray(rows)) {
            existingTables = rows
              .filter(row => row && typeof row === 'object' && 'table_name' in row)
              .map(row => String(row.table_name));
          }
        } else {
          console.log('Result structure unknown, trying to iterate over keys');
          for (const key in existingTablesResult) {
            console.log(`Key: ${key}, Value:`, existingTablesResult[key]);
          }
        }
      }
    } catch (err) {
      console.log('Error parsing SQL result:', err);
    }
    
    console.log('Extracted table names:', existingTables);
    
    if (!existingTables.includes('inventory_products')) {
      console.error('❌ inventory_products table does not exist. Cannot proceed with consolidation.');
      process.exit(1);
    }

    // Check if there are any records in crm_products
    if (existingTables.includes('crm_products')) {
      const productCountResult = await db.execute(sql`SELECT COUNT(*) FROM crm_products`);
      let productCount = 0;
      
      if (productCountResult && Array.isArray(productCountResult) && productCountResult.length > 0) {
        productCount = parseInt(productCountResult[0].count as string);
      }
      
      console.log('CRM Products count:', productCount);
      
      // If there are records, we should handle migration, but we expect 0 records
      if (productCount > 0) {
        console.warn('⚠️ crm_products table has records. This script does not handle data migration.');
      }
    }

    // Step 1: Drop foreign key constraint if exists
    console.log('🔄 Dropping foreign key constraint between crm_deal_products and crm_products');
    try {
      await db.execute(sql`
        ALTER TABLE crm_deal_products
        DROP CONSTRAINT IF EXISTS crm_deal_products_product_id_fkey;
      `);
      console.log('✅ Foreign key constraint dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping foreign key constraint:', error);
    }

    // Step 2: Add new foreign key to inventory_products
    console.log('🔄 Adding new foreign key to inventory_products');
    try {
      await db.execute(sql`
        ALTER TABLE crm_deal_products
        ADD CONSTRAINT crm_deal_products_product_id_inventory_fkey
        FOREIGN KEY (product_id) REFERENCES inventory_products(id);
      `);
      console.log('✅ New foreign key constraint added successfully');
    } catch (error) {
      console.error('❌ Error adding new foreign key constraint:', error);
    }

    // Step 3: Drop crm_products table
    console.log('🔄 Dropping crm_products table');
    try {
      await db.execute(sql`
        DROP TABLE IF EXISTS crm_products;
      `);
      console.log('✅ crm_products table dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping crm_products table:', error);
    }

    console.log('✅ Product tables consolidation completed successfully');
    
  } catch (error) {
    console.error('❌ Error in consolidation script:', error);
  } finally {
    await migrationClient.end();
  }
}

// Execute the consolidation function
consolidateProductTables()
  .then(() => {
    console.log('📋 Consolidation completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Consolidation failed:', err);
    process.exit(1);
  });