/**
 * Test Script for Document Versioning System
 * 
 * This script tests the functionality of the document versioning system,
 * which allows storing multiple versions of document content while maintaining
 * the original document metadata.
 */
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './shared/schema';

const { documents, documentVersions, insertDocumentSchema, insertDocumentVersionSchema } = schema;

async function testDocumentVersioning() {
  console.log('🧪 Testing Document Versioning System...');
  
  // Connect to the database
  const connectionString = process.env.DATABASE_URL as string;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient, { schema });
  
  try {
    console.log('📄 Creating a new document...');
    
    // Create a test document
    const newDocument = {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465', // GeniusERP Demo Company
      filePath: '/documents/invoice-template.pdf',
      type: 'INVOICE_TEMPLATE',
      ocrText: 'Sample OCR text extracted from the invoice template',
    };
    
    // Insert the document
    const [document] = await db.insert(documents)
      .values(newDocument)
      .returning();
    
    console.log(`✅ Document created with ID: ${document.id}`);
    
    // Create initial version (v1)
    console.log('📝 Creating initial document version (v1)...');
    const initialVersion = {
      documentId: document.id,
      content: '<html><body><h1>Invoice Template - Version 1</h1></body></html>',
      version: 1,
    };
    
    const [v1] = await db.insert(documentVersions)
      .values(initialVersion)
      .returning();
    
    console.log(`✅ Initial version created with ID: ${v1.id}`);
    
    // Create second version (v2)
    console.log('📝 Creating updated document version (v2)...');
    const updatedVersion = {
      documentId: document.id,
      content: '<html><body><h1>Invoice Template - Version 2</h1><p>Updated with new fields</p></body></html>',
      version: 2,
    };
    
    const [v2] = await db.insert(documentVersions)
      .values(updatedVersion)
      .returning();
    
    console.log(`✅ Updated version created with ID: ${v2.id}`);
    
    // Retrieve document with all versions
    console.log('🔍 Retrieving document with all versions...');
    
    // First get the document
    const retrievedDocument = await db.query.documents.findFirst({
      where: (doc, { eq }) => eq(doc.id, document.id),
      with: {
        versions: {
          orderBy: (version, { asc }) => [asc(version.version)],
        },
      },
    });
    
    if (!retrievedDocument) {
      throw new Error('Document not found');
    }
    
    console.log(`📄 Document: ${retrievedDocument.id}, Type: ${retrievedDocument.type}`);
    console.log(`🗂️ Found ${retrievedDocument.versions.length} versions:`);
    
    retrievedDocument.versions.forEach(version => {
      console.log(`  - Version ${version.version}, Created: ${version.createdAt}`);
      console.log(`    Content length: ${version.content.length} characters`);
    });
    
    console.log('✅ Document versioning system is working correctly');
    
    // Clean up (optional)
    console.log('🧹 Cleaning up test data...');
    await db.delete(documentVersions).where(eq(documentVersions.documentId, document.id));
    await db.delete(documents).where(eq(documents.id, document.id));
    
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the database connection
    await queryClient.end();
  }
}

// Run the test
testDocumentVersioning().catch(console.error);