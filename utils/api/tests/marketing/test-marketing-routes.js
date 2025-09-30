/**
 * Test Marketing Routes
 * 
 * This script tests the Marketing module routes with authentication:
 * - Campaigns
 * - Segments
 * - Templates
 */

import jwt from 'jsonwebtoken';

// Create a valid token
const validToken = jwt.sign(
  {
    id: '12345',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    roles: ['admin', 'marketing'],
    companyId: '123e4567-e89b-12d3-a456-426614174000'
  }, 
  'x7k9p2m5q8x7k9p2m5q8',
  { expiresIn: '1h' }
);

console.log('Valid token:', validToken);

// Test the campaigns endpoint
fetch('http://localhost:5000/api/marketing/campaigns', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${validToken}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Campaigns Response Status:', response.status);
  return response.json();
})
.then(data => console.log('Campaigns Response:', JSON.stringify(data, null, 2)))
.catch(error => console.error('Campaigns Error:', error))
.then(() => {
  // Now test the segments endpoint
  return fetch('http://localhost:5000/api/marketing/segments', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json'
    }
  });
})
.then(response => {
  console.log('Segments Response Status:', response.status);
  return response.json();
})
.then(data => console.log('Segments Response:', JSON.stringify(data, null, 2)))
.catch(error => console.error('Segments Error:', error))
.then(() => {
  // Finally test the templates endpoint
  return fetch('http://localhost:5000/api/marketing/templates', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${validToken}`,
      'Content-Type': 'application/json'
    }
  });
})
.then(response => {
  console.log('Templates Response Status:', response.status);
  return response.json();
})
.then(data => console.log('Templates Response:', JSON.stringify(data, null, 2)))
.catch(error => console.error('Templates Error:', error));