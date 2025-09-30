/**
 * Direct SQL Insertion Test for Employee
 * 
 * This script attempts to insert an employee record directly using the 
 * postgres module, avoiding any ORM issues.
 */
import pg from 'postgres';
import { v4 as uuidv4 } from 'uuid';

// Extract the DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

console.log('Using database URL:', DATABASE_URL);

/**
 * Test direct insertion of an employee record
 */
async function testDirectEmployeeInsertion() {
  try {
    // Create postgres client
    const sql = pg(DATABASE_URL);
    console.log('Database connection established.');
    
    // Data for insertion
    const id = uuidv4();
    const companyId = '550e8400-e29b-41d4-a716-446655440001'; // Valid company ID
    const firstName = 'John';
    const lastName = 'Doe';
    const email = 'john.doe@example.com';
    const position = 'Software Developer';
    const cnp = '1900101000000'; // Test CNP
    
    console.log('Attempting employee insertion with values:');
    console.log({ id, companyId, firstName, lastName, email, position, cnp });
    
    // Execute direct SQL INSERT
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
        ${new Date()}, 
        ${new Date()}
      )
      RETURNING id, first_name, last_name, email, cnp
    `;
    
    console.log('Insertion successful!');
    console.log('Result:', result);
    
    // Close the database connection
    await sql.end({ timeout: 5 });
    console.log('Database connection closed successfully.');
    
  } catch (error) {
    console.error('Error during direct employee insertion:', error);
    
    // Print more detailed error information
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    
    // Check for specific error codes
    if (error.code) {
      console.error('Error code:', error.code);
      
      if (error.code === '23502') {
        console.error('This is a NOT NULL constraint violation. A required field is null.');
      } else if (error.code === '23503') {
        console.error('This is a foreign key constraint violation. Referenced key not found.');
      }
    }
  }
}

// Run the test
testDirectEmployeeInsertion();