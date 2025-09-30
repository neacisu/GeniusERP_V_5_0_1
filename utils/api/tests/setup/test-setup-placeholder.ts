/**
 * Test script for Settings Setup Placeholder Endpoint
 * 
 * This script tests the new setup-placeholder endpoint in the Settings module.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Define the JWT user data structure
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

/**
 * Create a test JWT token
 */
function createTestToken(): string {
  const testUserData: JwtUserData = {
    id: '12345',
    username: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN',
    roles: ['ADMIN', 'USER'],
    companyId: 'c23e4567-e89b-12d3-a456-426614174000' // Test Company SRL
  };

  // Get JWT secret from environment, or use default for testing
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
  
  // Create token with 1 hour expiration
  return jwt.sign(testUserData, jwtSecret, { expiresIn: '1h' });
}

/**
 * Test the setup-placeholder endpoint
 */
async function testSetupPlaceholderEndpoint() {
  const token = createTestToken();
  const baseUrl = 'http://localhost:5000/api';
  
  try {
    console.log('Testing POST /api/v1/settings/setup-placeholder endpoint...');
    
    // Test with valid data
    const response = await axios.post(
      `${baseUrl}/api/v1/settings/setup-placeholder`,
      {
        companyId: 'c23e4567-e89b-12d3-a456-426614174000',
        steps: [
          { name: 'company_setup', status: 'completed' },
          { name: 'user_setup', status: 'completed' },
          { name: 'warehouse_setup', status: 'in_progress' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response:', response.status, response.data);
    
    // Test without authorization
    try {
      await axios.post(
        `${baseUrl}/api/v1/settings/setup-placeholder`,
        { companyId: 'c23e4567-e89b-12d3-a456-426614174000' }
      );
      console.error('ERROR: Request should have been rejected due to missing authorization');
    } catch (authError: any) {
      if (authError.response?.status === 401) {
        console.log('✅ Authorization check passed: Received 401 when no token provided');
      } else {
        console.error('Unexpected error during authorization test:', authError.message);
      }
    }
    
    // Test without companyId
    try {
      await axios.post(
        `${baseUrl}/api/v1/settings/setup-placeholder`,
        { steps: [] },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.error('ERROR: Request should have been rejected due to missing companyId');
    } catch (validationError: any) {
      if (validationError.response?.status === 400) {
        console.log('✅ Validation check passed: Received 400 when no companyId provided');
      } else {
        console.error('Unexpected error during validation test:', validationError.message);
      }
    }
    
    console.log('Setup placeholder endpoint test completed');
  } catch (error: any) {
    console.error('Error testing setup placeholder endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testSetupPlaceholderEndpoint();