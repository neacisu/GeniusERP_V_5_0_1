/**
 * Test Employee Creation With CNP
 * 
 * This script tests the creation of an employee with a CNP field
 * through the HR module's POST /employee endpoint with JWT authentication.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server URL - use the correct API path
const SERVER_URL = 'http://localhost:5000/api';

// Generate a valid JWT token for testing
function generateToken() {
  const payload = {
    id: '1f21e21f-e9af-42ee-9c9d-87c3bafc30b7',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    roles: ['admin', 'hr_team'],
    companyId: 'f5f9c8f7-a71e-4e31-9175-fb673d1e534d',
    permissions: ['create:employee', 'read:employee', 'update:employee']
  };

  const secret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  return token;
}

async function testCreateEmployeeWithCnp() {
  try {
    const token = generateToken();
    
    // Test data for employee creation
    const employeeData = {
      name: 'Testing Employee',
      email: 'testing.employee@example.com',
      position: 'Test Position',
      salary: 5000,
      hireDate: new Date().toISOString(),
      cnp: '1950101000000' // Test CNP value
    };

    // Make request to create employee
    const response = await axios.post(
      `${SERVER_URL}/hr/employee`, 
      employeeData,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);
    
    if (response.data.success) {
      const employee = response.data.data;
      console.log('Employee created successfully!');
      console.log('ID:', employee.id);
      console.log('Name:', employee.firstName, employee.lastName);
      console.log('Email:', employee.email);
      console.log('CNP:', employee.cnp);
    } else {
      console.error('Failed to create employee:', response.data.message);
    }
  } catch (error) {
    console.error('Error creating employee:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testCreateEmployeeWithCnp();