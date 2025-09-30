/**
 * Verification Script for Collaboration Tables
 * 
 * This script verifies that all collaboration tables have been created correctly
 * and have the expected columns with proper types.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { Logger } from './server/common/logger';

// Initialize logger
const logger = new Logger({ name: 'verify-collaboration-tables' });

/**
 * Verify collaboration tables
 */
async function verifyCollaborationTables() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create a SQL client
  const sql = postgres(DATABASE_URL, { ssl: 'require' });
  
  try {
    logger.info('Starting verification of collaboration tables...');
    
    // Tables to verify
    const tables = [
      'collaboration_tasks',
      'collaboration_notes',
      'collaboration_threads',
      'collaboration_messages',
      'collaboration_task_assignments',
      'collaboration_task_status_history',
      'collaboration_task_watchers'
    ];
    
    // Check if each table exists
    for (const table of tables) {
      const [tableExists] = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      
      if (!tableExists.exists) {
        logger.error(`Table '${table}' does not exist!`);
      } else {
        logger.info(`Table '${table}' exists. Checking columns...`);
        
        // Get columns for the table
        const columns = await sql`
          SELECT column_name, data_type, udt_name, character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position;
        `;
        
        // Print all columns with their types
        logger.info(`Columns for '${table}':`);
        columns.forEach((col: any) => {
          let type = col.data_type;
          if (col.data_type === 'USER-DEFINED') {
            type = col.udt_name;
          } else if (col.data_type === 'character varying') {
            type = `varchar(${col.character_maximum_length})`;
          }
          logger.info(`  - ${col.column_name}: ${type}`);
        });
        
        // Verify critical columns for collaboration_tasks
        if (table === 'collaboration_tasks') {
          const requiredColumns = [
            { name: 'id', type: 'uuid' },
            { name: 'company_id', type: 'uuid' },
            { name: 'title', type: 'character varying' },
            { name: 'assigned_to', type: 'uuid' },
            { name: 'supervisor_id', type: 'uuid' },
            { name: 'status', type: 'task_status' },
            { name: 'priority', type: 'task_priority' }
          ];
          
          for (const reqCol of requiredColumns) {
            const foundCol = columns.find((col: any) => col.column_name === reqCol.name);
            
            if (!foundCol) {
              logger.error(`Required column '${reqCol.name}' not found in ${table}`);
            } else {
              let colType = foundCol.data_type;
              if (colType === 'USER-DEFINED') {
                colType = foundCol.udt_name;
              }
              
              if (reqCol.type === 'character varying' && colType === 'character varying') {
                logger.info(`✓ Column '${reqCol.name}' found with correct type '${colType}'`);
              } else if (colType !== reqCol.type) {
                logger.error(`Column '${reqCol.name}' has type '${colType}', expected '${reqCol.type}'`);
              } else {
                logger.info(`✓ Column '${reqCol.name}' found with correct type '${colType}'`);
              }
            }
          }
        }
        
        // Check foreign keys for related tables
        if (['collaboration_notes', 'collaboration_messages', 'collaboration_task_assignments', 
             'collaboration_task_status_history', 'collaboration_task_watchers'].includes(table)) {
          const foreignKeys = await sql`
            SELECT
              tc.constraint_name,
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM
              information_schema.table_constraints AS tc
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ${table};
          `;
          
          if (foreignKeys.length === 0) {
            logger.warn(`No foreign keys found for '${table}'`);
          } else {
            logger.info(`Foreign keys for '${table}':`);
            foreignKeys.forEach((fk: any) => {
              logger.info(`  - ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
            });
          }
        }
        
        // Check indexes
        const indexes = await sql`
          SELECT
            indexname,
            indexdef
          FROM
            pg_indexes
          WHERE
            tablename = ${table};
        `;
        
        if (indexes.length === 0) {
          logger.warn(`No indexes found for '${table}'`);
        } else {
          logger.info(`Indexes for '${table}':`);
          indexes.forEach((idx: any) => {
            logger.info(`  - ${idx.indexname}: ${idx.indexdef}`);
          });
        }
      }
      
      logger.info('-----------------------------------');
    }
    
    // Final verification summary
    const allTablesExist = await Promise.all(tables.map(async (table) => {
      const [exists] = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      return exists.exists;
    }));
    
    const missingTables = tables.filter((_, i) => !allTablesExist[i]);
    
    if (missingTables.length === 0) {
      logger.info('✅ All collaboration tables exist!');
    } else {
      logger.error(`❌ Missing tables: ${missingTables.join(', ')}`);
    }
    
    logger.info('Collaboration tables verification completed');
  } catch (error) {
    logger.error('Error during verification:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run verification
verifyCollaborationTables()
  .then(() => {
    logger.info('================================================');
    logger.info('COLLABORATION SCHEMA VERIFICATION SUMMARY');
    logger.info('================================================');
    logger.info('Verification completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Verification failed:', error);
    process.exit(1);
  });