/**
 * Test script for verifying date handling in the HR module
 * This script tests employee creation, contract creation and absence requests
 * after fixing the date handling issues
 */
import axios from 'axios';
import jwt from 'jsonwebtoken';

// JWT Secret - same as in auth.service.ts
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';

/**
 * Generate a JWT token for authentication
 */
function generateToken() {
  const payload = {
    id: '3e55b2ff-96c9-4b7d-b052-918a5ad9bfa3', // Admin user ID
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Company ID
    role: 'admin',
    roles: ['admin', 'manager', 'hr_manager'],
    permissions: ['*'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Test employee creation with date handling
 */
async function testEmployeeCreation() {
  console.log('Testing employee creation with proper date handling...');
  const token = generateToken();
  
  try {
    const response = await axios.post('http://localhost:5000/api/hr/employees', {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@example.com',
      position: 'Software Developer',
      phone: '0744123456',
      cnp: '1900101290174',
      address: 'Test Address, Bucharest',
      birthDate: '1990-01-01', // String date format from frontend
      hireDate: '2023-01-15', // String date format from frontend
      data: {
        emergencyContact: 'John Doe',
        emergencyPhone: '0722123456'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Employee created successfully:', response.data);
    console.log('Employee ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating employee:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Test creating a contract with proper date handling
 */
async function testContractCreation(employeeId) {
  console.log('Testing contract creation with proper date handling...');
  const token = generateToken();
  
  try {
    const response = await axios.post('http://localhost:5000/api/hr/contracts', {
      employeeId: employeeId,
      contractNumber: 'TEST-123',
      contractType: 'standard',
      startDate: '2023-01-15', // String date format from frontend
      endDate: '2024-01-14', // String date format from frontend
      baseSalaryGross: '5000',
      workingTime: 'full_time',
      corCode: '251401', // Software developer COR code
      annualVacationDays: 21,
      contractFilePath: '/uploads/contracts/test.pdf',
      annexesFilePaths: []
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Contract created successfully:', response.data);
    console.log('Contract ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating contract:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Test absence request with proper date handling
 */
async function testAbsenceRequest(employeeId) {
  console.log('Testing absence request with proper date handling...');
  const token = generateToken();
  
  try {
    const response = await axios.post('http://localhost:5000/api/hr/absences', {
      employeeId: employeeId,
      startDate: '2023-05-10', // String date format from frontend
      endDate: '2023-05-14', // String date format from frontend
      type: 'vacation',
      description: 'Annual leave'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Absence request created successfully:', response.data);
    console.log('Absence ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error creating absence request:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Run all HR date handling tests
 */
async function runHrDateHandlingTests() {
  console.log('Starting HR date handling tests...');
  
  // Test employee creation
  const employeeId = await testEmployeeCreation();
  if (!employeeId) {
    console.error('Employee creation failed, stopping tests.');
    return;
  }
  
  // Test contract creation with the new employee
  const contractId = await testContractCreation(employeeId);
  if (!contractId) {
    console.error('Contract creation failed, stopping tests.');
    return;
  }
  
  // Test absence request with the new employee
  const absenceId = await testAbsenceRequest(employeeId);
  if (!absenceId) {
    console.error('Absence request failed, stopping tests.');
    return;
  }
  
  console.log('All HR date handling tests completed successfully!');
}

// Run the tests
runHrDateHandlingTests().catch(error => {
  console.error('Error running tests:', error);
});