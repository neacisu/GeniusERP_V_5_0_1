/**
 * Test Script for Sign Document Service with PDF Upload
 * 
 * This script tests the SignDocumentService's enhanced capability to
 * create and send documents directly from PDF content.
 */

import fs from 'fs';
import path from 'path';
import { signDocumentService } from './server/modules/documents/services/sign-document.service';

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
 * Test the PDF document signing workflow
 */
async function testPdfSigningWorkflow() {
  console.log('\n🔍 Testing PDF signing workflow via SignDocumentService...\n');
  
  try {
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
    
    // Read the PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(samplePdfPath);
    const base64Content = pdfBuffer.toString('base64');
    
    console.log(`📄 Read PDF file: ${pdfBuffer.length} bytes`);
    
    // Create a document from the PDF content
    console.log('📤 Creating and signing document with PDF content...');
    const result = await signDocumentService.createFromPdf(
      `Test Invoice ${new Date().toISOString()}`,
      base64Content,
      'testsigner@example.com',
      'Test Signer',
      {
        subject: 'Please sign this test invoice',
        message: 'This is a test invoice that requires your signature',
        fileName: 'test-invoice.pdf',
        tags: ['test', 'invoice', 'pdf-upload']
      }
    );
    
    console.log('✅ Document created and sent for signing successfully!');
    console.log('📝 Document details:');
    console.log(`- PandaDoc ID: ${result.pandaDocId}`);
    console.log(`- Status: ${result.status}`);
    console.log(`- Sent At: ${result.sentAt}`);
    
    // Wait a few seconds for document processing
    console.log('⏳ Waiting for document processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the status of the document
    const statusResult = await signDocumentService.checkSigningStatus(result.pandaDocId);
    console.log(`📊 Current document status: ${statusResult.status}`);
    
    // Generate a signing link
    const linkResult = await signDocumentService.generateSigningLink(result.pandaDocId);
    console.log(`🔗 Document signing link: ${linkResult.link}`);
    console.log(`⏱️ Link expires at: ${linkResult.expiresAt}`);
    
    return result.pandaDocId;
  } catch (error) {
    console.error('❌ Error during PDF signing test:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Sign Document Service PDF Upload Test\n');
  
  // First check if we have the PandaDoc API key
  const hasApiKey = await checkPandaDocApiKey();
  if (!hasApiKey) {
    return;
  }
  
  // Test PDF signing workflow
  const documentId = await testPdfSigningWorkflow();
  
  if (documentId) {
    console.log(`\n✅ Test completed successfully! Document ID: ${documentId}`);
  } else {
    console.log('\n❌ Test failed');
  }
}

// Run the tests
runTests().catch(console.error);