/**
 * Debug Employee Creation - Direct Database Approach
 * 
 * This script bypasses the API and attempts to create an employee directly using 
 * the same kind of query that our service is using, to understand why the CNP field 
 * is not being saved correctly.
 */
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 10
});

async function directCreateEmployee() {
  try {
    // Generate a test CNP value that would pass validation
    const cnpValue = '1900101000001';
    
    console.log('[DEBUG] Attempting direct employee insertion with CNP:', cnpValue);
    console.log('[DEBUG] CNP type:', typeof cnpValue);
    console.log('[DEBUG] CNP length:', cnpValue.length);
    
    // Generate a UUID for the employee ID
    const id = uuidv4();
    
    // Company ID for test (this should be an existing company ID in your database)
    const companyId = '550e8400-e29b-41d4-a716-446655440001';
    
    // Current date for timestamps
    const now = new Date();
    
    // Log the exact values we're about to insert
    console.log('Inserting employee with values:');
    console.log({
      id,
      companyId,
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.direct@example.com',
      position: 'Debug Tester',
      cnp: cnpValue,
      isActive: true,
      status: 'active',
      nationality: 'Romanian',
      createdAt: now,
      updatedAt: now
    });
    
    // Perform direct insert with all explicit values
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
      ) VALUES (
        ${id}, 
        ${companyId}, 
        'Test', 
        'Employee', 
        'test.direct@example.com', 
        'Debug Tester', 
        ${cnpValue}, 
        true, 
        'active', 
        'Romanian', 
        ${now}, 
        ${now}
      )
      RETURNING *
    `;
    
    console.log('Employee created successfully!');
    console.log('Result:', result);
    
    // Now try to retrieve the employee to double-check the CNP field
    const employee = await sql`
      SELECT * FROM hr_employees 
      WHERE id = ${id}
    `;
    
    console.log('Retrieved employee:');
    console.log(employee);
    console.log('CNP value in database:', employee[0].cnp);
    
    return { success: true, employee: employee[0] };
  } catch (error) {
    console.error('Error during direct employee creation:', error);
    return { success: false, error: error.message };
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Run the test
directCreateEmployee()
  .then(result => {
    console.log('Test finished with result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.error('Error details:', result.error);
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });