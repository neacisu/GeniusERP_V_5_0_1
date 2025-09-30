/**
 * PandaDoc PDF Upload Test
 * 
 * This script tests the enhanced PandaDoc integration with direct PDF content upload capability.
 */

import fs from 'fs';
import path from 'path';
import { pandaDocService } from './server/modules/documents/services/pandadoc.service';

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
 * Test the PDF content upload functionality
 */
async function testPdfContentUpload() {
  console.log('\n🔍 Testing PDF content upload via PandaDoc API...\n');
  
  try {
    // List available templates first as a simple connectivity test
    const templates = await pandaDocService.listTemplates();
    console.log(`Found ${templates.length} templates`);
    
    // Read a sample PDF file and convert to base64
    // For testing purposes, we could use a very simple PDF
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
    
    // Create document options
    const documentOptions = {
      name: `Test PDF Upload ${new Date().toISOString()}`,
      recipients: [
        {
          email: 'recipient@example.com',
          firstName: 'Test',
          lastName: 'Recipient',
          role: 'signer'
        }
      ]
    };
    
    // Create content options 
    const contentOptions = {
      content: base64Content,
      fileName: 'test-document.pdf',
      fileType: 'application/pdf'
    };
    
    // Create a document with the PDF content
    console.log('📤 Creating document with PDF content...');
    const document = await pandaDocService.createDocumentFromContent(documentOptions, contentOptions);
    
    console.log('✅ Document created successfully!');
    console.log('📝 Document details:');
    console.log(`- ID: ${document.id}`);
    console.log(`- Name: ${document.name}`);
    console.log(`- Status: ${document.status}`);
    
    // Wait a few seconds for document processing
    console.log('⏳ Waiting for document processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check the document status
    const status = await pandaDocService.getDocument(document.id);
    console.log(`📊 Current document status: ${status.status}`);
    
    // Share link can be generated once the document is ready
    if (status.status !== 'document.draft') {
      console.log('⚠️ Document not in draft status, skipping share link generation');
      return;
    }
    
    // Create a share link
    const shareLink = await pandaDocService.createShareLink(document.id);
    console.log(`🔗 Document share link: ${shareLink.link}`);
    
    return document.id;
  } catch (error) {
    console.error('❌ Error during PDF upload test:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 PandaDoc PDF Upload Test\n');
  
  // First check if we have the PandaDoc API key
  const hasApiKey = await checkPandaDocApiKey();
  if (!hasApiKey) {
    return;
  }
  
  // Test PDF content upload
  const documentId = await testPdfContentUpload();
  
  if (documentId) {
    console.log(`\n✅ Test completed successfully! Document ID: ${documentId}`);
  } else {
    console.log('\n❌ Test failed');
  }
}

// Run the tests
runTests().catch(console.error);