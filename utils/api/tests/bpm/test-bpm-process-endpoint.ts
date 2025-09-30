/**
 * Test BPM Process Placeholder Endpoint
 * 
 * This script tests the BPM process placeholder endpoint with authentication.
 */

import jsonwebtoken from 'jsonwebtoken';
import axios from 'axios';
import * as dotenv from 'dotenv';

const { sign } = jsonwebtoken;

// Load environment variables
dotenv.config();

// JWT Secret from environment variables or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development-only';

/**
 * Interface for JWT user data
 */
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
 * Create a test JWT token for an admin user
 */
function createAdminToken(): string {
  const adminUserData: JwtUserData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'tester',
    email: 'test@example.com',
    role: 'admin',
    roles: ['admin', 'bpm_manager'],
    companyId: 'c23e4567-e89b-12d3-a456-426614174000'
  };

  // Create token valid for 1 hour
  return sign(adminUserData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test the BPM Process Placeholder endpoint
 */
async function testBpmProcessEndpoint() {
  try {
    console.log('Testing BPM Process Placeholder endpoint...');
    
    // Create token
    const token = createAdminToken();
    console.log('Created test JWT token');
    
    // API base URL
    const baseUrl = 'http://localhost:5000';
    
    // Test data
    const testData = {
      name: 'Test Process',
      description: 'Test process for AWB generation',
      companyId: 'c23e4567-e89b-12d3-a456-426614174000'
    };
    
    // Send request to BPM process placeholder endpoint
    console.log('Sending POST request to /api/bpm/process-placeholder...');
    const response = await axios.post(
      `${baseUrl}/api/bpm/process-placeholder`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error testing BPM Process endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run the test
testBpmProcessEndpoint();