/**
 * Test for PandaDoc Document Status Endpoint
 * 
 * This script tests the PandaDoc document status endpoint to verify that
 * it correctly retrieves the status of a document.
 */

import axios from 'axios';
import { check_secrets } from './secret-check';

// Generate a test JWT token for authenticating API requests
async function generateTestToken() {
  try {
    // Import the JWT service singleton instance
    const jwtService = (await import('./server/modules/auth/services/jwt.service')).default;
    
    // Create a test user payload
    const userPayload = {
      id: '12345678-1234-1234-1234-123456789012',
      username: 'test-user',
      companyId: '87654321-4321-4321-4321-210987654321',
      role: 'admin',
      roles: ['admin']
    };
    
    // Generate a token using the singleton instance
    const token = await jwtService.generateToken(userPayload);
    
    console.log('Generated test token for API requests');
    return token;
  } catch (error) {
    console.error('Failed to generate test token:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Test the document status endpoint
async function testDocumentStatusEndpoint() {
  try {
    console.log('Testing PandaDoc document status endpoint...');
    
    // Check if PandaDoc API key is available
    const secretStatus = await check_secrets(['PANDADOC_API_KEY']);
    if (!secretStatus.PANDADOC_API_KEY) {
      console.error('PandaDoc API key is missing. Set PANDADOC_API_KEY as a secret.');
      return;
    }
    
    // Get authentication token
    const token = await generateTestToken();
    if (!token) {
      console.error('Failed to get authentication token');
      return;
    }
    
    // Configure axios for API requests
    const api = axios.create({
      baseURL: 'http://localhost:3000',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Initialize PandaDoc integration
    console.log('Initializing PandaDoc integration...');
    await api.post('/api/integrations/pandadoc/initialize', {
      apiKey: process.env.PANDADOC_API_KEY
    });
    
    // List available templates
    console.log('Fetching templates...');
    const templatesResponse = await api.get('/api/integrations/pandadoc/templates');
    const templates = templatesResponse.data.data;
    
    if (!templates || templates.length === 0) {
      console.log('No templates available. Please add templates to your PandaDoc account.');
      return;
    }
    
    console.log(`Found ${templates.length} templates`);
    
    // Use the first template
    const templateId = templates[0].id;
    console.log(`Using template: ${templates[0].name} (${templateId})`);
    
    // Create a document from template
    console.log('Creating document from template...');
    const createDocResponse = await api.post('/api/integrations/pandadoc/documents/from-template', {
      name: 'Test Document for Status Endpoint',
      templateId,
      recipients: [
        {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'signer'
        }
      ],
      metadata: {
        testId: '12345'
      }
    });
    
    if (!createDocResponse.data.success) {
      console.error('Failed to create document:', createDocResponse.data.error);
      return;
    }
    
    const documentId = createDocResponse.data.data.id;
    console.log(`Document created with ID: ${documentId}`);
    
    // Test getting document status
    console.log('Fetching document status...');
    const statusResponse = await api.get(`/api/integrations/pandadoc/documents/${documentId}/status`);
    
    if (!statusResponse.data.success) {
      console.error('Failed to get document status:', statusResponse.data.error);
      return;
    }
    
    console.log('Document status successfully retrieved:');
    console.log(JSON.stringify(statusResponse.data.data, null, 2));
    
    // Also test the regular document endpoint to compare
    console.log('Fetching document details for comparison...');
    const documentResponse = await api.get(`/api/integrations/pandadoc/documents/${documentId}`);
    
    if (!documentResponse.data.success) {
      console.error('Failed to get document details:', documentResponse.data.error);
      return;
    }
    
    console.log('Document details:');
    console.log(JSON.stringify(documentResponse.data.data, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing document status endpoint:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
  }
}

// Run the test
testDocumentStatusEndpoint();