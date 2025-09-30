/**
 * HR Contracts Endpoints Test - ESM version
 * 
 * This script tests the HR module's contracts-related endpoints:
 * - GET /api/hr/contracts/:employeeId
 * - POST /api/hr/contracts
 * - PUT /api/hr/contracts/:id
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Create a token for testing
function generateToken() {
  const jwtSecret = process.env.JWT_SECRET || 'development-secret-key';
  const tokenData = {
    id: '2a9e25d1-bcb5-4c98-a088-1a8fcfc480f9', // Replace with a real user ID from your database
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    companyId: '1e3c8e74-d56e-4869-b8bf-989e825c8e0d', // Replace with a real company ID
    permissions: ['manage_users', 'view_reports', 'hr_team']
  };

  return jwt.sign(tokenData, jwtSecret, { expiresIn: '1h' });
}

// API base URL
const API_URL = 'http://localhost:5000/api';

// Test the contracts endpoints
async function testContractsEndpoints() {
  try {
    const token = generateToken();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Starting HR contracts endpoints test...');

    // 1. Get contracts for an employee
    console.log('\n1. Testing GET /api/hr/contracts/:employeeId');
    try {
      // Replace with an actual employee ID from your database
      const employeeId = '5f12a5c8-3b4e-4c70-a6aa-57c78e3e36f7';
      const getResponse = await axios.get(`${API_URL}/hr/contracts/${employeeId}`, { headers });
      console.log('GET response status:', getResponse.status);
      console.log('GET response data:', JSON.stringify(getResponse.data, null, 2));
    } catch (error) {
      console.error('Error getting contracts:', error.response?.status, error.response?.data || error.message);
    }

    // 2. Create a new contract
    console.log('\n2. Testing POST /api/hr/contracts');
    let createdContractId;
    try {
      // Replace employeeId with a real employee ID from your database
      const postData = {
        employeeId: '5f12a5c8-3b4e-4c70-a6aa-57c78e3e36f7',
        contractNumber: 'TEST-CTR-' + Date.now(),
        contractType: 'FULL_TIME',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year in the future
        baseSalaryGross: '5000',
        workingTime: '40',
        corCode: '123456',
        annualVacationDays: 21,
        contractFilePath: null,
        annexesFilePaths: []
      };
      
      const postResponse = await axios.post(`${API_URL}/hr/contracts`, postData, { headers });
      console.log('POST response status:', postResponse.status);
      console.log('POST response data:', JSON.stringify(postResponse.data, null, 2));
      
      // Store the created contract ID for the update test
      createdContractId = postResponse.data.data?.id;
    } catch (error) {
      console.error('Error creating contract:', error.response?.status, error.response?.data || error.message);
    }

    // 3. Update a contract
    if (createdContractId) {
      console.log('\n3. Testing PUT /api/hr/contracts/:id');
      try {
        const updateData = {
          baseSalaryGross: '5500',
          annualVacationDays: 22
        };
        
        const putResponse = await axios.put(`${API_URL}/hr/contracts/${createdContractId}`, updateData, { headers });
        console.log('PUT response status:', putResponse.status);
        console.log('PUT response data:', JSON.stringify(putResponse.data, null, 2));
      } catch (error) {
        console.error('Error updating contract:', error.response?.status, error.response?.data || error.message);
      }
    } else {
      console.log('\n3. Skipping PUT test as no contract was created');
    }

    console.log('\nHR contracts endpoints test completed');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testContractsEndpoints();