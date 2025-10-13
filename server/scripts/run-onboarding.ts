#!/usr/bin/env ts-node
/**
 * CLI Script pentru rularea onboarding-ului GeniusERP
 * 
 * Usage:
 *   npm run onboarding
 *   npm run onboarding -- --skip-accounting
 *   npm run onboarding -- --skip-hr
 *   npm run onboarding -- --verbose
 */

import { runOnboarding } from '../seeds/onboarding';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting GeniusERP Onboarding...\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    skipAccountingSeeds: args.includes('--skip-accounting'),
    skipHRSeeds: args.includes('--skip-hr'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('GeniusERP Onboarding CLI');
    console.log('\nUsage:');
    console.log('  npm run onboarding                 Run full onboarding');
    console.log('  npm run onboarding -- --skip-accounting   Skip Chart of Accounts');
    console.log('  npm run onboarding -- --skip-hr           Skip COR seeds');
    console.log('  npm run onboarding -- --verbose           Verbose output');
    console.log('  npm run onboarding -- --help              Show this help\n');
    process.exit(0);
  }
  
  // Setup database connection
  try {
    const postgres = require('postgres');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
      console.error('Please set DATABASE_URL in your .env file\n');
      process.exit(1);
    }
    
    console.log('📡 Connecting to database...');
    const sql = postgres(databaseUrl);
    
    // Create db wrapper for execute method
    const db = {
      execute: async (query: string, params?: any[]) => {
        if (params) {
          return await sql.unsafe(query, params);
        }
        return await sql.unsafe(query);
      }
    };
    
    console.log('✅ Database connection established\n');
    
    // Run onboarding
    const result = await runOnboarding(db, options);
    
    // Close database connection
    await sql.end();
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

