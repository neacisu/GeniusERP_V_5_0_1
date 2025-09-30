/**
 * Test Employee Date Handling
 *
 * This script tests the date handling in the employee service, specifically
 * focusing on the creation of employees and contracts with proper date formatting.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Create a test token for authentication
function createTestToken() {
  const payload = {
    id: 'test-user-id',
    companyId: 'test-company-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'admin',
    permissions: ['employee.create', 'employee.update', 'employee.read']
  };

  return jwt.sign(payload, 'geniuserp_auth_jwt_secret', { expiresIn: '1h' });
}

async function testEmployeeCreation() {
  try {
    const token = createTestToken();
    const baseUrl = 'http://localhost:5000';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test the creation of an employee with date fields
    const currentDate = new Date();
    const birthDate = new Date('1990-01-15');
    const hireDate = new Date();

    console.log('Original dates:');
    console.log('Birth date:', birthDate);
    console.log('Hire date:', hireDate);
    console.log('Birth date ISO:', birthDate.toISOString());
    console.log('Hire date ISO:', hireDate.toISOString());

    // Test the simple employee creation endpoint
    const simpleEmployeeData = {
      name: 'Test Employee',
      email: 'test-employee@example.com',
      position: 'Test Position',
      salary: 5000,
      hireDate: hireDate.toISOString()
    };

    console.log('\nCreating simple employee with data:', JSON.stringify(simpleEmployeeData, null, 2));
    
    const simpleResponse = await axios.post(`${baseUrl}/api/hr/employees/simple`, simpleEmployeeData, { headers });
    console.log('\nSimple employee created:', simpleResponse.data);

    // Test the creation of an employment contract with date fields
    if (simpleResponse.data && simpleResponse.data.id) {
      const employeeId = simpleResponse.data.id;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Contract for 1 year

      console.log('\nContract dates:');
      console.log('Start date:', startDate);
      console.log('End date:', endDate);
      console.log('Start date ISO:', startDate.toISOString());
      console.log('End date ISO:', endDate.toISOString());

      const contractData = {
        employeeId,
        contractNumber: 'TEST-CONTRACT-001',
        contractType: 'standard',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        baseSalaryGross: 5000,
        workingTime: 'full_time',
        corCode: '123456',
        annualVacationDays: 21
      };

      console.log('\nCreating employment contract with data:', JSON.stringify(contractData, null, 2));
      
      const contractResponse = await axios.post(`${baseUrl}/api/hr/employees/contracts`, contractData, { headers });
      console.log('\nEmployment contract created:', contractResponse.data);
    }

  } catch (error) {
    console.error('Error in test:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
  }
}

// Run the test
testEmployeeCreation();
