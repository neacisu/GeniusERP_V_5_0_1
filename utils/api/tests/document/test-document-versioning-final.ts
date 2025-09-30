/**
 * Final Document Versioning System Test
 * 
 * This script tests the document versioning functionality after completion.
 */

import { documentService } from './server/modules/documents/services/document.service';
import { v4 as uuidv4 } from 'uuid';

async function testDocumentVersioningSystem() {
  console.log('📄 Testing Document Versioning System');
  
  try {
    // Use the existing company ID from the database
    const companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // GeniusERP Demo Company
    
    const documentData = {
      type: 'CONTRACT',
      companyId,
      franchiseId: null,
      filePath: `/virtual/documents/${uuidv4()}.pdf`,
      ocrText: 'This is a sample contract document for testing versioning.'
    };
    
    const initialContent = JSON.stringify({
      title: 'Service Contract',
      parties: {
        provider: 'Romanian Accounting ERP SRL',
        client: 'Test Client SRL'
      },
      terms: {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        value: 10000,
        currency: 'RON'
      },
      version: 1,
      status: 'DRAFT'
    });
    
    console.log('\n1️⃣ Creating new document with initial version...');
    const { document, version } = await documentService.createDocument(
      documentData,
      initialContent
    );
    
    console.log(`✅ Document created with ID: ${document.id}`);
    console.log(`✅ Initial version created: ${version.version}`);
    
    // Test retrieving the document with versions
    console.log('\n2️⃣ Retrieving document with all versions...');
    const retrievedDoc = await documentService.getDocumentById(document.id, true);
    console.log(`✅ Retrieved document: ${retrievedDoc.id}`);
    console.log(`✅ Document has ${retrievedDoc.versions?.length} version(s)`);
    
    // Test adding a new version
    console.log('\n3️⃣ Adding second version to document...');
    const updatedContent = JSON.stringify({
      title: 'Service Contract - REVISED',
      parties: {
        provider: 'Romanian Accounting ERP SRL',
        client: 'Test Client SRL',
        witness: 'Accounting Authority'
      },
      terms: {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        value: 12000, // Changed value
        currency: 'RON'
      },
      version: 2,
      status: 'PENDING_APPROVAL'
    });
    
    const newVersion = await documentService.addDocumentVersion(
      document.id,
      updatedContent
    );
    
    console.log(`✅ Added version ${newVersion.version} to document`);
    
    // Test retrieving specific version
    console.log('\n4️⃣ Retrieving specific version (version 1)...');
    const version1 = await documentService.getDocumentVersion(document.id, 1);
    console.log(`✅ Retrieved version 1 of document`);
    console.log('Version 1 content sample:', JSON.parse(version1.content).status);
    
    // Test retrieving latest version
    console.log('\n5️⃣ Retrieving latest version...');
    const latestVersion = await documentService.getLatestDocumentVersion(document.id);
    console.log(`✅ Latest version is: ${latestVersion.version}`);
    console.log('Latest version content sample:', JSON.parse(latestVersion.content).status);
    
    // Test updating metadata
    console.log('\n6️⃣ Updating document metadata...');
    const updatedDoc = await documentService.updateDocumentMetadata(document.id, {
      ocrText: 'Updated OCR text with additional information about the contract.'
    });
    
    console.log(`✅ Updated document metadata, new updatedAt: ${updatedDoc.updatedAt}`);
    
    // Verify all versions still exist after metadata update
    console.log('\n7️⃣ Verifying all versions exist after metadata update...');
    const finalDoc = await documentService.getDocumentById(document.id, true);
    console.log(`✅ Document still has ${finalDoc.versions?.length} version(s)`);
    
    // List documents
    console.log('\n8️⃣ Listing documents for company...');
    const documents = await documentService.listDocuments(companyId);
    console.log(`✅ Found ${documents.length} document(s) for company`);
    
    // Clean up (optional - comment out to keep the test document)
    console.log('\n9️⃣ Cleaning up test document...');
    await documentService.deleteDocument(document.id);
    console.log(`✅ Document ${document.id} and all versions deleted`);
    
    console.log('\n✅ Document versioning system test completed successfully!');
  } catch (error: any) {
    console.error('❌ Error testing document versioning system:', error.message);
    throw error;
  }
}

// Execute the test
testDocumentVersioningSystem()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err))
  .finally(() => process.exit());