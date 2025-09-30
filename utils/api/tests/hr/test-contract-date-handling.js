/**
 * Test Contract Date Handling
 * 
 * This script tests the improved date handling for employee contracts
 * including both creation and updates with various date formats.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

dotenv.config();

// Constants
const API_URL = 'http://0.0.0.0:5000/api';
const HR_API = `${API_URL}/hr`;
const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
const TEST_COMPANY_ID = 'a6827e12-ed96-4296-9ece-b08cda112a7a';
const TEST_USER_ID = '64ba631a-2412-4722-aa92-14989ca89b43';

/**
 * Generate a valid JWT token for testing
 */
function generateToken() {
  const userData = {
    id: TEST_USER_ID,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    roles: ['user', 'admin', 'hr_manager'],
    companyId: TEST_COMPANY_ID
  };
  
  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test employee contract creation with various date formats
 */
async function testContractDateHandling() {
  try {
    console.log('Testing contract date handling...');
    const token = generateToken();
    
    // 1. Create a test employee first
    console.log('Creating test employee...');
    const employeeData = {
      firstName: 'Contract',
      lastName: 'DateTest',
      email: `contract.test_${Date.now()}@example.com`,
      cnp: '1900101297142', // Valid CNP from our generator
      position: 'Test Position',
      department: 'Test Department',
      address: 'Test Address',
      phone: '0712345678',
      hireDate: new Date().toISOString()
    };
    
    const employeeResponse = await fetch(`${HR_API}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...employeeData,
        companyId: TEST_COMPANY_ID
      })
    });
    
    if (!employeeResponse.ok) {
      throw new Error(`Failed to create employee: ${employeeResponse.status} ${employeeResponse.statusText}`);
    }
    
    const employee = await employeeResponse.json();
    console.log('Employee created:', employee.id);
    
    // 2. Create a contract with ISO date format
    console.log('\nTest case 1: Creating contract with ISO date format...');
    const contractData1 = {
      employeeId: employee.id,
      contractNumber: `TEST-ISO-${Date.now()}`,
      contractType: 'standard',
      startDate: new Date().toISOString(),
      endDate: null, // Indefinite contract
      baseSalaryGross: '5000',
      workingTime: 'full_time',
      corCode: '123456',
      contractFilePath: '/contracts/test.pdf'
    };
    
    const contract1Response = await fetch(`${HR_API}/contracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...contractData1,
        companyId: TEST_COMPANY_ID
      })
    });
    
    if (!contract1Response.ok) {
      throw new Error(`Failed to create contract with ISO date: ${contract1Response.status} ${contract1Response.statusText}`);
    }
    
    const contract1 = await contract1Response.json();
    console.log('Contract created with ISO date:', contract1.id);
    
    // 3. Update contract with string date format
    console.log('\nTest case 2: Updating contract with string date format...');
    // Use a date 30 days in the future as end date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toLocaleDateString('en-US'); // Format: MM/DD/YYYY
    
    const updateResponse = await fetch(`${HR_API}/contracts/${contract1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endDate: dateString,
        status: 'active'
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update contract with string date: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updatedContract = await updateResponse.json();
    console.log('Contract updated with string date:', updatedContract.endDate);
    
    // 4. Update contract with invalid date format to test handling
    console.log('\nTest case 3: Updating contract with invalid date format...');
    const invalidUpdateResponse = await fetch(`${HR_API}/contracts/${contract1.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        terminationDate: 'not-a-valid-date',
        terminationReason: 'Testing invalid date handling'
      })
    });
    
    if (!invalidUpdateResponse.ok) {
      throw new Error(`Failed in invalid date update test: ${invalidUpdateResponse.status} ${invalidUpdateResponse.statusText}`);
    }
    
    const invalidUpdatedContract = await invalidUpdateResponse.json();
    console.log('Contract updated with invalid date:', invalidUpdatedContract.terminationDate);
    
    // 5. Get the contract to verify final state
    console.log('\nTest case 4: Getting contract to verify final state...');
    const getResponse = await fetch(`${HR_API}/employees/${employee.id}/contracts/${contract1.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get contract: ${getResponse.status} ${getResponse.statusText}`);
    }
    
    const finalContract = await getResponse.json();
    console.log('Final contract state:', {
      id: finalContract.id,
      contractNumber: finalContract.contractNumber,
      startDate: finalContract.startDate,
      endDate: finalContract.endDate,
      isIndefinite: finalContract.isIndefinite,
      terminationDate: finalContract.terminationDate
    });
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
testContractDateHandling();