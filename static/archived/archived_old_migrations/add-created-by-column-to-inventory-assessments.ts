/**
 * Migration to add 'created_by' column to inventory_assessments table
 * 
 * This script adds the 'created_by' column to the inventory_assessments table
 * to match the schema definition in the codebase.
 */

import { getDrizzleInstance } from '../server/common/drizzle/db';
import { Logger } from '../server/common/logger';
import { sql } from 'drizzle-orm';

const logger = new Logger('migration');

/**
 * Add the 'created_by' column to the inventory_assessments table
 */
async function addCreatedByColumn() {
  try {
    const db = getDrizzleInstance();
    if (!db) {
      throw new Error('Could not get database instance');
    }

    logger.info('Adding created_by column to inventory_assessments table...');
    
    // Execute the SQL to add the column
    await db.execute(sql`
      ALTER TABLE inventory_assessments 
      ADD COLUMN IF NOT EXISTS created_by UUID,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    logger.info('✓ Successfully added created_by column to inventory_assessments table');
    
    return true;
  } catch (error) {
    logger.error('Failed to add created_by column to inventory_assessments table', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addCreatedByColumn()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed', error);
      process.exit(1);
    });
}

export default addCreatedByColumn;
