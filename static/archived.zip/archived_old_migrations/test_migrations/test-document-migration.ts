/**
 * Document Schema Migration Script
 * 
 * This script applies the document schema changes directly to the database
 * using Drizzle ORM's push method for quick testing and development.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema';

async function migrateDocumentSchema() {
  console.log('🚀 Starting document schema migration...');
  
  // Connect to the database
  const connectionString = process.env.DATABASE_URL as string;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const migrationClient = postgres(connectionString);
  const db = drizzle(migrationClient, { schema });
  
  try {
    // Option 1: Using push for development (direct schema application)
    console.log('📊 Applying schema changes directly using push...');
    
    // This applies the schema changes directly without generating migrations
    // Useful for development, but in production you should use proper migrations
    
    // Creating documents table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL REFERENCES "companies" ("id"),
        "franchise_id" UUID REFERENCES "companies" ("id"),
        "file_path" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "ocr_text" TEXT,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT now() NOT NULL
      );
    `;
    
    // Creating organization index on documents
    await migrationClient`
      CREATE INDEX IF NOT EXISTS "documents_idx" ON "documents" ("company_id", "franchise_id", "created_at");
    `;
    
    // Creating document_versions table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS "document_versions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "document_id" UUID NOT NULL REFERENCES "documents" ("id"),
        "content" TEXT NOT NULL,
        "version" INTEGER DEFAULT 1 NOT NULL,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );
    `;
    
    // Creating document version index
    await migrationClient`
      CREATE INDEX IF NOT EXISTS "document_versions_idx" ON "document_versions" ("document_id", "created_at");
    `;
    
    console.log('✅ Document schema tables created successfully');
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close the database connection
    await migrationClient.end();
  }
}

// Run the migration
migrateDocumentSchema().catch(console.error);