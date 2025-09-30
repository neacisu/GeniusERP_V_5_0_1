// Direct CNP test using SQL
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the database directly
const sql = postgres(process.env.DATABASE_URL);

// Create a test employee with a CNP value directly via SQL
async function testDirectCnpInsert() {
  console.log("=== TESTING DIRECT SQL INSERT WITH CNP VALUE ===");
  
  try {
    const employeeId = uuidv4();
    const companyId = '550e8400-e29b-41d4-a716-446655440001';
    const firstName = 'Direct';
    const lastName = 'SQL Test';
    const email = 'direct.sql@example.com';
    const position = 'Tester';
    const cnp = '1900101123456'; // Valid CNP format
    
    console.log('Inserting employee with CNP:', cnp);
    console.log('SQL Parameters:');
    console.log('- employeeId:', employeeId);
    console.log('- companyId:', companyId);
    console.log('- firstName:', firstName);
    console.log('- lastName:', lastName);
    console.log('- email:', email);
    console.log('- position:', position);
    
    // Execute a direct SQL insert with the CNP value explicitly included
    const result = await sql`
      INSERT INTO hr_employees (
        id, company_id, first_name, last_name, email, position,
        is_active, status, nationality, cnp, created_at, updated_at
      ) VALUES (
        ${employeeId}, ${companyId}, ${firstName}, ${lastName}, ${email}, ${position},
        true, 'active', 'Romanian', ${cnp}, now(), now()
      ) RETURNING *
    `;
    
    console.log('[SUCCESS] Direct SQL insert successful:');
    console.log(result[0]);
    
    return result[0];
  } catch (error) {
    console.error('[ERROR] Direct SQL insert failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Try debugging with direct SQL table inspection
async function inspectHrEmployeesTable() {
  try {
    console.log("=== INSPECTING HR_EMPLOYEES TABLE STRUCTURE ===");
    
    // Check table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'hr_employees'
      ORDER BY ordinal_position;
    `;
    
    console.log('Table structure:');
    tableInfo.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    return tableInfo;
  } catch (error) {
    console.error('[ERROR] Failed to inspect table structure:', error);
  }
}

// Run the tests
async function runTests() {
  try {
    await inspectHrEmployeesTable();
    await testDirectCnpInsert();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

runTests();