/**
 * Direct Database Test Script for HR Employee Creation
 * This approach avoids the API layer to directly test SQL functionality
 */

import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';

// Database connection
const sql = postgres(process.env.DATABASE_URL);

/**
 * Create an employee directly in the database
 */
async function createEmployeeDirectly() {
  console.log('\n=== CREATING EMPLOYEE DIRECTLY IN DATABASE ===');
  
  try {
    // Generate unique values
    const id = uuidv4();
    const firstName = 'Direct';
    const lastName = `Test-${Date.now()}`;
    const email = `direct.test.${Date.now()}@example.com`;
    const position = 'Database Tester';
    const companyId = '550e8400-e29b-41d4-a716-446655440001'; // Valid company ID
    const cnp = '1900101000000'; // Valid CNP
    const now = new Date();
    
    console.log('Attempting direct employee creation with:');
    console.log(`- Name: ${firstName} ${lastName}`);
    console.log(`- Email: ${email}`);
    console.log(`- CNP: ${cnp}`);
    
    // Execute the direct insert
    const result = await sql`
      INSERT INTO hr_employees (
        id,
        company_id, 
        first_name, 
        last_name, 
        email, 
        position, 
        cnp, 
        is_active,
        status, 
        nationality, 
        created_at, 
        updated_at
      ) 
      VALUES (
        ${id},
        ${companyId}, 
        ${firstName}, 
        ${lastName}, 
        ${email}, 
        ${position}, 
        ${cnp}, 
        ${true}, 
        ${'active'}, 
        ${'Romanian'}, 
        ${now}, 
        ${now}
      )
      RETURNING *
    `;
    
    console.log('\n=== RESULTS ===');
    console.log(`Success: ${result && result.length > 0 ? 'Yes' : 'No'}`);
    console.log(`Records returned: ${result ? result.length : 0}`);
    
    if (result && result.length > 0) {
      const employee = result[0];
      console.log('\n=== CREATED EMPLOYEE ===');
      console.log(`ID: ${employee.id}`);
      console.log(`Name: ${employee.first_name} ${employee.last_name}`);
      console.log(`Email: ${employee.email}`);
      console.log(`CNP (from DB): ${employee.cnp}`);
      
      // Verify by querying the employee
      console.log('\n=== VERIFYING EMPLOYEE ===');
      const verification = await sql`
        SELECT * FROM hr_employees WHERE id = ${id}
      `;
      
      if (verification && verification.length > 0) {
        console.log('✅ Verification successful - Employee exists in database');
        console.log(`Verified CNP: ${verification[0].cnp}`);
      } else {
        console.log('❌ Verification failed - Employee not found in database');
      }
    } else {
      console.log('❌ No result returned or insert failed');
    }
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error creating employee directly:', error);
    
    // Detailed error information
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
    if (error.schema_name) {
      console.error('Schema:', error.schema_name);
      console.error('Table:', error.table_name);
      console.error('Column:', error.column_name);
    }
  } finally {
    // Close the database connection
    await sql.end({ timeout: 5 });
    console.log('\nDatabase connection closed');
  }
}

/**
 * Run the test
 */
async function runTest() {
  console.log('=== STARTING DIRECT DATABASE EMPLOYEE CREATION TEST ===');
  await createEmployeeDirectly();
  console.log('\n=== TEST COMPLETED ===');
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
});