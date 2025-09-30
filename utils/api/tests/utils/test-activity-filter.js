/**
 * Test Activity Filter Script
 * 
 * This script tests filtering activities by type
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

// Test the activity endpoints with different activity types
async function testActivityFilters() {
  try {
    const token = generateToken();
    const types = ['call', 'meeting', 'email', 'task'];
    
    console.log('Generated test token for API access');

    for (const type of types) {
      console.log(`\nTesting filter with activityType=${type}...`);
      
      try {
        const response = await axios.get('http://localhost:5000/api/crm/activities', {
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          params: {
            activityType: type,
            limit: 10
          }
        });
        
        console.log(`Status: ${response.status}`);
        console.log(`Total activities: ${response.data.total}`);
        console.log(`Activities returned: ${response.data.data.length}`);
        
        if (response.data.data.length > 0) {
          const activityTypes = response.data.data.map(a => a.activityType);
          console.log(`Activity types found: ${activityTypes.join(', ')}`);
          console.log(`All match the requested type: ${activityTypes.every(t => t === type)}`);
        }
      } catch (error) {
        console.error(`Error testing activity filter with type=${type}:`, error.message);
      }
    }

    console.log('\nTest completed');
  } catch (error) {
    console.error('Error in test:', error.message);
  }
}

// Execute the test
testActivityFilters();