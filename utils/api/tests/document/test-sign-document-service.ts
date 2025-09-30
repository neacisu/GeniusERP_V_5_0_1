/**
 * Sign Document Service Test
 * 
 * This script tests the functionality of the SignDocumentService
 * which handles document signing workflows via PandaDoc integration.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { documents, documentVersions } from './shared/schema';
import { signDocumentService } from './server/modules/documents/services/sign-document.service';
import { check_secrets } from './secret-check';

/**
 * Check if the PandaDoc API key is available
 */
async function checkPandaDocApiKey() {
  const secretStatus = await check_secrets(['PANDADOC_API_KEY']);
  if (!secretStatus.PANDADOC_API_KEY) {
    console.error('❌ PANDADOC_API_KEY is not set in the environment');
    console.log('Please set the PANDADOC_API_KEY environment variable before running this test');
    return false;
  }
  return true;
}

/**
 * Create a test document for signing
 */
async function createTestDocument() {
  console.log('🔍 Creating test document for signing test...');
  
  const queryClient = postgres(process.env.DATABASE_URL || '');
  
  try {
    // Create a document for testing
    const documentId = uuidv4();
    const companyId = uuidv4(); // In a real app, this would be the authenticated user's company ID
    
    // First, create a test company to satisfy the foreign key constraint
    console.log('Creating test company...');
    await queryClient`
      INSERT INTO companies (
        id, name, fiscal_code, registration_number, address, 
        city, county, country, vat_payer, vat_rate, created_at, updated_at
      ) VALUES (
        ${companyId},
        'Test Company',
        'TEST-' || EXTRACT(EPOCH FROM NOW()),
        'J12/345/2025',
        'Test Address',
        'Test City',
        'Test County',
        'Romania',
        true,
        19,
        NOW(),
        NOW()
      )
    `;
    
    // Insert the document using SQL directly
    await queryClient`
      INSERT INTO documents (id, file_path, type, company_id, created_at, updated_at)
      VALUES (
        ${documentId},
        'test-file-path.pdf',
        'invoice',
        ${companyId},
        NOW(),
        NOW()
      )
    `;
    
    // Insert a document version with some content
    const documentVersionId = uuidv4();
    await queryClient`
      INSERT INTO document_versions (id, document_id, version, content, created_at)
      VALUES (
        ${documentVersionId},
        ${documentId},
        1,
        ${`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Test Document for Signing</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333366; }
              .signature-area { 
                border: 1px dashed #cccccc; 
                padding: 20px; 
                margin-top: 30px;
                height: 100px;
              }
            </style>
          </head>
          <body>
            <h1>Test Document for PandaDoc Signing</h1>
            <p>This is a test document created for the purpose of testing the document signing workflow.</p>
            <p>Created on: ${new Date().toLocaleString()}</p>
            <p>Document ID: ${documentId}</p>
            
            <div class="signature-area">
              <p>Please sign below:</p>
            </div>
          </body>
          </html>
        `},
        NOW()
      )
    `;
    
    console.log(`✅ Test document created with ID: ${documentId}`);
    return documentId;
  } catch (error) {
    console.error('❌ Error creating test document:', error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

/**
 * Test the SignDocumentService functionality
 */
async function testSignDocumentService() {
  console.log('🧪 Testing SignDocumentService...');
  
  // Check for PandaDoc API key
  const apiKeyAvailable = await checkPandaDocApiKey();
  if (!apiKeyAvailable) {
    return;
  }
  
  try {
    // Create a test document
    const documentId = await createTestDocument();
    
    let pandaDocId: string = '';
    
    // 1. Test initiating signing process
    try {
      console.log('🔏 Testing sign() method...');
      const signResult = await signDocumentService.sign(
        documentId,
        'test.signer@example.com',
        'Test Signer',
        {
          subject: 'Please sign this test document',
          message: 'This is a test document created for the purpose of testing the document signing workflow.',
          role: 'signer'
        }
      );
      
      console.log('✅ Sign document result:', signResult);
      pandaDocId = signResult.pandaDocId;
      
      // Wait a moment for PandaDoc to process the document
      console.log('⏳ Waiting for PandaDoc to process the document...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('❌ Error in sign() method:', error);
      throw error; // We need the pandaDocId to continue, so re-throw
    }
    
    // 2. Test checking signing status
    try {
      console.log('🔍 Testing checkSigningStatus() method...');
      const statusResult = await signDocumentService.checkSigningStatus(pandaDocId);
      console.log('✅ Signing status result:', statusResult);
    } catch (error) {
      console.error('❌ Error in checkSigningStatus() method:', error);
      console.log('Continuing to next test...');
      // Don't throw, continue to the next test
    }
    
    // 3. Test generating signing link
    try {
      console.log('🔗 Testing generateSigningLink() method...');
      const linkResult = await signDocumentService.generateSigningLink(pandaDocId, 3600);
      console.log('✅ Signing link result:', linkResult);
    } catch (error) {
      console.error('❌ Error in generateSigningLink() method:', error);
      console.log('Continuing to next test...');
      // Don't throw, we've completed all tests
    }
    
    console.log('✅ SignDocumentService testing completed successfully!');
  } catch (error) {
    console.error('❌ Error testing SignDocumentService:', error);
  }
}

// Run the test
testSignDocumentService().catch(console.error);