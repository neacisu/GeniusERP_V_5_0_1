/**
 * Document Versioning Service Test
 * 
 * This script tests the DocumentService which provides functionality for
 * managing documents with version control.
 */

import { documentService } from './server/modules/documents/services/document.service';

/**
 * Test the document versioning service
 */
async function testDocumentVersioningService() {
  console.log('🧪 Testing DocumentService for document version management...');
  
  try {
    // 1. Create a document with initial version
    console.log('\n📄 Creating new document with initial version...');
    const initialContent = '<html><body><h1>Invoice Template - Version 1</h1></body></html>';
    
    const { document, version } = await documentService.createDocument(
      {
        companyId: '7196288d-7314-4512-8b67-2c82449b5465', // Demo company
        filePath: '/documents/test-invoice-template.html',
        type: 'INVOICE_TEMPLATE',
        ocrText: 'Test OCR text for invoice template'
      },
      initialContent
    );
    
    console.log(`✅ Document created: ${document.id}`);
    console.log(`✅ Initial version created: ${version.id} (v${version.version})`);
    
    // 2. Add a second version
    console.log('\n📝 Adding second version to document...');
    const updatedContent = '<html><body><h1>Invoice Template - Version 2</h1><p>Updated with new fields</p></body></html>';
    
    const secondVersion = await documentService.addDocumentVersion(document.id, updatedContent);
    console.log(`✅ Second version created: ${secondVersion.id} (v${secondVersion.version})`);
    
    // 3. Retrieve the document with all versions
    console.log('\n🔍 Retrieving document with all versions...');
    const retrievedDocument = await documentService.getDocumentById(document.id, true);
    
    console.log(`✅ Document retrieved: ${retrievedDocument.id}`);
    console.log(`✅ Document has ${retrievedDocument.versions?.length || 0} versions`);
    
    if (retrievedDocument.versions) {
      retrievedDocument.versions.forEach(v => {
        console.log(`  - Version ${v.version}, created: ${v.createdAt}`);
        console.log(`    Content length: ${v.content.length} characters`);
      });
    }
    
    // 4. Retrieve a specific version
    console.log('\n🔍 Retrieving specific version (v2)...');
    const specificVersion = await documentService.getDocumentVersion(document.id, 2);
    console.log(`✅ Retrieved version ${specificVersion.version} of document ${document.id}`);
    console.log(`  Content length: ${specificVersion.content.length} characters`);
    
    // 5. Get the latest version
    console.log('\n🔍 Retrieving latest version...');
    const latestVersion = await documentService.getLatestDocumentVersion(document.id);
    console.log(`✅ Latest version is v${latestVersion.version}`);
    
    // 6. Update document metadata
    console.log('\n📝 Updating document metadata...');
    const updatedDocument = await documentService.updateDocumentMetadata(document.id, {
      filePath: '/documents/renamed-invoice-template.html',
      type: 'INVOICE_TEMPLATE_UPDATED'
    });
    
    console.log(`✅ Document metadata updated`);
    console.log(`  New file path: ${updatedDocument.filePath}`);
    console.log(`  New type: ${updatedDocument.type}`);
    
    // 7. List documents
    console.log('\n📋 Listing documents for company...');
    const documents = await documentService.listDocuments(
      '7196288d-7314-4512-8b67-2c82449b5465',
      'INVOICE_TEMPLATE_UPDATED'
    );
    
    console.log(`✅ Found ${documents.length} documents with type INVOICE_TEMPLATE_UPDATED`);
    
    // 8. Clean up - delete the document
    console.log('\n🧹 Cleaning up - deleting test document and all versions...');
    await documentService.deleteDocument(document.id);
    
    console.log('✅ Test document and all versions deleted');
    console.log('\n🎉 DocumentService testing completed successfully');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testDocumentVersioningService().catch(console.error);