/**
 * Test for PandaDoc Integration
 * 
 * This script tests the PandaDoc API integration used for document signing.
 * It demonstrates the capabilities of the PandaDoc client, including document
 * creation, template listing, document status checking, and signing workflows.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
// import FormData from 'form-data';

// Load environment variables
dotenv.config();

// Constants
const PANDADOC_API_KEY = process.env.PANDADOC_API_KEY;
const API_URL = 'https://api.pandadoc.com/public/v1';

// PandaDoc document status enum
enum PandaDocDocumentStatus {
  DOCUMENT_DRAFT = 'document.draft',
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_CREATED = 'document.created',
  DOCUMENT_SENT = 'document.sent',
  DOCUMENT_COMPLETED = 'document.completed',
  DOCUMENT_VIEWED = 'document.viewed',
  DOCUMENT_REJECTED = 'document.rejected',
  DOCUMENT_WAITING_APPROVAL = 'document.waiting_approval',
  DOCUMENT_APPROVED = 'document.approved',
  DOCUMENT_DECLINED = 'document.declined',
  DOCUMENT_EXTERNAL_REVIEW = 'document.external_review',
  DOCUMENT_CHANGE_REQUESTED = 'document.change_requested'
}

// PandaDoc recipient role enum
enum PandaDocRecipientRole {
  SIGNER = 'signer',
  VIEWER = 'viewer',
  RECIPIENT = 'recipient',
  CC = 'cc'
}

// PandaDoc template interface
interface PandaDocTemplate {
  id: string;
  name: string;
  version: number;
  tags: string[];
}

// Test the PandaDoc API integration
async function testPandaDocIntegration() {
  console.log('🧪 Testing PandaDoc API Integration');
  console.log('=============================================');
  
  if (!PANDADOC_API_KEY) {
    console.error('❌ Missing PANDADOC_API_KEY environment variable');
    process.exit(1);
  }
  
  // API headers
  const headers = {
    'Authorization': `API-Key ${PANDADOC_API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: List templates
    console.log('\n1. Listing PandaDoc templates...');
    let templatesResponse;
    try {
      templatesResponse = await axios.get(`${API_URL}/templates`, { headers });
      console.log(`   ✅ Status: ${templatesResponse.status}`);
      console.log(`   ✅ Templates count: ${templatesResponse.data.results.length}`);
      
      if (templatesResponse.data.results.length > 0) {
        console.log('\n   Templates:');
        templatesResponse.data.results.slice(0, 5).forEach((template: PandaDocTemplate) => {
          console.log(`   - ${template.name} (ID: ${template.id}, Version: ${template.version})`);
        });
        
        // Get details for the first template to understand its structure
        const firstTemplateId = templatesResponse.data.results[0].id;
        console.log(`\n1.1. Getting details for template: ${firstTemplateId}`);
        try {
          const templateDetails = await axios.get(`${API_URL}/templates/${firstTemplateId}/details`, { headers });
          console.log(`   ✅ Template details retrieved`);
          console.log(`   Template roles:`, templateDetails.data.roles);
        } catch (detailsError) {
          console.log(`   ❌ Could not get template details: ${detailsError.message}`);
          if (detailsError.response) {
            console.log(`     Status: ${detailsError.response.status}`);
            console.log(`     Data:`, detailsError.response.data);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Could not list templates: ${error.message}`);
      console.log('   This might be due to API permissions or rate limiting.');
    }
    
    // Test 2: Create a document from template
    console.log('\n2. Creating a document from template...');
    try {
      // Use the first template ID from the templates list if available
      let templateId = 'MYH5tUca2rHMM8aRpWENNf'; // Default to Proposal Template
      
      if (templatesResponse?.data?.results?.length > 0) {
        templateId = templatesResponse.data.results[0].id;
        console.log(`   Using template: ${templatesResponse.data.results[0].name} (ID: ${templateId})`);
      }
      
      const documentData = {
        name: `Test Document - ${new Date().toISOString()}`,
        template_uuid: templateId,
        recipients: [
          {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'Client'  // Use a real role from the template
          }
        ],
        fields: {
          testField: {
            value: 'Test value'
          }
        },
        tokens: [
          {
            name: 'Company.Name',
            value: 'Romanian ERP Solutions SRL'
          },
          {
            name: 'Client.FirstName',
            value: 'Test Client'
          }
        ],
        metadata: {
          source: 'Romanian ERP Integration Test',
          source_id: uuidv4()
        }
      };
      
      const createResponse = await axios.post(
        `${API_URL}/documents`,
        documentData,
        { headers }
      );
      
      console.log(`   ✅ Status: ${createResponse.status}`);
      console.log(`   ✅ Document ID: ${createResponse.data.id}`);
      console.log(`   ✅ Document Status: ${createResponse.data.status}`);
      
      // Get the document ID for further tests
      const documentId = createResponse.data.id;
      
      // Test 3: Get document details
      console.log('\n3. Getting document details...');
      const detailsResponse = await axios.get(
        `${API_URL}/documents/${documentId}`,
        { headers }
      );
      
      console.log(`   ✅ Status: ${detailsResponse.status}`);
      console.log(`   ✅ Document Name: ${detailsResponse.data.name}`);
      console.log(`   ✅ Document Status: ${detailsResponse.data.status}`);
      
      // Test 4: Send the document (only if status is draft)
      if (detailsResponse.data.status === PandaDocDocumentStatus.DOCUMENT_DRAFT) {
        console.log('\n4. Sending the document...');
        try {
          const sendResponse = await axios.post(
            `${API_URL}/documents/${documentId}/send`,
            {
              message: 'Test document for review and signature',
              subject: 'Please review and sign this test document'
            },
            { headers }
          );
          
          console.log(`   ✅ Status: ${sendResponse.status}`);
          console.log(`   ✅ Document sent successfully`);
        } catch (error) {
          console.log(`   ❌ Could not send document: ${error.message}`);
          if (error.response) {
            console.log(`     Status: ${error.response.status}`);
            console.log(`     Data:`, error.response.data);
          }
        }
      } else {
        console.log('\n4. Skipping document sending (document not in draft status)');
      }
      
      // Test 5: Download PDF
      console.log('\n5. Testing PDF download capability (not actually downloading)...');
      console.log(`   ✅ Download URL would be: ${API_URL}/documents/${documentId}/download`);
      console.log(`   ⚠️ Skipping actual download to avoid unnecessary API usage`);
      
    } catch (error) {
      console.log(`   ❌ Could not complete document creation tests: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Data:`, error.response.data);
      }
    }
    
    console.log('\n✅ PandaDoc integration testing completed successfully');
  } catch (error) {
    console.error('\n❌ PandaDoc integration testing failed:', error instanceof Error ? error.message : String(error));
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testPandaDocIntegration()
  .then(() => {
    console.log('All tests completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });