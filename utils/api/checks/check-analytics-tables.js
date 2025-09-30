/**
 * Check Analytics Tables Script
 * 
 * This script checks if the required analytics tables exist in the database.
 * It uses the DATABASE_URL environment variable to connect to the database.
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkAnalyticsTables() {
  const { Pool } = pg;
  
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    return false;
  }
  
  console.log('✅ DATABASE_URL found in environment.');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting to the database...');
    
    // Check if analytics_reports table exists
    const reportsTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_reports'
      );
    `;
    
    // Check if report_execution_history table exists
    const executionHistoryTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'report_execution_history'
      );
    `;
    
    // Execute queries
    const reportsTableResult = await pool.query(reportsTableQuery);
    const executionHistoryTableResult = await pool.query(executionHistoryTableQuery);
    
    // Check results
    const reportsTableExists = reportsTableResult.rows[0].exists;
    const executionHistoryTableExists = executionHistoryTableResult.rows[0].exists;
    
    console.log(`analytics_reports table exists: ${reportsTableExists ? '✅ Yes' : '❌ No'}`);
    console.log(`report_execution_history table exists: ${executionHistoryTableExists ? '✅ Yes' : '❌ No'}`);
    
    // If tables don't exist, suggest running the analytics migration
    if (!reportsTableExists || !executionHistoryTableExists) {
      console.log('\n❌ One or more required tables are missing.');
      console.log('Run the following command to create the missing tables:');
      console.log('node run-analytics-migration.ts');
      return false;
    }
    
    // Check table structure for analytics_reports
    if (reportsTableExists) {
      const reportsColumnsQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'analytics_reports';
      `;
      
      const reportsColumnsResult = await pool.query(reportsColumnsQuery);
      
      console.log('\nanalytics_reports table structure:');
      reportsColumnsResult.rows.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    }
    
    // Check table structure for report_execution_history
    if (executionHistoryTableExists) {
      const historyColumnsQuery = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'report_execution_history';
      `;
      
      const historyColumnsResult = await pool.query(historyColumnsQuery);
      
      console.log('\nreport_execution_history table structure:');
      historyColumnsResult.rows.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type})`);
      });
    }
    
    return reportsTableExists && executionHistoryTableExists;
  } catch (error) {
    console.error('Error checking analytics tables:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the check
checkAnalyticsTables()
  .then(success => {
    if (success) {
      console.log('\n✅ All required analytics tables exist in the database.');
    } else {
      console.log('\n❌ Some required analytics tables are missing.');
    }
  })
  .catch(err => {
    console.error('\n❌ Error during database check:', err);
  });