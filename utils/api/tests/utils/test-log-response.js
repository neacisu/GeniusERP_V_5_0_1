/**
 * Test with real data and log exact response structure
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

// Log complete response for debugging
async function testWithResponseLogging() {
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
      name: 'Test Response Employee',
      email: uniqueEmail,
      position: 'Senior Developer',
      salary: 7500,
      hireDate: currentDate.toISOString()
    };

    console.log('Employee data:', JSON.stringify(simpleEmployeeData, null, 2));
    
    const response = await axios.post(
      `${baseUrl}/api/hr/employees/simple`, 
      simpleEmployeeData, 
      { headers }
    );
    
    console.log('Complete response structure:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', typeof response.data, JSON.stringify(response.data, null, 2));
    
    // Check if data exists and if it has expected properties
    if (response.data) {
      if (response.data.success !== undefined) {
        console.log('Response has success property:', response.data.success);
      }
      
      if (response.data.data !== undefined) {
        console.log('Response has data property of type:', typeof response.data.data);
        console.log('Data content:', JSON.stringify(response.data.data, null, 2));
        
        if (response.data.data && response.data.data.id) {
          console.log('Found ID in response.data.data.id:', response.data.data.id);
        }
      }
      
      if (response.data.id !== undefined) {
        console.log('Response has direct id property:', response.data.id);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
  }
}

// Run the test
console.log('Starting detailed response test...');
testWithResponseLogging();