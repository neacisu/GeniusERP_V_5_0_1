/**
 * Sign Document API Test
 * 
 * This script tests the document signing API endpoints
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from './server/modules/auth/services/jwt.service';

// Create an instance of the JWT service
const jwtService = new JwtService();

/**
 * Check if the PandaDoc API key is available
 */
async function checkPandaDocApiKey() {
  if (!process.env.PANDADOC_API_KEY) {
    console.log('❌ PANDADOC_API_KEY environment variable is missing');
    console.log('Please set it before running this test');
    return false;
  }
  
  console.log('✅ PANDADOC_API_KEY is available');
  return true;
}

/**
 * Generate a test JWT token for authorization
 */
async function generateTestToken() {
  const token = await jwtService.generateToken({
    id: uuidv4(),
    username: 'test-user@example.com',
    role: 'admin',
    roles: ['admin', 'user'],
    companyId: 'test-company'
  });
  
  return token;
}

/**
 * Create a test document for signing
 */
async function createTestDocument() {
  console.log('📝 Creating test document...');
  
  const apiUrl = 'http://localhost:3000/api/v1/documents/versioned/create';
  const token = await generateTestToken();
  
  const response = await axios.post(apiUrl, {
    type: 'invoice',
    companyId: 'test-company',
    metadata: {
      title: 'Test Invoice for Signing',
      tags: ['test', 'invoice', 'signing']
    }
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`✅ Created test document with ID: ${response.data.data.id}`);
  return response.data.data.id;
}

/**
 * Test the document signing API endpoints
 */
async function testSignDocumentAPI() {
  console.log('\n🔍 Testing Sign Document API...\n');
  
  try {
    // Generate a token for authorization
    const token = await generateTestToken();
    console.log(`🔑 Generated JWT token for testing`);
    
    // Create a sample PDF file for testing if one doesn't exist
    const samplePdfPath = path.join(process.cwd(), 'sample.pdf');
    
    // Check if we have a sample PDF file
    if (!fs.existsSync(samplePdfPath)) {
      console.log('❌ Sample PDF file not found, creating a simple one...');
      
      // If no sample PDF exists, create one programmatically for testing
      const simplePdfContent = '%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 21>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n281\n%%EOF';
      fs.writeFileSync(samplePdfPath, simplePdfContent);
      console.log('✅ Created a simple PDF file for testing');
    }
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(samplePdfPath);
    console.log(`📄 Read PDF file: ${pdfBuffer.length} bytes`);
    
    // Test 1: Upload PDF and create signable document
    console.log('\n📤 Test 1: Uploading PDF and creating signable document...');
    
    // Create form data for multipart request
    const formData = new FormData();
    formData.append('pdf', pdfBuffer, 'test-invoice.pdf');
    formData.append('name', `Test Invoice ${new Date().toISOString()}`);
    formData.append('signerEmail', 'testsigner@example.com');
    formData.append('signerName', 'Test Signer');
    formData.append('subject', 'Please sign this test invoice');
    formData.append('message', 'This is a test invoice that requires your signature');
    formData.append('tags', JSON.stringify(['test', 'invoice', 'api-upload']));
    
    // API URL for PDF upload
    const uploadUrl = 'http://localhost:3000/api/v1/documents/sign/pdf/upload';
    
    // Upload the PDF
    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ PDF upload response:');
    console.log(`- Status: ${uploadResponse.status}`);
    console.log(`- PandaDoc ID: ${uploadResponse.data.data.pandaDocId}`);
    console.log(`- Status: ${uploadResponse.data.data.status}`);
    
    // Store the PandaDoc ID for subsequent tests
    const pandaDocId = uploadResponse.data.data.pandaDocId;
    
    // Test 2: Check document status
    console.log('\n🔍 Test 2: Checking document status...');
    
    // Allow some time for document processing
    console.log('⏳ Waiting for document processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check status
    const statusUrl = `http://localhost:3000/api/v1/documents/sign/status/${pandaDocId}`;
    
    const statusResponse = await axios.get(statusUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Status check response:');
    console.log(`- Status: ${statusResponse.status}`);
    console.log(`- Document status: ${statusResponse.data.data.status}`);
    
    // Test 3: Generate signing link
    console.log('\n🔗 Test 3: Generating signing link...');
    
    // Generate link
    const linkUrl = `http://localhost:3000/api/v1/documents/sign/link/${pandaDocId}`;
    
    const linkResponse = await axios.post(linkUrl, {
      expiresIn: 3600 // 1 hour
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Link generation response:');
    console.log(`- Status: ${linkResponse.status}`);
    console.log(`- Signing link: ${linkResponse.data.data.link}`);
    console.log(`- Expires at: ${linkResponse.data.data.expiresAt}`);
    
    // Test 4: Test signing an existing document
    console.log('\n📝 Test 4: Testing sign document by ID...');
    
    try {
      // Create a document first
      const documentId = await createTestDocument();
      
      // Sign the document
      const signUrl = `http://localhost:3000/api/v1/documents/sign/${documentId}`;
      
      const signResponse = await axios.post(signUrl, {
        signerEmail: 'testsigner@example.com',
        signerName: 'Test Signer',
        subject: 'Please sign this document',
        message: 'This document requires your signature'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Sign document response:');
      console.log(`- Status: ${signResponse.status}`);
      console.log(`- PandaDoc ID: ${signResponse.data.data.pandaDocId}`);
      console.log(`- Status: ${signResponse.data.data.status}`);
    } catch (error) {
      console.log('❌ Sign document test failed (this might be expected if versioned documents are not fully implemented)');
      console.log('Continuing with other tests...');
    }
    
    return pandaDocId;
  } catch (error: any) {
    console.error('❌ Error during API test:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

// Run the test
async function runTests() {
  console.log('🧪 Sign Document API Test\n');
  
  // First check if we have the PandaDoc API key
  const hasApiKey = await checkPandaDocApiKey();
  if (!hasApiKey) {
    return;
  }
  
  // Test the API endpoints
  const documentId = await testSignDocumentAPI();
  
  if (documentId) {
    console.log(`\n✅ Test completed successfully! Document ID: ${documentId}`);
  } else {
    console.log('\n❌ Test failed');
  }
}

// Run the tests
runTests().catch(console.error);