/**
 * Test script for EmployeeService date handling
 * This script tests the Date object handling in various employee operations
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

// Create a connection to the database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Get an existing company ID from the database
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';

/**
 * Generate a JWT token for authentication
 */
function generateToken() {
  const payload = {
    id: uuidv4(),
    email: 'test@example.com',
    username: 'testuser',
    companyId: COMPANY_ID,
    role: 'admin',
    permissions: ['manage_employees']
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret', {
    expiresIn: '1h'
  });
}

/**
 * Test the creation of an employee with proper date handling
 */
async function testEmployeeCreation() {
  const token = generateToken();
  
  try {
    console.log('Testing employee creation with dates...');
    
    // Create the employee using the API
    const birthDate = new Date('1990-01-15');
    const hireDate = new Date();
    
    const employeeData = {
      firstName: 'Test',
      lastName: 'DateEmployee',
      email: `test.date.${Date.now()}@example.com`,
      phone: '0712345678',
      position: 'Date Test Engineer',
      cnp: '1900101290174',
      address: 'Test Address',
      birthDate: birthDate.toISOString(),
      hireDate: hireDate.toISOString()
    };
    
    const response = await fetch('http://localhost:5000/api/hr/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });
    
    const result = await response.json();
    console.log('Employee created:', result);
    
    if (result.id) {
      console.log('✅ Employee creation with dates successful');
      return result.id;
    } else {
      console.error('❌ Failed to create employee');
      console.error(result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in employee creation test:', error);
    return null;
  }
}

/**
 * Test creating an employment contract with date handling
 */
async function testContractCreation(employeeId) {
  if (!employeeId) {
    console.error('❌ Cannot test contract creation - No employee ID provided');
    return null;
  }
  
  const token = generateToken();
  
  try {
    console.log('Testing employment contract creation with dates...');
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Contract ends in 1 year
    
    const contractData = {
      contractNumber: `TEST-${Date.now()}`,
      contractType: 'standard',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      baseSalaryGross: 5000,
      workingTime: 'full_time',
      corCode: '123456',
      annualVacationDays: 21
    };
    
    const response = await fetch(`http://localhost:5000/api/hr/employees/${employeeId}/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contractData)
    });
    
    const result = await response.json();
    console.log('Contract created:', result);
    
    if (result.id) {
      console.log('✅ Employment contract creation with dates successful');
      return result.id;
    } else {
      console.error('❌ Failed to create employment contract');
      console.error(result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in contract creation test:', error);
    return null;
  }
}

/**
 * Test updating an employment contract with dates
 */
async function testContractUpdate(contractId) {
  if (!contractId) {
    console.error('❌ Cannot test contract update - No contract ID provided');
    return;
  }
  
  const token = generateToken();
  
  try {
    console.log('Testing employment contract update with dates...');
    
    const terminationDate = new Date();
    terminationDate.setDate(terminationDate.getDate() + 30); // Termination in 30 days
    
    const updateData = {
      status: 'terminated',
      terminationReason: 'Test termination',
      terminationDate: terminationDate.toISOString()
    };
    
    const response = await fetch(`http://localhost:5000/api/hr/contracts/${contractId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    console.log('Contract updated:', result);
    
    if (result.id) {
      console.log('✅ Employment contract update with dates successful');
    } else {
      console.error('❌ Failed to update employment contract');
      console.error(result);
    }
  } catch (error) {
    console.error('❌ Error in contract update test:', error);
  }
}

/**
 * Run all employee service date tests
 */
async function runEmployeeDateTests() {
  try {
    // Test employee creation
    const employeeId = await testEmployeeCreation();
    
    // Test contract creation
    const contractId = await testContractCreation(employeeId);
    
    // Test contract update
    await testContractUpdate(contractId);
    
    console.log('All employee date handling tests completed');
  } catch (error) {
    console.error('Error running employee date tests:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run all tests
runEmployeeDateTests();