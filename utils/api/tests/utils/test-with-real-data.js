/**
 * Test HR Employee Module with Real Database Data
 *
 * This script tests the HR employee functionality using real company and user data from the database.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Constants using real data from database
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465'; // GeniusERP Demo Company
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user
const USER_EMAIL = 'admin@geniuserp.com';
const USER_ROLE = 'admin';

// Create JWT token using real user data
function createRealUserToken() {
  // Follow the EXACT JwtPayload structure from auth.service.generateToken
  const payload = {
    id: USER_ID,
    username: 'admin',
    role: USER_ROLE,
    roles: [USER_ROLE, 'hr_team'],  // Add roles array for RBAC middleware
    companyId: COMPANY_ID
  };

  // Exact same JWT_SECRET as defined in auth.service.ts
  return jwt.sign(payload, 'geniuserp_auth_jwt_secret', { expiresIn: '1h' });
}

// Generate a random Romanian CNP
function generateCNP() {
  // Simple random CNP generation - in production would need proper algorithm
  const genderAndCentury = '1'; // Male born between 1900-1999
  const year = '85';            // Year of birth: 1985
  const month = '01';           // Month: January
  const day = '15';             // Day: 15
  const county = '41';          // Bucharest county code
  const unique = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Note: In production, we would calculate the proper control digit
  const controlDigit = '1';
  
  return genderAndCentury + year + month + day + county + unique + controlDigit;
}

// Test functions
async function testEmployeeCreation() {
  try {
    const token = createRealUserToken();
    const baseUrl = 'http://localhost:5000';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Test the simple employee creation endpoint
    const uniqueEmail = `test-employee-${Date.now()}@example.com`;
    const currentDate = new Date();
    
    console.log('Testing simple employee creation...');
    const simpleEmployeeData = {
      name: 'Test Real Employee',
      email: uniqueEmail,
      position: 'Senior Developer',
      salary: 7500,
      hireDate: currentDate.toISOString()
    };

    console.log('Employee data:', JSON.stringify(simpleEmployeeData, null, 2));
    
    const simpleResponse = await axios.post(
      `${baseUrl}/api/hr/employee`, 
      simpleEmployeeData, 
      { headers }
    );
    
    console.log('Simple employee created successfully:');
    console.log('Response Status:', simpleResponse.status);
    console.log('Response Data:', JSON.stringify(simpleResponse.data, null, 2));
    
    // The employee is returned in the data property
    const employeeId = simpleResponse.data?.data?.id;
    console.log('Employee ID:', employeeId || 'No ID returned');
    
    // If we get an employee ID, test contract creation
    if (employeeId) {
      await testContractCreation(employeeId, headers, baseUrl);
    }
    
  } catch (error) {
    console.error('Error creating employee:', error.message);
    if (error.response) {
      console.error('Response error status:', error.response.status);
      console.error('Response error data:', error.response.data);
    }
  }
}

async function testContractCreation(employeeId, headers, baseUrl) {
  try {
    console.log('\nTesting contract creation for employee:', employeeId);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Contract for 1 year
    
    const contractNumber = `TEST-${Date.now()}`;
    
    const contractData = {
      employeeId,
      contractNumber,
      contractType: 'standard',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      baseSalaryGross: 7500,
      workingTime: 'full_time',
      corCode: '251401', // Software Developer
      annualVacationDays: 21
    };
    
    console.log('Contract data:', JSON.stringify(contractData, null, 2));
    
    const contractResponse = await axios.post(
      `${baseUrl}/api/hr/employees/contracts`, 
      contractData, 
      { headers }
    );
    
    console.log('Contract created successfully:');
    console.log('Response Status:', contractResponse.status);
    console.log('Contract ID:', contractResponse.data?.id || 'No ID returned');
    
  } catch (error) {
    console.error('Error creating contract:', error.message);
    if (error.response) {
      console.error('Response error status:', error.response.status);
      console.error('Response error data:', error.response.data);
    }
  }
}

// Run the tests
console.log('Starting HR module tests with real database data...');
testEmployeeCreation();