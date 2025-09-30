/**
 * Test script for PandaDoc Integration
 * 
 * This script tests the PandaDoc integration client for document signing.
 * You'll need to set the PANDADOC_API_KEY environment variable before running this test.
 */

import { PandaDocClient } from './server/modules/integrations/clients/pandadoc.client';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

async function testPandaDocIntegration() {
  try {
    console.log('🚀 Testing PandaDoc Integration');
    
    // Use a test company ID
    const companyId = uuidv4();
    
    // Get API key from environment
    const apiKey = process.env.PANDADOC_API_KEY;
    
    if (!apiKey) {
      console.error('❌ PANDADOC_API_KEY environment variable not set');
      console.log('Please set the PANDADOC_API_KEY environment variable before running this test');
      process.exit(1);
    }
    
    // Create a test user ID
    const userId = uuidv4();
    
    // Create PandaDoc client
    const client = new PandaDocClient(companyId);
    
    // Initialize the client
    console.log('Initializing PandaDoc integration...');
    const integration = await client.initialize(apiKey, userId);
    
    console.log('✅ Integration initialized:', {
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      isConnected: integration.isConnected
    });
    
    // Test connection
    console.log('Testing connection...');
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      console.error('❌ Connection test failed');
      process.exit(1);
    }
    
    console.log('✅ Connection test successful');
    
    // List templates
    console.log('Listing templates...');
    const templates = await client.listTemplates(userId);
    
    console.log(`✅ Found ${templates.length} templates`);
    
    if (templates.length > 0) {
      console.log('First template:', {
        id: templates[0].id,
        name: templates[0].name,
        version: templates[0].version,
        createdAt: templates[0].createdAt
      });
    }
    
    // Test PDF document creation (if required)
    // This requires a sample PDF file to be available
    try {
      if (fs.existsSync('./test-document.pdf')) {
        console.log('Creating document from PDF...');
        
        const document = await client.createDocumentFromPdf(
          'Test Document',
          './test-document.pdf',
          [
            {
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: 'Client' // Use an actual role name that exists in the template
            }
          ],
          { test: 'true' },
          ['test'],
          {},
          userId
        );
        
        console.log('✅ Document created:', {
          id: document.id,
          name: document.name,
          status: document.status
        });
      } else {
        console.log('Skipping PDF document creation - no test PDF available');
      }
    } catch (error) {
      console.error('❌ Error creating document from PDF:', error instanceof Error ? error.message : String(error));
    }
    
    console.log('✅ PandaDoc integration tests completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the test
testPandaDocIntegration();