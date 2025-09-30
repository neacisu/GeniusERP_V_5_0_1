/**
 * Document API Test
 * 
 * This script tests the document API endpoints for both document versioning
 * and PandaDoc integration.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// JWT token for authentication
let token: string | null = null;

// Create an axios instance with auth header
const createClient = () => {
  if (!token) {
    throw new Error('No auth token available');
  }
  
  return axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Generate a test JWT token
async function generateTestToken() {
  try {
    console.log('🔑 Generating test JWT token...');
    
    // Execute the test-jwt-generation.js script to get a token
    const { exec } = require('child_process');
    
    return new Promise<string>((resolve, reject) => {
      exec('node test-jwt-generation.js', (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error generating token: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Token generation stderr: ${stderr}`);
          return reject(new Error(stderr));
        }
        
        // Extract token from output
        const match = stdout.match(/Token: ([^\s]+)/);
        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject(new Error('Failed to extract token from output'));
        }
      });
    });
  } catch (error) {
    console.error('Failed to generate token:', error);
    throw error;
  }
}

// Test the document versioning API
async function testDocumentVersioningAPI() {
  console.log('🧪 Testing Document Versioning API...');
  
  try {
    // Generate token for authentication
    token = await generateTestToken();
    console.log(`✅ JWT token generated`);
    
    const client = createClient();
    
    // Create a test document
    console.log('\n📄 Creating a new versioned document...');
    const createResponse = await client.post('/documents/versioned/create', {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Demo company
      filePath: `/documents/api-test-${uuidv4()}.html`,
      type: 'TEST_DOCUMENT',
      ocrText: 'OCR text for test document',
      content: '<html><body><h1>Test Document - Version 1</h1></body></html>'
    });
    
    console.log(`✅ Document created with ID: ${createResponse.data.data.document.id}`);
    const documentId = createResponse.data.data.document.id;
    
    // Add a new version
    console.log('\n📝 Adding a new version to the document...');
    const addVersionResponse = await client.post(`/documents/versioned/${documentId}/version`, {
      content: '<html><body><h1>Test Document - Version 2</h1><p>Updated content</p></body></html>'
    });
    
    console.log(`✅ New version created: ${addVersionResponse.data.data.version}`);
    
    // Get the document with versions
    console.log('\n🔍 Retrieving the document with all versions...');
    const getDocumentResponse = await client.get(`/documents/versioned/${documentId}?includeVersions=true`);
    
    const document = getDocumentResponse.data.data;
    console.log(`✅ Document retrieved: ${document.id}`);
    console.log(`  Type: ${document.type}`);
    console.log(`  File path: ${document.filePath}`);
    console.log(`  Versions: ${document.versions.length}`);
    
    // Get a specific version
    console.log('\n🔍 Retrieving a specific version (v2)...');
    const getVersionResponse = await client.get(`/documents/versioned/${documentId}/version/2`);
    
    console.log(`✅ Version retrieved: ${getVersionResponse.data.data.version}`);
    console.log(`  Content length: ${getVersionResponse.data.data.content.length} characters`);
    
    // Update document metadata
    console.log('\n📝 Updating document metadata...');
    const updateResponse = await client.patch(`/documents/versioned/${documentId}`, {
      filePath: `/documents/api-test-renamed-${uuidv4()}.html`,
      type: 'RENAMED_TEST_DOCUMENT'
    });
    
    console.log(`✅ Document updated:`);
    console.log(`  New type: ${updateResponse.data.data.type}`);
    console.log(`  New file path: ${updateResponse.data.data.filePath}`);
    
    // List documents
    console.log('\n📋 Listing documents...');
    const listResponse = await client.get(`/documents/versioned/list?companyId=7196288d-7314-4512-8b67-2c82449b5465&type=RENAMED_TEST_DOCUMENT`);
    
    console.log(`✅ Found ${listResponse.data.data.length} documents with type RENAMED_TEST_DOCUMENT`);
    
    // Delete the document
    console.log('\n🧹 Cleaning up - deleting test document...');
    const deleteResponse = await client.delete(`/documents/versioned/${documentId}`);
    
    console.log(`✅ Document deleted: ${deleteResponse.data.message}`);
    
    console.log('\n🎉 Document Versioning API test completed successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Test PandaDoc API if the secret key is available
async function testPandaDocAPI() {
  console.log('\n🧪 Testing PandaDoc API Integration...');
  
  // Check if PandaDoc API key is available
  if (!process.env.PANDADOC_API_KEY) {
    console.log('⚠️ PANDADOC_API_KEY not available, skipping PandaDoc API test');
    return false;
  }
  
  try {
    if (!token) {
      token = await generateTestToken();
      console.log(`✅ JWT token generated`);
    }
    
    const client = createClient();
    
    // List templates
    console.log('\n📋 Listing available templates...');
    const templatesResponse = await client.get('/documents/templates');
    
    const templates = templatesResponse.data.data;
    console.log(`✅ Retrieved ${templates.length} templates`);
    
    if (templates.length > 0) {
      console.log(`  First template: ${templates[0].name}`);
      
      // Create a document from template
      console.log('\n📄 Creating a document from template...');
      const createResponse = await client.post('/documents/pandadoc/create', {
        name: `Test Document ${uuidv4()}`,
        templateId: templates[0].id,
        recipients: [
          {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'Client'
          }
        ]
      });
      
      console.log(`✅ Document created with ID: ${createResponse.data.data.id}`);
      const documentId = createResponse.data.data.id;
      
      // Get document status
      console.log('\n🔍 Getting document status...');
      const statusResponse = await client.get(`/documents/pandadoc/${documentId}`);
      
      console.log(`✅ Document status: ${statusResponse.data.data.status}`);
      
      // Create share link
      console.log('\n🔗 Creating document share link...');
      const shareResponse = await client.post(`/documents/pandadoc/${documentId}/share`, {
        lifetime: 3600 // 1 hour
      });
      
      console.log(`✅ Share link created: ${shareResponse.data.data.link}`);
      
      console.log('\n🎉 PandaDoc API test completed successfully');
      return true;
    } else {
      console.log('⚠️ No templates found, skipping remaining PandaDoc tests');
      return false;
    }
  } catch (error: any) {
    console.error('❌ PandaDoc API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  try {
    let success = true;
    
    // Test document versioning API
    success = await testDocumentVersioningAPI() && success;
    
    // Test PandaDoc API
    success = await testPandaDocAPI() && success;
    
    if (success) {
      console.log('\n✅ All tests completed successfully');
    } else {
      console.log('\n⚠️ Some tests failed or were skipped');
    }
  } catch (error) {
    console.error('❌ Tests failed with error:', error);
    process.exit(1);
  }
}

// Run the test suite
runTests().catch(console.error);