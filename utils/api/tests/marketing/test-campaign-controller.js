/**
 * Test Campaign Controller
 * 
 * This script tests the CampaignController in the Marketing module by making
 * HTTP requests to the API endpoints.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Generate a JWT token for testing
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'test-secret-key';
  
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      username: user.username,
      role: user.role,
      roles: ['user', 'admin'],
    },
    secret,
    { expiresIn: '1h' }
  );
}

// Set up axios with base URL and auth header
function setupAxiosClient(token) {
  const client = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Add response interceptor for logging
  client.interceptors.response.use(
    response => {
      console.log(`[${response.status}] ${response.config.method.toUpperCase()} ${response.config.url}`);
      return response;
    },
    error => {
      console.error(`[ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${error.message}`);
      if (error.response) {
        console.error(`Response data:`, error.response.data);
      }
      return Promise.reject(error);
    }
  );
  
  return client;
}

// Test creating a campaign
async function testCreateCampaign(client) {
  console.log('\n--- Testing Create Campaign ---');
  
  const campaignData = {
    name: "Test Email Campaign " + new Date().toISOString(),
    type: "email",
    status: "draft",
    subject: "Test Email Subject",
    content: "<p>This is a test email campaign</p>",
    channels: ["email"],
    audienceType: "segment",
    segmentId: null, // You would need a real segment ID from your database
    metadata: {
      sender: "test@example.com",
      replyTo: "noreply@example.com"
    },
    scheduledAt: null,
    companyId: "87654321-4321-4321-4321-210987654321" // Add companyId
  };
  
  try {
    const response = await client.post('/api/marketing/campaigns', campaignData);
    console.log('Campaign created successfully:', response.data.data.id);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create campaign');
    return null;
  }
}

// Test updating a campaign
async function testUpdateCampaign(client, campaignId) {
  console.log(`\n--- Testing Update Campaign ${campaignId} ---`);
  
  const updateData = {
    name: "Updated Campaign Name",
    subject: "Updated Email Subject",
    content: "<p>This is an updated test campaign</p>",
    companyId: "87654321-4321-4321-4321-210987654321" // Add companyId
  };
  
  try {
    // Use PUT instead of PATCH since we have a working PUT endpoint
    const response = await client.put(`/api/marketing/campaigns/${campaignId}`, updateData);
    console.log('[DEBUG] Update response:', response.status, typeof response.data);
    if (response.data && response.data.data) {
      console.log('Campaign updated successfully:', response.data.data.name);
      return response.data.data;
    } else {
      console.error('Update response missing data');
      return null;
    }
  } catch (error) {
    console.error('Failed to update campaign:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    }
    return null;
  }
}

// Test scheduling a campaign
async function testScheduleCampaign(client, campaignId) {
  console.log(`\n--- Testing Schedule Campaign ${campaignId} ---`);
  
  // Schedule for 1 hour from now
  const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  
  try {
    const response = await client.post(`/api/marketing/campaigns/${campaignId}/schedule`, { scheduledAt });
    console.log('Campaign scheduled successfully for:', response.data.data.scheduledAt);
    return response.data.data;
  } catch (error) {
    console.error('Failed to schedule campaign');
    return null;
  }
}

// Test starting a campaign
async function testStartCampaign(client, campaignId) {
  console.log(`\n--- Testing Start Campaign ${campaignId} ---`);
  
  try {
    const response = await client.post(`/api/marketing/campaigns/${campaignId}/start`);
    console.log('Campaign started successfully, status:', response.data.data.status);
    return response.data.data;
  } catch (error) {
    console.error('Failed to start campaign');
    return null;
  }
}

// Test pausing a campaign
async function testPauseCampaign(client, campaignId) {
  console.log(`\n--- Testing Pause Campaign ${campaignId} ---`);
  
  try {
    const response = await client.post(`/api/marketing/campaigns/${campaignId}/pause`);
    console.log('Campaign paused successfully, status:', response.data.data.status);
    return response.data.data;
  } catch (error) {
    console.error('Failed to pause campaign');
    return null;
  }
}

// Test resuming a campaign
async function testResumeCampaign(client, campaignId) {
  console.log(`\n--- Testing Resume Campaign ${campaignId} ---`);
  
  try {
    const response = await client.post(`/api/marketing/campaigns/${campaignId}/resume`);
    console.log('Campaign resumed successfully, status:', response.data.data.status);
    return response.data.data;
  } catch (error) {
    console.error('Failed to resume campaign');
    return null;
  }
}

// Test getting all campaigns
async function testListCampaigns(client) {
  console.log('\n--- Testing List Campaigns ---');
  
  try {
    const response = await client.get('/api/marketing/campaigns');
    console.log(`Retrieved ${response.data.data.length} campaigns`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to list campaigns');
    return [];
  }
}

// Run the tests
async function runTests() {
  // Create a test user
  const testUser = {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'test@example.com',
    companyId: '87654321-4321-4321-4321-210987654321',
    username: 'testuser',
    role: 'admin'
  };
  
  // Generate token and set up axios client
  const token = generateToken(testUser);
  const client = setupAxiosClient(token);
  
  try {
    // First, list existing campaigns
    await testListCampaigns(client);
    
    // Create a new campaign
    const campaign = await testCreateCampaign(client);
    if (!campaign) return;
    
    // Update the campaign
    await testUpdateCampaign(client, campaign.id);
    
    // Schedule the campaign
    await testScheduleCampaign(client, campaign.id);
    
    // Start the campaign
    await testStartCampaign(client, campaign.id);
    
    // Pause the campaign
    await testPauseCampaign(client, campaign.id);
    
    // Resume the campaign
    await testResumeCampaign(client, campaign.id);
    
    // List campaigns again to see changes
    await testListCampaigns(client);
    
    console.log('\n--- All tests completed ---');
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Failed to run tests:', error);
});