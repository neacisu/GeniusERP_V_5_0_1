/**
 * Test Activity Endpoint Script
 * 
 * This script tests the activity endpoint with the updated controller
 * to verify that the changes work correctly
 */
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Generate a JWT token
function generateToken() {
  const payload = {
    id: '31f1c7b8-b14d-4c16-9208-d884a5c7c8bf', // Test user ID
    email: 'admin@example.com',
    companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Valid company ID
    roles: ['admin'],
    permissions: ['*'],
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiration
  };

  const secret = process.env.JWT_SECRET || 'dev-secret-key';
  
  return jwt.sign(payload, secret);
}

// Test the activity endpoints
async function testActivityEndpoints() {
  try {
    const token = generateToken();
    
    console.log('Generated test token for API access');

    // 1. Test listing activities
    console.log('\nTesting GET /api/crm/activities endpoint...');
    const listResponse = await axios.get('http://localhost:5000/api/crm/activities', {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      params: {
        // Test with optional filters using the activityType parameter
        activityType: 'call',
        limit: 10
      }
    });

    console.log(`Status: ${listResponse.status}`);
    console.log(`Total activities: ${listResponse.data.total}`);
    console.log(`Activities returned: ${listResponse.data.data.length}`);
    
    if (listResponse.data.data.length > 0) {
      console.log('First activity details:');
      const firstActivity = listResponse.data.data[0];
      console.log(`- ID: ${firstActivity.id}`);
      console.log(`- Title: ${firstActivity.title}`);
      console.log(`- Type: ${firstActivity.activityType}`);
      console.log(`- Status: ${firstActivity.status}`);
    }

    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error testing activity endpoints:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Execute the test
testActivityEndpoints();