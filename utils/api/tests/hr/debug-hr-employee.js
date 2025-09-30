/**
 * Enhanced Debug Script for HR Employee Creation
 * This script directly investigates CNP field persistence issues
 */
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const API_URL = 'http://localhost:5000/api/hr/employee';
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // Same as the environment variable
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Direct database connection for inspection 
 */
const sql = postgres(DATABASE_URL, {
  onnotice: () => {}, // Suppress notices
  debug: false
});

/**
 * Generate JWT token for testing
 */
function generateToken() {
  // Create payload with required fields for JWT authentication
  const payload = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin', 
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin', 'user'],
    companyId: '550e8400-e29b-41d4-a716-446655440001',
    permissions: ['hr:read', 'hr:write', 'employee:create', 'employee:read']
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Inspect the database table structure
 */
async function inspectTableStructure() {
  console.log('\n=== INSPECTING DATABASE TABLE STRUCTURE ===\n');
  
  try {
    // Get table columns info
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'hr_employees' 
      ORDER BY ordinal_position;
    `;
    
    console.log('HR_EMPLOYEES TABLE STRUCTURE:');
    console.table(tableInfo);
    
    // Check constraints on the table
    const constraints = await sql`
      SELECT c.conname as constraint_name, c.contype as constraint_type,
             pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'hr_employees'
      ORDER BY c.contype;
    `;
    
    console.log('\nCONSTRAINTS ON HR_EMPLOYEES:');
    console.table(constraints);
    
    // Look for recent failed inserts
    const recentLogs = await sql`
      SELECT query, context, message, error_detail
      FROM postgres_log
      WHERE relation = 'hr_employees'
      AND error_message LIKE '%null value in column "cnp"%'
      ORDER BY log_time DESC
      LIMIT 5;
    `;
    
    if (recentLogs.length > 0) {
      console.log('\nRECENT ERROR LOGS FOR FAILED INSERTS:');
      console.table(recentLogs);
    } else {
      console.log('\nNo recent error logs found in postgres_log');
    }
  } catch (error) {
    console.error('Error inspecting database structure:', error);
  }
}

/**
 * Attempt direct database insert with CNP value
 */
async function testDirectDbInsert() {
  console.log('\n=== TESTING DIRECT DATABASE INSERT ===\n');
  
  try {
    // First try a direct insert with all fields explicitly specified
    const testCnp = '1900101123456';
    console.log('About to insert CNP:', testCnp);
    console.log('CNP type:', typeof testCnp);
    console.log('CNP length:', testCnp.length);
    
    // Use prepared statement style to avoid any potential SQL injection/escaping issues
    const insertResult = await sql`
      INSERT INTO hr_employees (
        company_id, first_name, last_name, email, position, 
        is_active, status, nationality, cnp, created_at, updated_at
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440001', 'Direct', 'Insert', 'direct.insert@example.com', 'Tester',
        true, 'active', 'Romanian', ${testCnp}, now(), now()
      ) RETURNING id, cnp;
    `;
    
    console.log('Direct DB insert successful! Result:');
    console.log(JSON.stringify(insertResult, null, 2));
    
    // Check if the CNP was saved correctly
    const verifyInsert = await sql`
      SELECT id, first_name, last_name, cnp, created_at 
      FROM hr_employees 
      WHERE id = ${insertResult[0].id};
    `;
    
    console.log('Verification of inserted record:');
    console.log(JSON.stringify(verifyInsert, null, 2));
    
    return insertResult[0].id;
  } catch (error) {
    console.error('Error in direct database insert:');
    console.error('Error message:', error.message);
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
    return null;
  }
}

/**
 * Test employee creation with API call
 */
async function testEmployeeData(payload, testName) {
  try {
    console.log(`\n=== RUNNING ${testName} ===\n`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateToken()}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    // If successful, verify the record with direct DB query
    if (response.ok && responseData.data && responseData.data.id) {
      const dbRecord = await sql`
        SELECT id, first_name, last_name, email, cnp
        FROM hr_employees
        WHERE id = ${responseData.data.id};
      `;
      
      console.log('\nVerification of inserted record via API:');
      console.table(dbRecord);
    }
    
    console.log(`${testName}: ${response.ok ? 'PASSED' : 'FAILED'}`);
    return response.ok;
  } catch (error) {
    console.error(`Error in ${testName}:`, error);
    return false;
  }
}

/**
 * Debug employee creation with enhanced investigation
 */
async function debugEmployeeCreation() {
  try {
    // Start with database inspection
    await inspectTableStructure();
    
    // Test direct database insert
    const directInsertId = await testDirectDbInsert();
    
    if (directInsertId) {
      console.log('\n✅ Direct database insert SUCCEEDED - CNP constraint works when value provided directly');
    } else {
      console.log('\n❌ Direct database insert FAILED - This could indicate a deeper database issue');
    }
    
    // API Test with explicit CNP in different formats
    await testEmployeeData({
      name: 'John Doe',
      email: 'john.doe@example.com',
      position: 'Developer',
      cnp: '1900101123456', // Standard CNP format
      companyId: '550e8400-e29b-41d4-a716-446655440001'
    }, "Test 1: Standard payload with CNP");
    
    // Test with CNP in a different field
    await testEmployeeData({
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      position: 'Manager',
      cnp: '2900101123456', // Female CNP format
      CNP: '2900101123456', // Uppercase CNP field - might be a case sensitivity issue
      personal_id: '2900101123456', // Alternative field name
      companyId: '550e8400-e29b-41d4-a716-446655440001'
    }, "Test 2: Multiple CNP field variations");
    
    // Test with extremely explicit CNP formatting to bypass any serialization issues
    await testEmployeeData({
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      position: 'Analyst',
      cnp: String('1900101123456').trim(), // Explicitly ensure it's a string
      companyId: '550e8400-e29b-41d4-a716-446655440001'
    }, "Test 3: With explicitly formatted CNP string");
    
  } catch (error) {
    console.error('Overall debugging error:', error);
  } finally {
    // Clean up database connection
    await sql.end();
  }
}

// Run the enhanced debug script
debugEmployeeCreation();