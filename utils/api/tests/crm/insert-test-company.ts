/**
 * Insert Test Company Script
 * 
 * This script inserts a test company and admin user into the database
 * based on the actual table structure in the database.
 */

import * as dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Sample data
const testCompanyId = 'c23e4567-e89b-12d3-a456-426614174000';
const testUserId = '123e4567-e89b-12d3-a456-426614174000';

// Pre-hashed password for 'password123'
const passwordHash = '$2b$10$dFJwXaAHr5e2hh8VY9xwWeLEDDnGmK5NwU4GntCLzXjBaezHFAC1i';

async function insertTestData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting test data insertion...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if company already exists
    const companyCheck = await client.query(`
      SELECT id FROM companies WHERE id = $1
    `, [testCompanyId]);
    
    if (companyCheck.rows.length > 0) {
      console.log(`Company with ID ${testCompanyId} already exists.`);
    } else {
      // Insert company based on actual table structure
      await client.query(`
        INSERT INTO companies (
          id, name, fiscal_code, registration_number, address, city, 
          county, country, phone, email, bank_account, bank_name, 
          vat_payer, vat_rate, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
        )
      `, [
        testCompanyId,
        'Test Company SRL',
        'RO98765432',
        'J40/9876/2020',
        'Strada Exemplu 123',
        'București',
        'Sector 1',
        'Romania',
        '+40721123456',
        'contact@testcompany.ro',
        'RO12BTRL12345678901234567',
        'Banca Transilvania',
        true,
        19
      ]);
      console.log(`Company with ID ${testCompanyId} created.`);
    }
    
    // Check if user already exists
    const userCheck = await client.query(`
      SELECT id FROM users WHERE id = $1
    `, [testUserId]);
    
    if (userCheck.rows.length > 0) {
      console.log(`User with ID ${testUserId} already exists.`);
    } else {
      // Insert user based on actual table structure
      await client.query(`
        INSERT INTO users (
          id, username, password, email, first_name, last_name, 
          role, company_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `, [
        testUserId,
        'admin_test',
        passwordHash,
        'admin_test@testcompany.ro',
        'Admin',
        'User',
        'admin',
        testCompanyId
      ]);
      console.log(`User with ID ${testUserId} created.`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Test data inserted successfully');
    
  } catch (error) {
    // Rollback transaction
    await client.query('ROLLBACK');
    console.error('Error inserting test data:', error);
  } finally {
    // Release client
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the insertion
insertTestData().catch(console.error);