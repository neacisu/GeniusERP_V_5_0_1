/**
 * Test Campaign Controller
 * 
 * This script tests the CampaignController in the Marketing module by creating
 * a real HTTP server and making actual HTTP requests.
 */

import express, { Request, Response } from 'express';
import { json } from 'body-parser';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { campaignController } from './server/modules/marketing/controllers';
import { CampaignStatus, CampaignType, AudienceType } from './shared/schema/marketing.schema';

// Load environment variables
dotenv.config();

// Create a test user with appropriate roles
const testUser = {
  id: uuidv4(),
  username: 'test.user',
  email: 'test@example.com',
  role: 'marketing_manager',
  roles: ['marketing_manager', 'marketing_user'],
  companyId: uuidv4(),
  franchiseId: null
};

// Create a JWT token for authentication
function createToken(user: any): string {
  const jwtSecret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(user, jwtSecret, { expiresIn: '1h' });
}

// Create a test HTTP server
async function createTestServer() {
  const app = express();
  app.use(json());
  
  // Mock the auth middleware
  app.use((req, res, next) => {
    (req as any).user = testUser;
    next();
  });
  
  // Set up test routes
  app.post('/api/test/campaigns', (req, res) => campaignController.createCampaign(req as Request, res as Response));
  app.get('/api/test/campaigns', (req, res) => campaignController.listCampaigns(req as Request, res as Response));
  app.get('/api/test/campaigns/:id', (req, res) => campaignController.getCampaignById(req as Request, res as Response));
  
  // Start the server
  const port = 5555;
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Test server running on port ${port}`);
  });
  
  return { server, port };
}

// Test the createCampaign method
async function testCreateCampaign(port: number) {
  console.log('\nTesting createCampaign...');
  
  const campaignData = {
    name: 'Test Campaign',
    description: 'This is a test campaign',
    type: CampaignType.EMAIL,
    audience: AudienceType.CUSTOM, // Using CUSTOM as AudienceType.CUSTOMERS doesn't exist
    channels: ['email'],
    status: CampaignStatus.DRAFT
  };
  
  try {
    const response = await axios.post(`http://localhost:${port}/api/test/campaigns`, campaignData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return { 
      success: response.status === 201 && response.data.success === true, 
      data: response.data,
      campaignId: response.data.data?.id
    };
  } catch (error: any) {
    console.error('Error in testCreateCampaign:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, error };
  }
}

// Test the listCampaigns method
async function testListCampaigns(port: number) {
  console.log('\nTesting listCampaigns...');
  
  try {
    const response = await axios.get(`http://localhost:${port}/api/test/campaigns?page=1&pageSize=10`);
    
    console.log('Response status:', response.status);
    if (response.data?.data?.campaigns) {
      console.log('Campaigns found:', response.data.data.campaigns.length);
    }
    console.log('Response data structure:', 
      Object.keys(response.data?.data || {}));
    
    return { 
      success: response.status === 200 && response.data.success === true, 
      data: response.data 
    };
  } catch (error: any) {
    console.error('Error in testListCampaigns:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, error };
  }
}

// Test the getCampaignById method
async function testGetCampaignById(port: number, id: string) {
  console.log('\nTesting getCampaignById...');
  
  try {
    const response = await axios.get(`http://localhost:${port}/api/test/campaigns/${id}`);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return { 
      success: response.status === 200 && response.data.success === true, 
      data: response.data 
    };
  } catch (error: any) {
    console.error('Error in testGetCampaignById:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return { success: false, error };
  }
}

// Run the tests
async function runTests() {
  console.log('Starting Campaign Controller tests...');
  
  // Create a test server
  const { server, port } = await createTestServer();
  
  try {
    // Test creating a campaign
    const createResult = await testCreateCampaign(port);
    
    // Test listing campaigns
    const listResult = await testListCampaigns(port);
    
    // If create was successful, test getting the campaign by ID
    let getResult = { success: false };
    if (createResult.success && createResult.campaignId) {
      getResult = await testGetCampaignById(port, createResult.campaignId);
    }
    
    console.log('\nTest Results Summary:');
    console.log('- Create Campaign Test:', createResult.success ? 'PASSED ✅' : 'FAILED ❌');
    console.log('- List Campaigns Test:', listResult.success ? 'PASSED ✅' : 'FAILED ❌');
    console.log('- Get Campaign Test:', getResult.success ? 'PASSED ✅' : 'FAILED ❌');
    
    console.log('\nTests completed!');
  } finally {
    // Close the server
    server.close(() => {
      console.log('Test server closed');
    });
  }
}

// Execute tests
runTests()
  .then(() => {
    console.log('All tests completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });