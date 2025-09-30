/**
 * Create HR Test Data Script - ESM Version
 * 
 * This script creates test data for the HR module, including:
 * - Company (if not exists)
 * - User (if not exists)
 * - Employee
 * - Department
 * - Employment Contract
 */

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Create database connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: true,
  max: 10
});

/**
 * Generate a random Romanian CNP (valid format but not real)
 */
function generateCnp() {
  const sex = Math.random() > 0.5 ? 1 : 2; // 1 for male, 2 for female
  const year = Math.floor(Math.random() * 99);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Avoiding potential issues with month lengths
  const county = Math.floor(Math.random() * 52) + 1;
  const uniqueId = Math.floor(Math.random() * 999) + 1;
  
  // Pad numbers with leading zeros
  const yearStr = year.toString().padStart(2, '0');
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const countyStr = county.toString().padStart(2, '0');
  const uniqueIdStr = uniqueId.toString().padStart(3, '0');
  
  // Construct partial CNP
  const partialCNP = `${sex}${yearStr}${monthStr}${dayStr}${countyStr}${uniqueIdStr}`;
  
  // Calculate checksum digit
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  
  for (let i = 0; i < partialCNP.length; i++) {
    sum += parseInt(partialCNP[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 1 : remainder;
  
  return `${partialCNP}${checkDigit}`;
}

async function createTestData() {
  console.log('Starting to create HR test data...');
  
  try {
    // Check if test company exists
    console.log('Checking for test company...');
    const existingCompany = await sql`
      SELECT * FROM companies WHERE name = 'HR Test Company' OR fiscal_code = 'RO12345678'
    `;
    
    let companyId;
    
    if (existingCompany.length === 0) {
      // Generate a unique fiscal code to avoid conflicts
      const uniqueFiscalCode = `RO${Math.floor(10000000 + Math.random() * 90000000)}`;
      console.log(`Creating test company with fiscal code: ${uniqueFiscalCode}`);
      
      const newCompany = await sql`
        INSERT INTO companies (
          id, name, registration_number, fiscal_code, address, 
          city, county, country, phone, email, 
          bank_name, bank_account, created_at, updated_at
        ) VALUES (
          ${uuidv4()}, 'HR Test Company', 'J40/1234/2025', ${uniqueFiscalCode}, 'Test Street 123', 
          'Bucharest', 'Sector 1', 'Romania', '+40712345678', 'hr@testcompany.com', 
          'Test Bank', 'RO49AAAA1B31007593840000', NOW(), NOW()
        ) RETURNING id
      `;
      companyId = newCompany[0].id;
      console.log(`Test company created with ID: ${companyId}`);
    } else {
      companyId = existingCompany[0].id;
      console.log(`Using existing test company with ID: ${companyId}`);
    }
    
    // Check if HR admin user exists
    console.log('Checking for HR admin user...');
    const existingUser = await sql`
      SELECT * FROM users WHERE username = 'hradmin' AND company_id = ${companyId}
    `;
    
    let userId;
    
    if (existingUser.length === 0) {
      console.log('Creating HR admin user...');
      // Hash password
      const passwordHash = await bcrypt.hash('test1234', 10);
      
      const newUser = await sql`
        INSERT INTO users (
          id, username, password, email, first_name, 
          last_name, role, roles, company_id, created_at, updated_at
        ) VALUES (
          ${uuidv4()}, 'hradmin', ${passwordHash}, 'hradmin@testcompany.com', 'HR', 
          'Admin', 'hr_team', ARRAY['hr_team', 'admin', 'user'], ${companyId}, NOW(), NOW()
        ) RETURNING id
      `;
      userId = newUser[0].id;
      console.log(`HR admin user created with ID: ${userId}`);
    } else {
      userId = existingUser[0].id;
      console.log(`Using existing HR admin user with ID: ${userId}`);
    }
    
    // Create a test department
    console.log('Creating test department...');
    const departmentName = `HR Department ${new Date().getTime()}`;
    const department = await sql`
      INSERT INTO hr_departments (
        id, company_id, name, description, 
        manager_id, parent_department_id, is_active, 
        created_at, updated_at, created_by
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${departmentName}, 'HR Department for testing', 
        null, null, true, 
        NOW(), NOW(), ${userId}
      ) RETURNING id
    `;
    const departmentId = department[0].id;
    console.log(`Test department created with ID: ${departmentId}`);
    
    // Create a test employee
    console.log('Creating test employee...');
    const uniqueCnp = generateCnp();
    const employeeId = uuidv4();
    
    await sql`
      INSERT INTO hr_employees (
        id, company_id, first_name, last_name, 
        email, position, department, cnp,
        address, city, county, 
        phone, personal_email, personal_phone, is_active, 
        created_at, updated_at, created_by
      ) VALUES (
        ${employeeId}, ${companyId}, 'Test', 'Employee', 
        'test.employee@testcompany.com', 'HR Specialist', 'HR Department', ${uniqueCnp},
        'Employee Street 45', 'Bucharest', 'Sector 2', 
        '+40723456789', 'personal.test@gmail.com', '+40799887766', true, 
        NOW(), NOW(), ${userId}
      )
    `;
    console.log(`Test employee created with ID: ${employeeId}`);
    
    // Create an employment contract for the employee
    console.log('Creating employment contract...');
    const contractId = uuidv4();
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    await sql`
      INSERT INTO hr_employment_contracts (
        id, employee_id, contract_number, contract_type, 
        start_date, end_date, base_salary_gross, working_hours_per_week,
        cor_code, annual_leave_entitlement, company_id, currency,
        created_at, updated_at, created_by
      ) VALUES (
        ${contractId}, ${employeeId}, 'TEST-2025-${Math.floor(Math.random() * 10000)}', 'FULL_TIME', 
        ${currentDate}, ${endDate}, '5000', 40,
        '123456', 21, ${companyId}, 'RON',
        NOW(), NOW(), ${userId}
      )
    `;
    console.log(`Employment contract created with ID: ${contractId}`);
    
    // Return the created data for testing
    return {
      companyId,
      userId,
      departmentId, 
      employeeId,
      contractId,
      cnp: uniqueCnp
    };
    
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Execute the function
createTestData()
  .then(testData => {
    console.log('\nTest data created successfully!');
    console.log('-----------------------------');
    console.log('Test Data Summary:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\nYou can now use this data to test the HR module.');
  })
  .catch(error => {
    console.error('Failed to create test data:', error);
  });