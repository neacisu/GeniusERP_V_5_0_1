/**
 * Test HR Module Endpoints - CommonJS Version
 * 
 * This script tests the HR module's employee and department endpoints
 * after authentication and API response structure updates.
 * 
 * Key Features:
 * - Generates proper JWT token with all required fields for cross-module compatibility
 * - Handles different API response structures (direct vs. nested in data property)
 * - Tests all major HR endpoints: departments, searchEmployees, and getEmployeesByDepartment
 * 
 * This version has been updated to be resilient to response format changes, making
 * it useful for both development and production environments.
 */

// CommonJS imports for compatibility with Node.js
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Load environment variables manually for CommonJS
const dotenv = fs.readFileSync('.env', 'utf8')
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('#'))
  .reduce((env, line) => {
    const [key, ...valueParts] = line.split('=');
    env[key.trim()] = valueParts.join('=').trim().replace(/^["'](.*)["']$/, '$1');
    return env;
  }, {});

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || dotenv.JWT_SECRET || 'geniuserp_auth_jwt_secret'; 

console.log('Using JWT_SECRET:', JWT_SECRET.substring(0, 3) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 3));

// Valid UUID for testing
const VALID_COMPANY_ID = '1f8f1c57-3436-490c-a366-49ab32121256';
const VALID_USER_ID = 'a5c1a63f-40de-4492-99ef-d6d40a3da5df';

/**
 * Generate a JWT token for testing
 */
function generateJwtToken() {
  const payload = {
    id: VALID_USER_ID,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    companyId: VALID_COMPANY_ID,
    role: 'admin',
    // For backward compatibility with modules using different JWT formats
    roles: ['admin'],
    permissions: ['hr.read', 'hr.write', 'hr.employees.read', 'hr.departments.read'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Test the HR employees endpoints
 */
async function testHrEmployeesEndpoints() {
  try {
    const token = generateJwtToken();
    
    console.log('🔑 JWT token generated successfully');
    
    // Test authenticated request headers
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n--- Testing HR Module Endpoints ---\n');
    
    // 1. Test getDepartments endpoint
    console.log('Testing getDepartments endpoint...');
    try {
      const departmentsResponse = await axios.get(
        `${API_BASE_URL}/api/hr/departments`, 
        { headers }
      );
      
      console.log('✅ getDepartments successfully returned:', departmentsResponse.status);
      
      // Check if response data is an array (direct response) or wrapped in a data property
      const departmentsData = Array.isArray(departmentsResponse.data) 
        ? departmentsResponse.data 
        : (departmentsResponse.data?.data || []);
      
      console.log('   Department data sample:', 
        departmentsData.slice(0, 2)
      );
    } catch (error) {
      console.error('❌ getDepartments failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // 2. Test searchEmployees endpoint
    console.log('\nTesting searchEmployees endpoint...');
    try {
      const searchResponse = await axios.get(
        `${API_BASE_URL}/api/hr/employees?search=&isActive=true&page=1&limit=10`, 
        { headers }
      );
      
      console.log('✅ searchEmployees successfully returned:', searchResponse.status);
      
      // Check if response data has the expected structure or is directly returned
      const responseData = searchResponse.data?.data || searchResponse.data;
      const pagination = responseData?.pagination || { totalCount: 'unknown' };
      const employees = responseData?.employees || responseData || [];
      
      console.log('   Total employees:', pagination.totalCount);
      console.log('   Employee data sample:', 
        employees.slice(0, 2)
          .map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}`, department: emp.department }))
      );
    } catch (error) {
      console.error('❌ searchEmployees failed:', error.response?.status, error.response?.data || error.message);
    }
    
    // 3. Test a department ID to get employees from that department
    console.log('\nTesting getEmployeesByDepartment endpoint...');
    try {
      // First get departments to find an ID
      const deptListResponse = await axios.get(
        `${API_BASE_URL}/api/hr/departments`, 
        { headers }
      );
      
      // Check if response data is an array (direct response) or wrapped in a data property
      const departmentsData = Array.isArray(deptListResponse.data) 
        ? deptListResponse.data 
        : (deptListResponse.data?.data || []);
      
      if (departmentsData && departmentsData.length > 0) {
        const departmentId = departmentsData[0].id;
        console.log(`   Using department ID: ${departmentId}`);
        
        const deptEmployeesResponse = await axios.get(
          `${API_BASE_URL}/api/hr/departments/${departmentId}/employees`, 
          { headers }
        );
        
        console.log('✅ getEmployeesByDepartment successfully returned:', deptEmployeesResponse.status);
        
        // Check if response data is an array (direct response) or wrapped in a data property
        const employeesData = Array.isArray(deptEmployeesResponse.data) 
          ? deptEmployeesResponse.data 
          : (deptEmployeesResponse.data?.data || []);
        
        console.log('   Employees in department:', employeesData.length);
        console.log('   Employee data sample:', 
          employeesData.slice(0, 2)
            .map(emp => ({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` }))
        );
      } else {
        console.log('   No departments found to test getEmployeesByDepartment');
      }
    } catch (error) {
      console.error('❌ getEmployeesByDepartment failed:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n--- HR Module Testing Complete ---\n');
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the tests
testHrEmployeesEndpoints();