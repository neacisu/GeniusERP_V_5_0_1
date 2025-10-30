/**
 * Insert Sample Company Script
 * 
 * This script inserts a sample company into the database for testing.
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
const pool = new Pool({ connectionString });

// Sample company data
const sampleCompanyId = 'c23e4567-e89b-12d3-a456-426614174000';
const sampleUserId = '123e4567-e89b-12d3-a456-426614174000';

async function insertSampleCompany() {
  const client = await pool.connect();
  
  try {
    console.log('Inserting sample company...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if companies table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Companies table does not exist, creating...');
      await createCompanyTable(client);
    }
    
    // Check if users table exists
    const userTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!userTableCheck.rows[0].exists) {
      console.log('Users table does not exist, creating...');
      await createUserTable(client);
    }
    
    // Check if company already exists
    const companyCheck = await client.query(`
      SELECT id FROM companies WHERE id = '${sampleCompanyId}'
    `);
    
    if (companyCheck.rows.length > 0) {
      console.log(`Company with ID ${sampleCompanyId} already exists.`);
    } else {
      // Insert company
      await client.query(`
        INSERT INTO companies (
          id, name, vat_number, registration_number, address, city, 
          country, postal_code, phone, email, website, status, created_at, updated_at
        ) VALUES (
          '${sampleCompanyId}',
          'Test Company Ltd',
          'RO12345678',
          'J12/123/2020',
          '123 Test Street',
          'Bucharest',
          'Romania',
          '010101',
          '+40721123456',
          'contact@testcompany.com',
          'https://testcompany.com',
          'active',
          NOW(),
          NOW()
        )
      `);
      console.log(`Company with ID ${sampleCompanyId} created.`);
    }
    
    // Check if user already exists
    const userCheck = await client.query(`
      SELECT id FROM users WHERE id = '${sampleUserId}'
    `);
    
    if (userCheck.rows.length > 0) {
      console.log(`User with ID ${sampleUserId} already exists.`);
    } else {
      // Insert user
      await client.query(`
        INSERT INTO users (
          id, username, email, password_hash, first_name, last_name, role, 
          roles, company_id, status, created_at, updated_at
        ) VALUES (
          '${sampleUserId}',
          'tester',
          'test@example.com',
          '$2b$10$dFJwXaAHr5e2hh8VY9xwWeLEDDnGmK5NwU4GntCLzXjBaezHFAC1i',
          'Test',
          'User',
          'admin',
          ARRAY['admin', 'bpm_manager'],
          '${sampleCompanyId}',
          'active',
          NOW(),
          NOW()
        )
      `);
      console.log(`User with ID ${sampleUserId} created.`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Sample data inserted successfully');
    
  } catch (error) {
    // Rollback transaction
    await client.query('ROLLBACK');
    console.error('Error inserting sample data:', error);
  } finally {
    // Release client
    client.release();
    // Close the pool
    await pool.end();
  }
}

async function createCompanyTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        vat_number VARCHAR(50),
        registration_number VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Companies table created successfully');
  } catch (error) {
    console.error('Error creating companies table:', error);
    throw error;
  }
}

async function createUserTable(client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL,
        roles TEXT[],
        company_id UUID REFERENCES companies(id),
        franchise_id UUID,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created successfully');
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  }
}

// Run the insertion
insertSampleCompany();