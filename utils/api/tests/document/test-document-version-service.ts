/**
 * Document Versioning Service Test
 * 
 * This file tests the DocumentService with its enhanced versioning capabilities.
 * 
 * NOTE: This is a demonstration test that focuses only on document versioning functionality.
 * In a real-world scenario, you would mock the database or use a test database.
 */

import { documentService } from './server/modules/documents/services/document.service';
import { v4 as uuidv4 } from 'uuid';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function testDocumentVersioning() {
  let pgClient;
  let testCompanyId;
  
  try {
    console.log('🧪 Starting document versioning tests...');
    
    // Setup: Create a test company record to satisfy foreign key constraints
    const connectionString = process.env.DATABASE_URL as string;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable not found');
    }
    
    pgClient = postgres(connectionString);
    
    // Generate UUIDs and unique identifiers for test data
    testCompanyId = uuidv4();
    const uniqueFiscalCode = `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const uniqueRegNumber = `J${Math.floor(Math.random() * 100)}/${Math.floor(Math.random() * 1000)}/${new Date().getFullYear()}`;
    
    // Insert a test company to satisfy foreign key constraints
    console.log('🏢 Creating test company record...');
    await pgClient`
      INSERT INTO companies (
        id, 
        name, 
        fiscal_code, 
        registration_number, 
        address,
        city,
        county,
        country, 
        vat_payer,
        vat_rate,
        created_at, 
        updated_at
      )
      VALUES (
        ${testCompanyId}, 
        'Test Company', 
        ${uniqueFiscalCode}, 
        ${uniqueRegNumber}, 
        'Test Address',
        'Bucharest',
        'Sector 1',
        'Romania',
        true,
        19,
        NOW(), 
        NOW()
      )
    `;
    console.log(`✅ Created test company with ID: ${testCompanyId}`);
    
    // Create a test document with valid UUIDs
    const documentData = {
      id: uuidv4(),
      type: 'invoice',
      companyId: testCompanyId,
      franchiseId: null,
      filePath: '/test/path.pdf',
      ocrText: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Test document creation with initial version
    console.log('📄 Testing document creation with initial version...');
    const { document, version } = await documentService.createDocument(
      documentData, 
      'Initial document content',
      'DRAFT'
    );
    console.log(`✅ Document created with ID: ${document.id}`);
    console.log(`✅ Initial version created: ${version.version} with tag: ${version.tag}`);
    
    // Test adding a new version
    console.log('\n📝 Testing adding a new version...');
    const newVersion = await documentService.addDocumentVersion(
      document.id,
      'Updated document content',
      'REVIEW',
      'Added more information'
    );
    console.log(`✅ Added new version ${newVersion.version} with tag: ${newVersion.tag}`);
    
    // Test adding a tagged version using the convenience method
    console.log('\n🏷️ Testing addTaggedVersion...');
    const taggedVersion = await documentService.addTaggedVersion(
      document.id,
      'This is the final content',
      'FINAL',
      'Finalized document'
    );
    console.log(`✅ Added tagged version ${taggedVersion.version} with tag: ${taggedVersion.tag}`);
    
    // Test getting a document with all versions
    console.log('\n🔍 Testing getDocumentById with versions...');
    const documentWithVersions = await documentService.getDocumentById(document.id, true);
    console.log(`✅ Retrieved document with ${documentWithVersions.versions?.length} versions`);
    
    // Test getting a specific version
    console.log('\n🔍 Testing getDocumentVersion...');
    const specificVersion = await documentService.getDocumentVersion(document.id, 2);
    console.log(`✅ Retrieved version ${specificVersion.version} with tag: ${specificVersion.tag}`);
    
    // Test getting versions by tag
    console.log('\n🔍 Testing getDocumentVersionsByTag...');
    const finalVersions = await documentService.getDocumentVersionsByTag(document.id, 'FINAL');
    console.log(`✅ Found ${finalVersions.total} versions with FINAL tag`);
    
    // Test rollback to a specific version
    console.log('\n🔄 Testing rollbackToVersion...');
    const rollbackVersion = await documentService.rollbackToVersion(document.id, 1);
    console.log(`✅ Rolled back to version 1, created new version ${rollbackVersion.version}`);
    
    // Test searching for documents
    console.log('\n🔍 Testing searchDocuments...');
    const searchResults = await documentService.searchDocuments(testCompanyId, 'invoice');
    console.log(`✅ Found ${searchResults.total} documents matching search term`);
    
    // Test updating document metadata
    console.log('\n📝 Testing updateDocumentMetadata...');
    const updatedDocument = await documentService.updateDocumentMetadata(document.id, {
      type: 'invoice_updated',
      ocrText: 'This is OCR extracted text'
    });
    console.log(`✅ Updated document metadata: ${updatedDocument.type}`);
    
    // Delete the test document at the end
    console.log('\n🗑️ Cleaning up by deleting test document...');
    await documentService.deleteDocument(document.id);
    console.log('✅ Test document deleted');
    
    console.log('\n✅ All document versioning tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    // Cleanup: Delete the test company (cascades to delete any related data)
    if (pgClient && testCompanyId) {
      try {
        console.log('\n🧹 Cleaning up test data...');
        await pgClient`DELETE FROM companies WHERE id = ${testCompanyId}`;
        console.log('✅ Test company and related data deleted');
      } catch (cleanupError) {
        console.error('⚠️ Cleanup error:', cleanupError);
      }
      
      // Close the database connection
      await pgClient.end();
    }
  }
}

// Run the tests
testDocumentVersioning()
  .then(() => {
    console.log('✨ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during tests:', error);
    process.exit(1);
  });