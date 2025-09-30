/**
 * Test script for Collaboration Task Placeholder Endpoint
 * 
 * This script tests the task-placeholder endpoint using JWT authentication
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key';

// User data for test token
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

// Create a test JWT token
function createTestToken(): string {
  const userData: JwtUserData = {
    id: '7e9c1d11-bb91-4e1a-b8f2-be336b16a56c',
    username: 'test_user',
    email: 'test@example.com',
    role: 'manager',
    roles: ['manager', 'user'],
    companyId: 'c23e4567-e89b-12d3-a456-426614174000'
  };

  return jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });
}

// Test the task-placeholder endpoint
async function testTaskPlaceholder() {
  try {
    console.log('Testing Collaboration Task Placeholder endpoint...');
    
    // Create a test token
    const token = createTestToken();
    
    // Sample task data
    const taskData = {
      title: 'Test Task',
      description: 'This is a test task created through the placeholder endpoint',
      assigned_to: 'u123',
      priority: 'high'
    };
    
    // Make the API request
    const response = await axios.post(
      'http://localhost:3000/api/collaboration/tasks/task-placeholder',
      taskData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    console.log('Task placeholder endpoint test completed successfully');
  } catch (error) {
    console.error('Error testing task placeholder endpoint:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testTaskPlaceholder();