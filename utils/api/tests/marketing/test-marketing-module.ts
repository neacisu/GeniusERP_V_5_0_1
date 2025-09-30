/**
 * Test Marketing Module
 * 
 * This script tests the Marketing module functionality including campaigns, segments, and templates.
 */

import { getDrizzle } from './server/common/drizzle';
import { MarketingModule } from './server/modules/marketing/marketing.module';
import express from 'express';
import axios from 'axios';

async function testMarketingModule() {
  console.log('Testing Marketing Module...');
  
  // Create a test Express app
  const app = express();
  app.use(express.json());
  
  try {
    // Register the Marketing module
    console.log('Registering Marketing module...');
    await MarketingModule.register(app);
    console.log('Marketing module registered');
    
    // Start a test server
    const port = 3010;
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Test server listening on port ${port}`);
    });
    
    // Test campaigns endpoint
    try {
      console.log('Testing campaigns endpoint...');
      const response = await axios.get(`http://localhost:${port}/api/marketing/campaigns`);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
    } catch (error: any) {
      console.error('Error testing campaigns endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Test segments endpoint
    try {
      console.log('Testing segments endpoint...');
      const response = await axios.get(`http://localhost:${port}/api/marketing/segments`);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
    } catch (error: any) {
      console.error('Error testing segments endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Test templates endpoint
    try {
      console.log('Testing templates endpoint...');
      const response = await axios.get(`http://localhost:${port}/api/marketing/templates`);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
    } catch (error: any) {
      console.error('Error testing templates endpoint:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Close the server
    server.close(() => {
      console.log('Test server closed');
    });
    
  } catch (error) {
    console.error('Error testing Marketing module:', error);
  }
}

// Run the test
testMarketingModule()
  .then(() => {
    console.log('Marketing module test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Marketing module test failed:', error);
    process.exit(1);
  });