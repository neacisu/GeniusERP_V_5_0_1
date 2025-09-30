/**
 * Migration to update warehouse_id values in inventory_assessments
 * to valid values from warehouses table to support the transition from
 * inventory_warehouses to warehouses table.
 */

import pg from 'pg';
import * as dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function updateWarehouseIds() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  console.log('Connecting to the database...');

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Get all inventory assessments
    const assessmentsResult = await pool.query(
      'SELECT id, warehouse_id FROM inventory_assessments'
    );
    
    console.log(`Found ${assessmentsResult.rowCount} inventory assessments to update`);

    // Get valid warehouse IDs from warehouses table
    const warehousesResult = await pool.query(
      'SELECT id FROM warehouses WHERE company_id IS NOT NULL LIMIT 5'
    );

    if (warehousesResult.rowCount === 0) {
      throw new Error('No valid warehouses found in warehouses table');
    }

    // Use the first valid warehouse ID as a fallback
    const defaultWarehouseId = warehousesResult.rows[0].id;
    console.log(`Using default warehouse ID: ${defaultWarehouseId}`);

    // Update all inventory assessments with the valid warehouse ID
    const updateResult = await pool.query(
      'UPDATE inventory_assessments SET warehouse_id = $1',
      [defaultWarehouseId]
    );

    console.log(`Updated ${updateResult.rowCount} inventory assessments`);

    // Add the foreign key constraint
    await pool.query(`
      ALTER TABLE inventory_assessments
      ADD CONSTRAINT fk_warehouse
      FOREIGN KEY (warehouse_id)
      REFERENCES warehouses(id)
    `);

    console.log('Added foreign key constraint successfully');

    // Commit the transaction
    await pool.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback in case of an error
    await pool.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
updateWarehouseIds()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });