/**
 * PandaDoc API Integration Test
 * 
 * This script tests the PandaDoc API integration.
 * You must set the PANDADOC_API_KEY environment variable before running this script.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// API key
const apiKey = process.env.PANDADOC_API_KEY;

if (!apiKey) {
  console.error('PANDADOC_API_KEY environment variable is not set');
  process.exit(1);
}

// PandaDoc API base URL
const API_URL = 'https://api.pandadoc.com/public/v1';

// Create HTTP client
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `API-Key ${apiKey}`
  }
});

/**
 * Test templates endpoint
 */
async function testListTemplates() {
  try {
    console.log('Testing list templates endpoint...');
    
    const response = await client.get('/templates');
    
    console.log(`Found ${response.data.results.length} templates`);
    
    if (response.data.results.length > 0) {
      const template = response.data.results[0];
      console.log(`First template: ${template.name} (${template.id})`);
      return template.id;
    }
    
    console.log('No templates found');
    return null;
  } catch (error) {
    console.error('Failed to list templates:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test template details endpoint
 */
async function testGetTemplate(templateId: string) {
  try {
    console.log(`\nTesting get template endpoint for ${templateId}...`);
    
    const response = await client.get(`/templates/${templateId}`);
    
    console.log(`Template details: ${response.data.name}`);
    
    // Check if recipients exists and is an array
    if (response.data.recipients && Array.isArray(response.data.recipients)) {
      console.log(`Recipients: ${response.data.recipients.length}`);
    } else {
      console.log('No recipients defined in this template');
    }
    
    return response.data;
  } catch (error) {
    console.error('Failed to get template details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test create document from template endpoint
 */
async function testCreateDocument(templateId: string) {
  try {
    console.log(`\nTesting create document from template endpoint...`);
    
    // Get template details to determine roles
    console.log('Fetching template details to determine roles...');
    const templateResponse = await client.get(`/templates/${templateId}/details`);
    
    // Check if the template has roles defined
    let roles: string[] = [];
    if (!templateResponse.data.roles || templateResponse.data.roles.length === 0) {
      console.log('Template has no roles defined, using default "client" role');
      roles = ['client'];
    } else {
      roles = templateResponse.data.roles.map(role => role.name);
      console.log(`Available roles in template: ${roles.join(', ')}`);
    }
    
    // Use the first available role or default to 'client'
    const role = roles[0] || 'client';
    
    const payload = {
      name: `Test Document ${uuidv4().substring(0, 8)}`,
      template_uuid: templateId,
      recipients: [
        {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: role
        }
      ],
      metadata: {
        test: true,
        source: 'API test script'
      }
    };
    
    console.log(`Creating document with recipient role: ${role}`);
    const response = await client.post('/documents', payload);
    
    console.log(`Document created: ${response.data.name} (${response.data.id})`);
    console.log(`Status: ${response.data.status}`);
    
    return response.data.id;
  } catch (error) {
    console.error('Failed to create document:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test get document status endpoint
 */
async function testGetDocumentStatus(documentId: string) {
  try {
    console.log(`\nTesting get document details endpoint for ${documentId}...`);
    
    // PandaDoc API doesn't have a separate status endpoint, we need to get the document details
    const response = await client.get(`/documents/${documentId}`);
    
    console.log(`Document status: ${response.data.status}`);
    
    return response.data.status;
  } catch (error) {
    console.error('Failed to get document details:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  try {
    console.log('Starting PandaDoc API tests...\n');
    
    // Test listing templates
    const templateId = await testListTemplates();
    if (!templateId) {
      console.error('Cannot continue tests without a template ID');
      return;
    }
    
    // Test getting template details
    const template = await testGetTemplate(templateId);
    if (!template) {
      console.error('Cannot continue tests without template details');
      return;
    }
    
    // Test creating a document
    const documentId = await testCreateDocument(templateId);
    if (!documentId) {
      console.error('Cannot continue tests without a document ID');
      return;
    }
    
    // Test getting document status
    await testGetDocumentStatus(documentId);
    
    console.log('\nAll PandaDoc API tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();