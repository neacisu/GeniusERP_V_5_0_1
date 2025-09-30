/**
 * Test Marketing Module with Authentication
 * 
 * This script tests the Marketing module functionality using a test JWT token.
 */

import { getDrizzle } from './server/common/drizzle';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { CampaignType, AudienceType, CampaignStatus } from './shared/schema/marketing.schema';

// Create a test JWT token with admin privileges
function createToken() {
  const userId = uuidv4();
  const companyId = uuidv4();
  
  const payload = {
    id: userId,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    companyId: companyId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  // Use a test JWT secret - in production this would be securely stored
  const secret = 'test-secret-key-for-marketing-module-testing';
  
  return sign(payload, secret);
}

// Test creating a campaign
async function testCreateCampaign() {
  const token = createToken();
  console.log('Testing campaign creation with auth token');
  
  const campaign = {
    name: 'Test Campaign',
    description: 'A test marketing campaign',
    type: CampaignType.EMAIL,
    status: CampaignStatus.DRAFT,
    subject: 'Test Subject',
    content: 'Test content for the campaign',
    contentHtml: '<p>Test HTML content for the campaign</p>',
    audienceType: AudienceType.SEGMENT,
    audienceId: uuidv4() // Dummy segment ID
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/marketing/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(campaign)
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    return data.data?.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    return null;
  }
}

// Test listing campaigns
async function testListCampaigns() {
  const token = createToken();
  console.log('Testing campaign listing with auth token');
  
  try {
    const response = await fetch('http://localhost:5000/api/marketing/campaigns', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error listing campaigns:', error);
  }
}

// Run the tests
async function runTests() {
  // Note: These tests will likely still fail because the main app has its own
  // authentication middleware and JWT secret, but this is a good example of how
  // to test with authentication.
  console.log('Running Marketing module auth tests (example only)');
  const campaignId = await testCreateCampaign();
  await testListCampaigns();
}

runTests()
  .then(() => console.log('Tests completed'))
  .catch(error => console.error('Tests failed:', error));