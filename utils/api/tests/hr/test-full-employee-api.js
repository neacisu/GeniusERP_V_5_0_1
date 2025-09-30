/**
 * Test Full Employee API
 *
 * This script tests the full employee creation API which might work better than
 * the simplified version.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Constants using real data from database
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465'; // GeniusERP Demo Company
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // admin user

// Create JWT token using real user data
function createRealUserToken() {
  const payload = {
    id: USER_ID,
    companyId: COMPANY_ID,
    email: 'admin@geniuserp.com',
    username: 'admin',
    role: 'admin',
    permissions: ['employee.create', 'employee.update', 'employee.read']
  };

  return jwt.sign(payload, 'geniuserp_auth_jwt_secret', { expiresIn: '1h' });
}

// Generate a CNP (Romanian personal numerical code)
function generateCNP() {
  // Simple generation (not proper algorithm but for testing)
  return '1900101290174'; // Male born in 1990, Jan 1, Bucharest
}

async function testFullEmployeeCreation() {
  try {
    const token = createRealUserToken();
    const baseUrl = 'http://localhost:5000';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Test the full employee creation endpoint
    const uniqueEmail = `test-employee-full-${Date.now()}@example.com`;
    const birthDate = new Date('1990-01-01').toISOString();
    const hireDate = new Date().toISOString();
    
    console.log('Testing full employee creation...');
    const fullEmployeeData = {
      firstName: 'Full',
      lastName: 'Employee',
      email: uniqueEmail,
      phone: '+40722123456',
      position: 'Senior Developer', 
      departmentId: null,
      cnp: generateCNP(),
      address: 'Str. Test 123, Bucharest',
      birthDate: birthDate,
      hireDate: hireDate,
      data: {
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '+40733123456'
      }
    };

    console.log('Employee data:', JSON.stringify(fullEmployeeData, null, 2));
    
    const response = await axios.post(
      `${baseUrl}/api/hr/employees`, 
      fullEmployeeData, 
      { headers }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    
    // Check for an employee ID
    if (response.data && response.data.id) {
      console.log('Employee created with ID:', response.data.id);
      return response.data.id;
    } else {
      console.log('No employee ID found in response');
      return null;
    }
    
  } catch (error) {
    console.error('Error in test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Run the test
console.log('Starting full employee API test...');
testFullEmployeeCreation();