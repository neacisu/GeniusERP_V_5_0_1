/**
 * Test script for the EmployeeService functionality
 * Tests creating a simple employee
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465'; // Using existing company ID
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';

// Generate a valid JWT token for testing
function generateToken() {
  const payload = {
    id: '95de7599-d616-4f59-b2d6-b3137252ff90', // Test user ID
    username: 'admin',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin'],
    companyId: COMPANY_ID,
    permissions: ['hr.create', 'hr.view', 'hr.update']
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Test the employee creation endpoint
async function testCreateEmployee() {
  try {
    const token = generateToken();
    console.log('Generated token for testing:', token);

    // Test the simplified employee creation
    const simplifiedEmployeeResponse = await axios.post(
      `${API_BASE_URL}/api/hr/employees/simple`,
      {
        companyId: COMPANY_ID,
        name: 'John Smith',
        email: 'john.smith@example.com',
        position: 'Software Developer',
        salary: 5000
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Simplified employee created:', JSON.stringify(simplifiedEmployeeResponse.data, null, 2));

    // Test the full employee creation (if available)
    const fullEmployeeResponse = await axios.post(
      `${API_BASE_URL}/api/hr/employees`,
      {
        companyId: COMPANY_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '+40721234567',
        position: 'Project Manager',
        address: 'Cluj-Napoca, Romania'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Full employee created:', JSON.stringify(fullEmployeeResponse.data, null, 2));

    return {
      success: true,
      simplifiedEmployee: simplifiedEmployeeResponse.data,
      fullEmployee: fullEmployeeResponse.data
    };
  } catch (error) {
    console.error('Error testing employee service:', error.response ? error.response.data : error.message);
    return {
      success: false,
      error: error.response ? error.response.data : error.message
    };
  }
}

// Run the test
testCreateEmployee()
  .then(result => {
    console.log('Test result:', result.success ? 'SUCCESS' : 'FAILED');
    if (!result.success) {
      console.error('Error details:', result.error);
    }
  })
  .catch(err => {
    console.error('Unexpected error running test:', err);
  });