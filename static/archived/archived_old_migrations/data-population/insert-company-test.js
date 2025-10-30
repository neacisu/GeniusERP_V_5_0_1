// Insert a test company and try the HR employee creation
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Connect to the database directly
const sql = postgres(process.env.DATABASE_URL);

// Create a test company first
async function createTestCompany() {
  console.log("=== CREATING TEST COMPANY ===");
  
  try {
    const companyId = '550e8400-e29b-41d4-a716-446655440001'; // Use the same ID as in the token
    
    // Check if the company already exists by ID
    const existingCompanyById = await sql`
      SELECT * FROM companies WHERE id = ${companyId}
    `;
    
    if (existingCompanyById.length > 0) {
      console.log('Company with ID already exists:', existingCompanyById[0]);
      return existingCompanyById[0];
    }
    
    // If we need to create a new company, let's make the fiscal code unique by adding a timestamp
    const timestamp = Date.now();
    const name = 'Test Company';
    const fiscalCode = `RO${timestamp}`;
    const registrationNumber = `J40/${timestamp % 100000}/2023`;
    const address = 'Test Street 123';
    const city = 'Bucharest';
    const county = 'Sector 1';
    const country = 'Romania';
    
    console.log(`Creating company with fiscal code: ${fiscalCode}`);
    
    // Create the company with the required fields based on the table structure
    const result = await sql`
      INSERT INTO companies (
        id, name, fiscal_code, registration_number, address, city, county, country,
        created_at, updated_at
      ) VALUES (
        ${companyId}, ${name}, ${fiscalCode}, ${registrationNumber}, ${address}, 
        ${city}, ${county}, ${country}, now(), now()
      ) RETURNING *
    `;
    
    console.log('[SUCCESS] Company created:', result[0]);
    return result[0];
  } catch (error) {
    console.error('[ERROR] Failed to create company:', error);
    
    // If there's an error about duplicate keys, check existing companies
    if (error.code === '23505') {
      console.log('Duplicate key detected. Looking for existing companies...');
      const existingCompanies = await sql`
        SELECT * FROM companies LIMIT 10
      `;
      
      if (existingCompanies.length > 0) {
        console.log('Found existing companies. Using the first one:', existingCompanies[0]);
        return existingCompanies[0];
      }
    }
    
    // If there's an error about the table not existing, let's check what tables are available
    if (error.message && error.message.includes('relation "companies" does not exist')) {
      console.log('Checking available tables...');
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      console.log('Available tables:', tables.map(t => t.table_name));
      
      // Let's try to find the company table with a different name
      console.log('Searching for company-related tables...');
      const companyTables = tables.filter(t => 
        t.table_name.includes('company') || 
        t.table_name.includes('companies')
      );
      console.log('Possible company tables:', companyTables.map(t => t.table_name));
    }
    
    throw error;
  }
}

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
  }
}

// Run the tests
async function runTests() {
  try {
    await createTestCompany();
    await testDirectCnpInsert();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

runTests();