/**
 * COR Schema Migration Script
 * 
 * This script applies the Romanian Occupation Classification schema to the database.
 * It creates tables for the five hierarchical levels of COR:
 * - Major groups (1 digit)
 * - Submajor groups (2 digits)
 * - Minor groups (3 digits)
 * - Subminor groups (4 digits)
 * - Occupations (6 digits)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import {
  corMajorGroups,
  corSubmajorGroups,
  corMinorGroups,
  corSubminorGroups,
  corOccupations
} from './server/modules/hr/schema/cor.schema';

// Load environment variables
dotenv.config();

/**
 * Push COR schema to the database
 */
async function pushCorSchema() {
  try {
    console.log('Connecting to database...');
    
    // Create a database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Create tables if they don't exist
    console.log('Creating COR tables...');
    
    // Create all tables using Drizzle
    await db.execute(`
      -- Major Groups (1 digit)
      CREATE TABLE IF NOT EXISTS cor_major_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(1) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT cor_major_group_code_unique UNIQUE(code)
      );
      
      -- Create indices for major groups
      CREATE INDEX IF NOT EXISTS cor_major_group_code_idx ON cor_major_groups(code);
      
      -- Submajor Groups (2 digits)
      CREATE TABLE IF NOT EXISTS cor_submajor_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(2) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        major_group_code VARCHAR(1) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT cor_submajor_group_code_unique UNIQUE(code)
      );
      
      -- Create indices for submajor groups
      CREATE INDEX IF NOT EXISTS cor_submajor_group_code_idx ON cor_submajor_groups(code);
      CREATE INDEX IF NOT EXISTS cor_submajor_group_major_code_idx ON cor_submajor_groups(major_group_code);
      
      -- Minor Groups (3 digits)
      CREATE TABLE IF NOT EXISTS cor_minor_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        submajor_group_code VARCHAR(2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT cor_minor_group_code_unique UNIQUE(code)
      );
      
      -- Create indices for minor groups
      CREATE INDEX IF NOT EXISTS cor_minor_group_code_idx ON cor_minor_groups(code);
      CREATE INDEX IF NOT EXISTS cor_minor_group_submajor_code_idx ON cor_minor_groups(submajor_group_code);
      
      -- Subminor Groups (4 digits)
      CREATE TABLE IF NOT EXISTS cor_subminor_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(4) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        minor_group_code VARCHAR(3) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT cor_subminor_group_code_unique UNIQUE(code)
      );
      
      -- Create indices for subminor groups
      CREATE INDEX IF NOT EXISTS cor_subminor_group_code_idx ON cor_subminor_groups(code);
      CREATE INDEX IF NOT EXISTS cor_subminor_group_minor_code_idx ON cor_subminor_groups(minor_group_code);
      
      -- Occupations (6 digits)
      CREATE TABLE IF NOT EXISTS cor_occupations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(6) NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        subminor_group_code VARCHAR(4) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT cor_occupation_code_unique UNIQUE(code)
      );
      
      -- Create indices for occupations
      CREATE INDEX IF NOT EXISTS cor_occupation_code_idx ON cor_occupations(code);
      CREATE INDEX IF NOT EXISTS cor_occupation_subminor_code_idx ON cor_occupations(subminor_group_code);
    `);
    
    console.log('COR schema migration completed successfully!');
    
    // Close the connection
    await client.end();
    
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error in COR schema migration:', error);
    process.exit(1);
  }
}

// Run the migration
pushCorSchema().catch((error) => {
  console.error('Unhandled error in migration:', error);
  process.exit(1);
});