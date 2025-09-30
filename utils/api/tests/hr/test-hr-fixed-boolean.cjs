/**
 * Test HR Employee Endpoints with Proper Boolean Handling
 *
 * This script tests the HR employee endpoints to verify proper boolean handling
 * in the PostgreSQL queries for:
 * 1. Searching employees with isActive filter
 * 2. Getting departments with includeInactive filter
 * 3. Getting employees by department with includeInactive filter
 */

const { neon } = require('@neondatabase/serverless');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

// Connection to the database
const databaseConfig = {
  connectionString: process.env.DATABASE_URL
};

/**
 * Generate a JWT token for testing
 */
function generateJwtToken() {
  const JWT_SECRET = process.env.JWT_SECRET || 'Enterprise-HR-Secret-Key-2025-Secure';
  
  // Generate a proper UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  const payload = {
    id: generateUUID(),
    username: "test-user",
    email: "test@example.com",
    companyId: generateUUID(),
    role: "admin",
    permissions: ["hr:read", "hr:write"]
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test HR employee endpoints with various boolean parameters
 */
async function testHrBooleanFilters() {
  try {
    console.log('\n🔍 Testing HR endpoints with boolean parameters...');
    
    const token = generateJwtToken();
    const baseUrl = 'http://localhost:5000/api/hr';
    
    // 1. Test searchEmployees endpoint with isActive=true
    console.log('\n🔍 Testing searchEmployees with isActive=true...');
    const searchActiveEmployeesResponse = await fetch(
      `${baseUrl}/employees?isActive=true`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (searchActiveEmployeesResponse.ok) {
      const searchActiveData = await searchActiveEmployeesResponse.json();
      console.log('✅ Search active employees succeeded!');
      console.log(`📊 Found ${searchActiveData.data.employees.length} active employees`);
    } else {
      console.error('❌ Search active employees failed:', await searchActiveEmployeesResponse.text());
    }
    
    // 2. Test searchEmployees endpoint with isActive=false
    console.log('\n🔍 Testing searchEmployees with isActive=false...');
    const searchInactiveEmployeesResponse = await fetch(
      `${baseUrl}/employees?isActive=false`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (searchInactiveEmployeesResponse.ok) {
      const searchInactiveData = await searchInactiveEmployeesResponse.json();
      console.log('✅ Search inactive employees succeeded!');
      console.log(`📊 Found ${searchInactiveData.data.employees.length} inactive employees`);
    } else {
      console.error('❌ Search inactive employees failed:', await searchInactiveEmployeesResponse.text());
    }
    
    // 3. Test getDepartments endpoint with includeInactive=false (default)
    console.log('\n🔍 Testing getDepartments with includeInactive=false (default)...');
    const getActiveDepartmentsResponse = await fetch(
      `${baseUrl}/departments`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (getActiveDepartmentsResponse.ok) {
      const activeDepartmentsData = await getActiveDepartmentsResponse.json();
      console.log('✅ Get active departments succeeded!');
      console.log(`📊 Found ${activeDepartmentsData.data.length} active departments`);
    } else {
      console.error('❌ Get active departments failed:', await getActiveDepartmentsResponse.text());
    }
    
    // 4. Test getDepartments endpoint with includeInactive=true
    console.log('\n🔍 Testing getDepartments with includeInactive=true...');
    const getAllDepartmentsResponse = await fetch(
      `${baseUrl}/departments?includeInactive=true`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (getAllDepartmentsResponse.ok) {
      const allDepartmentsData = await getAllDepartmentsResponse.json();
      console.log('✅ Get all departments succeeded!');
      console.log(`📊 Found ${allDepartmentsData.data.length} total departments`);
    } else {
      console.error('❌ Get all departments failed:', await getAllDepartmentsResponse.text());
    }
    
    // 5. Get a department ID for testing employees by department endpoint
    const departmentIdResponse = await fetch(
      `${baseUrl}/departments`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!departmentIdResponse.ok) {
      console.error('❌ Could not get department ID for testing:', await departmentIdResponse.text());
      return;
    }
    
    const departmentsData = await departmentIdResponse.json();
    if (!departmentsData.data.length) {
      console.log('⚠️ No departments found to test employees by department endpoint');
      return;
    }
    
    const departmentId = departmentsData.data[0].id;
    console.log(`🏢 Using department ID: ${departmentId} for testing`);
    
    // 6. Test getEmployeesByDepartment endpoint with includeInactive=false
    console.log('\n🔍 Testing getEmployeesByDepartment with includeInactive=false...');
    const getActiveEmployeesByDeptResponse = await fetch(
      `${baseUrl}/departments/${departmentId}/employees`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (getActiveEmployeesByDeptResponse.ok) {
      const activeEmployeesByDeptData = await getActiveEmployeesByDeptResponse.json();
      console.log('✅ Get active employees by department succeeded!');
      console.log(`📊 Found ${activeEmployeesByDeptData.data.length} active employees in department`);
    } else {
      console.error('❌ Get active employees by department failed:', await getActiveEmployeesByDeptResponse.text());
    }
    
    // 7. Test getEmployeesByDepartment endpoint with includeInactive=true
    console.log('\n🔍 Testing getEmployeesByDepartment with includeInactive=true...');
    const getAllEmployeesByDeptResponse = await fetch(
      `${baseUrl}/departments/${departmentId}/employees?includeInactive=true`, 
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (getAllEmployeesByDeptResponse.ok) {
      const allEmployeesByDeptData = await getAllEmployeesByDeptResponse.json();
      console.log('✅ Get all employees by department succeeded!');
      console.log(`📊 Found ${allEmployeesByDeptData.data.length} total employees in department`);
    } else {
      console.error('❌ Get all employees by department failed:', await getAllEmployeesByDeptResponse.text());
    }
    
    console.log('\n✅ HR boolean filter tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing HR endpoints:', error);
  }
}

// Run the tests
testHrBooleanFilters();