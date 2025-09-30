/**
 * Test a single batch import for COR occupations
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api/hr/cor';

// Create an admin JWT token
function generateAdminToken() {
  const jwtSecret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
  return jwt.sign(
    { 
      userId: 'admin-user-id', 
      roles: ['admin', 'hr_admin'],
      email: 'admin@test.com',
      companyId: 'system'
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
}

// Test occupations (randomly selected)
const testOccupations = [
  {
    code: '311201',
    name: 'Tehnician mineralurg',
    subminorGroupCode: '3112'
  },
  {
    code: '515302',
    name: 'Administrator clădiri',
    subminorGroupCode: '5153'
  },
  {
    code: '315507',
    name: 'Inspector navigaţie fluvială',
    subminorGroupCode: '3155'
  },
  {
    code: '251401',
    name: 'Sistem programmer',
    subminorGroupCode: '2514'
  },
  {
    code: '352133',
    name: 'Operator dispecer sisteme de monitorizare şi apara terminale radio',
    subminorGroupCode: '3521'
  }
];

// Import a batch of occupations
async function importBatch(occupations, token) {
  try {
    console.log(`Sending batch of ${occupations.length} occupations to import...`);
    
    const response = await axios.post(
      `${API_URL}/import-batch`,
      { occupations },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Import result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Server response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Get COR statistics
async function getCorStats() {
  try {
    const response = await axios.get(
      `${API_URL}/stats`,
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('COR statistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error.response?.data || error.message);
  }
}

// Main function
async function testBatchImport() {
  try {
    // Generate admin token for authentication
    const token = generateAdminToken();
    
    // Get stats before import
    console.log('\nCOR statistics BEFORE import:');
    await getCorStats();
    
    // Import the test batch
    await importBatch(testOccupations, token);
    
    // Get stats after import
    console.log('\nCOR statistics AFTER import:');
    await getCorStats();
    
  } catch (error) {
    console.error('Error in test batch import:', error);
  }
}

// Execute the test
testBatchImport();