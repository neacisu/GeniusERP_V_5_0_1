/**
 * Test Communications Module API
 * 
 * This script tests the communications module API endpoints using
 * the JWT token generated for the comms_admin user.
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Generate token for comms_admin user
function generateCommToken() {
  const userData = {
    id: '3bc19baa-c8f8-4594-bc90-d4a36ed0f184',
    username: 'comms_admin',
    email: 'comms_admin@example.com',
    firstName: 'Communications',
    lastName: 'Admin',
    role: 'admin',
    companyId: '97c4796a-fd9f-4fdf-822c-2d954c47650c',
    roles: ['comms_admin'],
    status: 'active'
  };

  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('Error: JWT_SECRET is not defined in environment variables');
    return null;
  }

  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Test API endpoints
async function testCommunicationsAPI() {
  const token = generateCommToken();
  if (!token) {
    console.error('Failed to generate token');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const baseUrl = 'http://localhost:5000/api/communications';
  
  // Test cases to run
  const tests = [
    {
      name: '1. Get All Threads',
      url: `${baseUrl}/threads`,
      method: 'GET'
    },
    {
      name: '2. Get Specific Thread',
      url: `${baseUrl}/threads/8fa8019c-fdba-4c6b-ae35-3f2b46a889f5`,
      method: 'GET'
    },
    {
      name: '3. Get Thread Messages',
      url: `${baseUrl}/messages/thread/8fa8019c-fdba-4c6b-ae35-3f2b46a889f5`,
      method: 'GET'
    },
    {
      name: '4. Get Thread Access Users',
      url: `${baseUrl}/thread-access/8fa8019c-fdba-4c6b-ae35-3f2b46a889f5/users`,
      method: 'GET'
    },
    {
      name: '5. Get Contacts',
      url: `${baseUrl}/contacts`,
      method: 'GET'
    },
    {
      name: '6. Get Channel Configs',
      url: `${baseUrl}/channel-configs`,
      method: 'GET'
    }
  ];

  // Run the tests
  console.log('Starting Communications API Tests...\n');

  for (const test of tests) {
    try {
      console.log(`Running Test: ${test.name}`);
      const options = {
        method: test.method,
        headers
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(test.url, options);
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Response:', text.substring(0, 300) + (text.length > 300 ? '...' : ''));
      }
    } catch (error) {
      console.error(`Error in test ${test.name}:`, error.message);
    }
    
    console.log('\n---\n');
  }
  
  console.log('All tests completed!');
}

// Run the tests
testCommunicationsAPI();