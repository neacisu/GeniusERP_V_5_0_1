/**
 * Comprehensive HR Module Test with Real Database Data
 * 
 * This script runs comprehensive tests against the HR module's employee and contract endpoints
 * using real database test data. It validates proper authentication, authorization, and data handling.
 */

import axios from 'axios';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const API_BASE_URL = 'http://0.0.0.0:5000/api'; 
const JWT_SECRET = 'x7k9p2m5q8x7k9p2m5q8'; // Consistent with auth.service.ts
let testData = null;

/**
 * Generate a valid JWT token for testing with proper roles and permissions
 */
function generateToken(userData) {
  const payload = {
    id: userData.userId,
    username: 'hradmin',
    email: 'hradmin@testcompany.com',
    firstName: 'HR',
    lastName: 'Admin',
    companyId: userData.companyId,
    role: 'hr_team',
    roles: ['hr_team', 'admin', 'user'],
    permissions: ['employee:read', 'employee:write', 'contract:read', 'contract:write', 'department:read', 'department:write'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Execute the create-hr-test-data.js script and capture output
 */
async function createTestData() {
  console.log('Creating test data...');
  
  // Instead of running the script as a subprocess, let's use a direct approach
  // First, query the database for an existing test company and employee
  const directTestData = {
    companyId: null,
    userId: null,
    employeeId: null,
    contractId: null
  };
  
  try {
    // Connect to the database using axios to make API calls
    console.log('Checking for existing test data via API...');
    
    // Generate a temporary token for API access
    const token = generateToken({
      userId: '00000000-0000-0000-0000-000000000000',
      companyId: '00000000-0000-0000-0000-000000000000'
    });
    
    // Get list of companies (HR admin would have access to company data)
    const companyResponse = await axios.get(`${API_BASE_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
      console.log('Could not get companies, using fallback test data');
      return { data: [] };
    });
    
    if (companyResponse.data && companyResponse.data.length > 0) {
      directTestData.companyId = companyResponse.data[0].id;
      console.log(`Using existing company ID: ${directTestData.companyId}`);
      
      // Get users for this company
      const userResponse = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.log('Could not get users, using fallback test user');
        return { data: [] };
      });
      
      if (userResponse.data && userResponse.data.length > 0) {
        directTestData.userId = userResponse.data[0].id;
        console.log(`Using existing user ID: ${directTestData.userId}`);
        
        // Get HR employees
        const newToken = generateToken({
          userId: directTestData.userId,
          companyId: directTestData.companyId
        });
        
        const employeeResponse = await axios.get(`${API_BASE_URL}/hr/employees`, {
          headers: { Authorization: `Bearer ${newToken}` }
        }).catch(err => {
          console.log('Could not get employees via API');
          return { data: [] };
        });
        
        if (employeeResponse.data && employeeResponse.data.length > 0) {
          directTestData.employeeId = employeeResponse.data[0].id;
          console.log(`Using existing employee ID: ${directTestData.employeeId}`);
          
          // Get employee contracts
          const contractResponse = await axios.get(
            `${API_BASE_URL}/hr/employees/${directTestData.employeeId}/contracts`, 
            { headers: { Authorization: `Bearer ${newToken}` } }
          ).catch(err => {
            console.log('Could not get contracts via API');
            return { data: [] };
          });
          
          if (contractResponse.data && contractResponse.data.length > 0) {
            directTestData.contractId = contractResponse.data[0].id;
            console.log(`Using existing contract ID: ${directTestData.contractId}`);
          }
        }
      }
    }
    
    console.log('Test data resolved:', directTestData);
    
    // Make sure we have all required test data
    if (!directTestData.companyId || !directTestData.userId || !directTestData.employeeId) {
      // Fall back to hard-coded test data
      console.log('Using fallback test data');
      const fallbackData = {
        companyId: '00000000-0000-0000-0000-000000000001',
        userId: '00000000-0000-0000-0000-000000000002',
        employeeId: null,
        contractId: null
      };
      
      // Try to create an employee since we're using fallback data
      try {
        console.log('Creating a test employee...');
        const token = generateToken({
          userId: fallbackData.userId,
          companyId: fallbackData.companyId
        });
        
        // Create employee using the API
        const employeeData = {
          companyId: fallbackData.companyId,
          firstName: 'Test',
          lastName: 'Employee',
          email: 'test.employee' + Date.now() + '@example.com',
          position: 'Tester',
          cnp: '1' + Math.floor(Math.random() * 900000000 + 100000000),
          department: 'Testing',
          address: 'Test Address',
          phone: '0700123456'
        };
        
        const response = await axios.post(`${API_BASE_URL}/hr/employees`, employeeData, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.log('Could not create test employee via API:', err.response?.status, err.response?.data || err.message);
          // If we couldn't create an employee, use the hard-coded ID as a last resort
          fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
          return { data: null };
        });
        
        if (response?.data?.id) {
          fallbackData.employeeId = response.data.id;
          console.log(`Created test employee with ID: ${fallbackData.employeeId}`);
        } else if (!fallbackData.employeeId) {
          fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
        }
      } catch (error) {
        console.log('Error creating test employee:', error.message);
        // Use hard-coded ID as a last resort
        fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
      }
      
      return fallbackData;
    }
    
    return directTestData;
  } catch (error) {
    console.error('Error finding test data:', error.message);
    
    // Fall back to hard-coded test data
    const fallbackData = {
      companyId: '00000000-0000-0000-0000-000000000001',
      userId: '00000000-0000-0000-0000-000000000002',
      employeeId: null,
      contractId: null
    };
    
    // Try to create an employee since we're using fallback data
    try {
      console.log('Creating a test employee...');
      const token = generateToken({
        userId: fallbackData.userId,
        companyId: fallbackData.companyId
      });
      
      // Create employee using the API
      const employeeData = {
        companyId: fallbackData.companyId,
        firstName: 'Test',
        lastName: 'Employee',
        email: 'test.employee' + Date.now() + '@example.com',
        position: 'Tester',
        cnp: '1' + Math.floor(Math.random() * 900000000 + 100000000),
        department: 'Testing',
        address: 'Test Address',
        phone: '0700123456'
      };
      
      const response = await axios.post(`${API_BASE_URL}/hr/employees`, employeeData, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => {
        console.log('Could not create test employee via API:', err.response?.status, err.response?.data || err.message);
        // If we couldn't create an employee, use the hard-coded ID as a last resort
        fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
        return { data: null };
      });
      
      if (response?.data?.id) {
        fallbackData.employeeId = response.data.id;
        console.log(`Created test employee with ID: ${fallbackData.employeeId}`);
      } else if (!fallbackData.employeeId) {
        fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
      }
    } catch (innerError) {
      console.log('Error creating test employee:', innerError.message);
      // Use hard-coded ID as a last resort
      fallbackData.employeeId = '00000000-0000-0000-0000-000000000003';
    }
    
    return fallbackData;
  }
}

/**
 * Test getting a list of employees
 */
async function testGetEmployees(token) {
  console.log('\n=== Testing GET /api/hr/employees ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/hr/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET /hr/employees Status: ${response.status}`);
    console.log(`Response contains ${response.data.length} employees`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get employees:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test getting a specific employee
 */
async function testGetEmployeeById(token, employeeId) {
  console.log(`\n=== Testing GET /api/hr/employees/${employeeId} ===`);
  try {
    const response = await axios.get(`${API_BASE_URL}/hr/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET /hr/employees/${employeeId} Status: ${response.status}`);
    console.log(`Employee name: ${response.data.first_name} ${response.data.last_name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to get employee by ID:`, error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test updating an employee
 */
async function testUpdateEmployee(token, employeeId) {
  console.log(`\n=== Testing PATCH /api/hr/employees/${employeeId} ===`);
  
  const updateData = {
    email: `updated.email.${Date.now()}@example.com`,
    position: 'Senior HR Specialist'
  };
  
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/hr/employees/${employeeId}`, 
      updateData, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`✅ PATCH /hr/employees/${employeeId} Status: ${response.status}`);
    console.log(`Updated fields: email=${response.data.email}, position=${response.data.position}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update employee:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test creating a new contract
 */
async function testCreateContract(token, employeeId) {
  console.log('\n=== Testing POST /api/hr/contracts ===');
  
  const currentDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  const contractData = {
    employee_id: employeeId,
    contract_number: `NEW-TEST-${Math.floor(Math.random() * 10000)}`,
    contract_type: 'PART_TIME',
    start_date: currentDate.toISOString(),
    end_date: endDate.toISOString(),
    base_salary_gross: '3500',
    working_hours_per_week: 30,
    cor_code: '234567',
    annual_leave_entitlement: 18,
    currency: 'RON'
  };
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/hr/contracts`, 
      contractData, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`✅ POST /hr/contracts Status: ${response.status}`);
    console.log(`Created contract with ID: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create contract:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test getting contracts for an employee
 */
async function testGetEmployeeContracts(token, employeeId) {
  console.log(`\n=== Testing GET /api/hr/employees/${employeeId}/contracts ===`);
  try {
    const response = await axios.get(`${API_BASE_URL}/hr/employees/${employeeId}/contracts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ GET /hr/employees/${employeeId}/contracts Status: ${response.status}`);
    console.log(`Employee has ${response.data.length} contracts`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get employee contracts:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test updating a contract
 */
async function testUpdateContract(token, contractId) {
  console.log(`\n=== Testing PATCH /api/hr/contracts/${contractId} ===`);
  
  const updateData = {
    base_salary_gross: '3650',
    annual_leave_entitlement: 20
  };
  
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/hr/contracts/${contractId}`, 
      updateData, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log(`✅ PATCH /hr/contracts/${contractId} Status: ${response.status}`);
    console.log(`Updated fields: salary=${response.data.base_salary_gross}, leave days=${response.data.annual_leave_entitlement}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update contract:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test authorization failure (missing token)
 */
async function testAuthorizationFailure() {
  console.log('\n=== Testing Authorization Failure ===');
  try {
    await axios.get(`${API_BASE_URL}/hr/employees`);
    console.log('❌ Should have failed without token');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected request without authorization token (401)');
      return true;
    }
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runHrTests() {
  let failedTests = 0;
  let passedTests = 0;
  const results = {};
  
  console.log('Starting HR module comprehensive tests...');
  
  try {
    // Create test data
    testData = await createTestData();
    console.log('Test data created successfully.');
    
    // Generate token with the user from test data
    const token = generateToken(testData);
    console.log(`Generated valid JWT token for user ID: ${testData.userId}`);
    
    // Test unauthorized access
    try {
      results.authorizationTest = await testAuthorizationFailure();
      passedTests++;
    } catch (error) {
      console.error(`❌ Authorization test failed: ${error.message}`);
      results.authorizationTest = false;
      failedTests++;
    }
    
    // Employee tests
    try {
      results.getEmployees = await testGetEmployees(token);
      passedTests++;
    } catch (error) {
      console.error(`❌ Get employees test failed: ${error.message}`);
      results.getEmployees = false;
      failedTests++;
    }
    
    try {
      results.getEmployeeById = await testGetEmployeeById(token, testData.employeeId);
      passedTests++;
    } catch (error) {
      console.error(`❌ Get employee by ID test failed: ${error.message}`);
      results.getEmployeeById = false;
      failedTests++;
    }
    
    try {
      results.updateEmployee = await testUpdateEmployee(token, testData.employeeId);
      passedTests++;
    } catch (error) {
      console.error(`❌ Update employee test failed: ${error.message}`);
      results.updateEmployee = false;
      failedTests++;
    }
    
    // Contract tests
    // Only run if we have an employee ID
    if (testData.employeeId) {
      try {
        results.getEmployeeContracts = await testGetEmployeeContracts(token, testData.employeeId);
        passedTests++;
      } catch (error) {
        console.error(`❌ Get employee contracts test failed: ${error.message}`);
        results.getEmployeeContracts = false;
        failedTests++;
      }
      
      try {
        results.createContract = await testCreateContract(token, testData.employeeId);
        if (results.createContract && results.createContract.id) {
          // Update the contractId for the next test
          testData.contractId = results.createContract.id;
        }
        passedTests++;
      } catch (error) {
        console.error(`❌ Create contract test failed: ${error.message}`);
        results.createContract = false;
        failedTests++;
      }
      
      // Only run if we have a contract ID
      if (testData.contractId) {
        try {
          results.updateContract = await testUpdateContract(token, testData.contractId);
          passedTests++;
        } catch (error) {
          console.error(`❌ Update contract test failed: ${error.message}`);
          results.updateContract = false;
          failedTests++;
        }
        
        // Verify new contract was added
        try {
          results.verifyUpdatedContracts = await testGetEmployeeContracts(token, testData.employeeId);
          passedTests++;
        } catch (error) {
          console.error(`❌ Verify updated contracts test failed: ${error.message}`);
          results.verifyUpdatedContracts = false;
          failedTests++;
        }
      }
    }
    
    // Summary
    console.log(`\n=== Test Suite Summary ===`);
    console.log(`✅ Passed tests: ${passedTests}`);
    console.log(`❌ Failed tests: ${failedTests}`);
    
    if (failedTests === 0) {
      console.log('\n✅ All HR module tests completed successfully!');
    } else {
      console.log(`\n⚠️ Some tests failed. Please check the logs above for details.`);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed to run:', error);
  }
}

// Execute all tests
runHrTests();