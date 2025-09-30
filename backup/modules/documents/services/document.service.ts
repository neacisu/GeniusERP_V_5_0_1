/**
 * Document Service
 * 
 * Handles document management with versioning capability, allowing for
 * storing multiple versions of document content while maintaining
 * original document metadata.
 * 
 * Enhanced capabilities:
 * - Version comparison and diff analysis
 * - Version tagging (DRAFT, FINAL, APPROVED, etc.)
 * - Version rollback
 * - Pagination for version history
 * - Improved error handling with custom error types
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, and, asc, or, between, like, inArray, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../../../../shared/schema';
import { documents, documentVersions, documentRelations, documentVersionRelations } from '../../../../shared/schema';
import type { 
  Document, 
  DocumentVersion, 
  InsertDocument, 
  InsertDocumentVersion,
  InsertTaggedDocumentVersion
} from '../../../../shared/schema';

/**
 * Custom error classes for better error handling
 */
export class DocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentError';
  }
}

export class DocumentNotFoundError extends DocumentError {
  constructor(documentId: string) {
    super(`Document with ID ${documentId} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class VersionNotFoundError extends DocumentError {
  constructor(documentId: string, versionNumber: number) {
    super(`Version ${versionNumber} of document ${documentId} not found`);
    this.name = 'VersionNotFoundError';
  }
}

export class DatabaseConnectionError extends DocumentError {
  constructor(message: string) {
    super(`Database connection error: ${message}`);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Service for managing documents with version control
 * Enhanced with version tagging, pagination, rollback and improved error handling
 */
export class DocumentService {
  private db: ReturnType<typeof drizzle>;
  private queryClient: ReturnType<typeof postgres>;

  /**
   * Valid document version tag values
   */
  readonly VERSION_TAGS = {
    DRAFT: 'DRAFT',
    REVIEW: 'REVIEW',
    APPROVED: 'APPROVED', 
    FINAL: 'FINAL',
    ARCHIVED: 'ARCHIVED',
    REJECTED: 'REJECTED',
    PUBLISHED: 'PUBLISHED'
  } as const;

  constructor() {
    const connectionString = process.env.DATABASE_URL as string;
    
    if (!connectionString) {
      console.error('[DocumentService] 🚨 Missing DATABASE_URL in environment');
      throw new DatabaseConnectionError('Database connection string is missing');
    }

    try {
      this.queryClient = postgres(connectionString);
      this.db = drizzle(this.queryClient, { schema });
      console.log('[DocumentService] 📄 Service initialized');
    } catch (error: any) {
      console.error('[DocumentService] 🚨 Failed to initialize database connection:', error.message);
      throw new DatabaseConnectionError(error.message);
    }
  }

  /**
   * Create a new document with initial version
   */
  async createDocument(
    documentData: InsertDocument,
    content: string,
    initialTag?: keyof typeof this.VERSION_TAGS
  ): Promise<{ document: Document, version: DocumentVersion }> {
    console.log(`[DocumentService] 📄 Creating new document of type: ${documentData.type}`);
    
    try {
      // Validate initial tag if provided
      if (initialTag && !Object.keys(this.VERSION_TAGS).includes(initialTag)) {
        const validTags = Object.keys(this.VERSION_TAGS).join(', ');
        throw new DocumentError(`Invalid tag: ${initialTag}. Valid tags are: ${validTags}`);
      }
      
      // First create the document
      const [document] = await this.db.insert(documents)
        .values(documentData)
        .returning();
      
      // Then create the initial version (always version 1)
      const initialVersion: InsertTaggedDocumentVersion = {
        documentId: document.id,
        content,
        version: 1,
        tag: initialTag ? this.VERSION_TAGS[initialTag] : this.VERSION_TAGS.DRAFT,
        changeDescription: 'Initial version'
      };
      
      const [version] = await this.db.insert(documentVersions)
        .values(initialVersion)
        .returning();
      
      console.log(`[DocumentService] ✅ Created document ID: ${document.id} with initial version`);
      
      return { document, version };
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error('[DocumentService] ❌ Failed to create document:', error.message);
      throw new DocumentError(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Add a new version to an existing document
   */
  async addDocumentVersion(
    documentId: string,
    content: string,
    tag?: string,
    changeDescription?: string
  ): Promise<DocumentVersion> {
    console.log(`[DocumentService] 📝 Adding new version to document: ${documentId}`);
    
    try {
      // Get the current document to verify it exists
      const document = await this.getDocumentById(documentId);
      
      if (!document) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // Find the highest version number for this document - using direct query instead of relations
      const versions = await this.db.select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.version))
        .limit(1);
      
      const latestVersion = versions.length > 0 ? versions[0] : null;
      
      // Calculate the new version number
      const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;
      
      // Insert the new version with optional tag and change description
      const newVersion: InsertTaggedDocumentVersion = {
        documentId,
        content,
        version: newVersionNumber,
        tag, 
        changeDescription
      };
      
      const [version] = await this.db.insert(documentVersions)
        .values(newVersion)
        .returning();
      
      // Update the document's updatedAt timestamp
      await this.db.update(documents)
        .set({ updatedAt: new Date() })
        .where(eq(documents.id, documentId));
      
      console.log(`[DocumentService] ✅ Added version ${newVersionNumber} to document: ${documentId}`);
      
      return version;
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to add version to document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to add document version: ${error.message}`);
    }
  }
  
  /**
   * Add a tagged version to a document
   * This is a convenience method that adds a new version with a tag
   */
  async addTaggedVersion(
    documentId: string,
    content: string,
    tag: keyof typeof this.VERSION_TAGS,
    changeDescription?: string
  ): Promise<DocumentVersion> {
    console.log(`[DocumentService] 🏷️ Adding tagged version (${tag}) to document: ${documentId}`);
    
    // Validate the tag
    if (!Object.keys(this.VERSION_TAGS).includes(tag)) {
      const validTags = Object.keys(this.VERSION_TAGS).join(', ');
      throw new DocumentError(`Invalid tag: ${tag}. Valid tags are: ${validTags}`);
    }
    
    return this.addDocumentVersion(documentId, content, this.VERSION_TAGS[tag], changeDescription);
  }

  /**
   * Get document by ID with optional version details
   */
  async getDocumentById(
    documentId: string,
    includeVersions: boolean = false,
    page: number = 1,
    pageSize: number = 10
  ): Promise<Document & { versions?: DocumentVersion[], totalVersions?: number }> {
    console.log(`[DocumentService] 🔍 Fetching document: ${documentId}`);
    
    try {
      // Get the document
      const [documentResult] = await this.db.select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (!documentResult) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // If versions are needed, get them separately with pagination
      if (includeVersions) {
        // Calculate pagination values
        const offset = (page - 1) * pageSize;
        
        // Count total versions for pagination info
        const [{ count }] = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(documentVersions)
          .where(eq(documentVersions.documentId, documentId));
        
        // Get paginated versions
        const versions = await this.db.select()
          .from(documentVersions)
          .where(eq(documentVersions.documentId, documentId))
          .orderBy(desc(documentVersions.version)) // Latest versions first
          .limit(pageSize)
          .offset(offset);
        
        const result = {
          ...documentResult,
          versions,
          totalVersions: Number(count)
        };
        
        console.log(`[DocumentService] ✅ Found document with ${count} total versions (showing page ${page})`);
        return result;
      } else {
        console.log(`[DocumentService] ✅ Found document: ${documentResult.id}`);
        return { ...documentResult, versions: [] };
      }
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to fetch document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to fetch document: ${error.message}`);
    }
  }

  /**
   * Get a specific version of a document
   */
  async getDocumentVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion> {
    console.log(`[DocumentService] 🔍 Fetching version ${versionNumber} of document: ${documentId}`);
    
    try {
      // First check if document exists
      const documentExists = await this.db.select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (documentExists.length === 0) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // Then get the version
      const [version] = await this.db.select()
        .from(documentVersions)
        .where(and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.version, versionNumber)
        ))
        .limit(1);
      
      if (!version) {
        throw new VersionNotFoundError(documentId, versionNumber);
      }
      
      console.log(`[DocumentService] ✅ Found document version ${versionNumber}`);
      return version;
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to fetch version ${versionNumber} of document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to fetch document version: ${error.message}`);
    }
  }

  /**
   * Get the latest version of a document
   */
  async getLatestDocumentVersion(documentId: string): Promise<DocumentVersion> {
    console.log(`[DocumentService] 🔍 Fetching latest version of document: ${documentId}`);
    
    try {
      // First check if document exists
      const documentExists = await this.db.select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (documentExists.length === 0) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // Then get the latest version
      const [version] = await this.db.select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.version))
        .limit(1);
      
      if (!version) {
        throw new DocumentError(`No versions found for document ${documentId}`);
      }
      
      console.log(`[DocumentService] ✅ Found latest version ${version.version} of document ${documentId}`);
      return version;
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to fetch latest version of document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to fetch latest document version: ${error.message}`);
    }
  }
  
  /**
   * Get document versions by tag
   * Useful for finding all versions with a specific status (e.g., all APPROVED versions)
   */
  async getDocumentVersionsByTag(
    documentId: string,
    tag: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ versions: DocumentVersion[], total: number }> {
    console.log(`[DocumentService] 🔍 Fetching versions with tag "${tag}" for document: ${documentId}`);
    
    try {
      // First check if document exists
      const documentExists = await this.db.select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (documentExists.length === 0) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // Calculate pagination
      const offset = (page - 1) * pageSize;
      
      // Count total matching versions for pagination info
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(documentVersions)
        .where(and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.tag, tag)
        ));
      
      // Get the versions with the specified tag
      const versions = await this.db.select()
        .from(documentVersions)
        .where(and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.tag, tag)
        ))
        .orderBy(desc(documentVersions.version))
        .limit(pageSize)
        .offset(offset);
      
      console.log(`[DocumentService] ✅ Found ${count} versions with tag "${tag}" for document ${documentId}`);
      return { 
        versions, 
        total: Number(count) 
      };
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to fetch versions with tag "${tag}" for document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to fetch document versions by tag: ${error.message}`);
    }
  }

  /**
   * List documents with optional filtering
   */
  async listDocuments(
    companyId: string,
    type?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ documents: Document[], total: number }> {
    console.log(`[DocumentService] 📋 Listing documents for company: ${companyId}`);
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Count total documents for pagination information
      const countQuery = this.queryClient`
        SELECT COUNT(*) as count
        FROM documents
        WHERE company_id = ${companyId}
        ${type ? this.queryClient`AND type = ${type}` : this.queryClient``}
      `;
      
      const [countResult] = await countQuery;
      const totalCount = Number(countResult.count);
      
      // Build and execute the main query with pagination
      const query = this.queryClient`
        SELECT *
        FROM documents
        WHERE company_id = ${companyId}
        ${type ? this.queryClient`AND type = ${type}` : this.queryClient``}
        ORDER BY created_at DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;
      
      const rawResults = await query;
      
      // Map SQL results to Document type
      const documents = rawResults.map(row => ({
        id: row.id,
        type: row.type,
        companyId: row.company_id,
        franchiseId: row.franchise_id,
        filePath: row.file_path,
        ocrText: row.ocr_text,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log(`[DocumentService] ✅ Found ${documents.length} documents (page ${page} of ${Math.ceil(totalCount / pageSize)})`);
      return { 
        documents, 
        total: totalCount 
      };
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to list documents for company ${companyId}:`, error.message);
      throw new DocumentError(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Search documents by content or metadata
   */
  async searchDocuments(
    companyId: string,
    searchTerm: string,
    page: number = 1, 
    pageSize: number = 50
  ): Promise<{ documents: Document[], total: number }> {
    console.log(`[DocumentService] 🔍 Searching documents for company ${companyId} with term: "${searchTerm}"`);
    
    try {
      const offset = (page - 1) * pageSize;
      const searchPattern = `%${searchTerm}%`;
      
      // Count total matching documents for pagination information
      const countQuery = this.queryClient`
        SELECT COUNT(DISTINCT d.id) as count
        FROM documents d
        LEFT JOIN document_versions dv ON d.id = dv.document_id
        WHERE d.company_id = ${companyId}
        AND (
          d.type ILIKE ${searchPattern}
          OR d.ocr_text ILIKE ${searchPattern}
          OR dv.content ILIKE ${searchPattern}
          OR dv.tag ILIKE ${searchPattern}
          OR dv.change_description ILIKE ${searchPattern}
        )
      `;
      
      const [countResult] = await countQuery;
      const totalCount = Number(countResult.count);
      
      // Build and execute the main search query with pagination
      const query = this.queryClient`
        SELECT DISTINCT d.*
        FROM documents d
        LEFT JOIN document_versions dv ON d.id = dv.document_id
        WHERE d.company_id = ${companyId}
        AND (
          d.type ILIKE ${searchPattern}
          OR d.ocr_text ILIKE ${searchPattern}
          OR dv.content ILIKE ${searchPattern}
          OR dv.tag ILIKE ${searchPattern}
          OR dv.change_description ILIKE ${searchPattern}
        )
        ORDER BY d.created_at DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;
      
      const rawResults = await query;
      
      // Map SQL results to Document type
      const documents = rawResults.map(row => ({
        id: row.id,
        type: row.type,
        companyId: row.company_id,
        franchiseId: row.franchise_id,
        filePath: row.file_path,
        ocrText: row.ocr_text,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      console.log(`[DocumentService] ✅ Found ${totalCount} matching documents for search term "${searchTerm}"`);
      return { 
        documents, 
        total: totalCount 
      };
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to search documents for company ${companyId}:`, error.message);
      throw new DocumentError(`Failed to search documents: ${error.message}`);
    }
  }

  /**
   * Delete a document and all its versions
   */
  async deleteDocument(documentId: string): Promise<void> {
    console.log(`[DocumentService] 🗑️ Deleting document: ${documentId}`);
    
    try {
      // First check if document exists
      const documentExists = await this.db.select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      if (documentExists.length === 0) {
        throw new DocumentNotFoundError(documentId);
      }
      
      // First delete all versions
      await this.db.delete(documentVersions)
        .where(eq(documentVersions.documentId, documentId));
      
      // Then delete the document
      await this.db.delete(documents)
        .where(eq(documents.id, documentId));
      
      console.log(`[DocumentService] ✅ Document ${documentId} and all its versions deleted`);
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to delete document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Update document metadata (not the content)
   */
  async updateDocumentMetadata(
    documentId: string,
    updates: Partial<InsertDocument>
  ): Promise<Document> {
    console.log(`[DocumentService] 📝 Updating metadata for document: ${documentId}`);
    
    try {
      const [updatedDocument] = await this.db.update(documents)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(documents.id, documentId))
        .returning();
      
      if (!updatedDocument) {
        throw new DocumentNotFoundError(documentId);
      }
      
      console.log(`[DocumentService] ✅ Updated document metadata for: ${documentId}`);
      return updatedDocument;
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to update document ${documentId}:`, error.message);
      throw new DocumentError(`Failed to update document metadata: ${error.message}`);
    }
  }

  /**
   * Rollback a document to a previous version by creating a new version with the content from the target version
   * 
   * @param documentId - The document ID to rollback
   * @param targetVersionNumber - The version number to rollback to
   * @returns The new version that was created (which contains the content from the target version)
   */
  async rollbackToVersion(
    documentId: string,
    targetVersionNumber: number
  ): Promise<DocumentVersion> {
    console.log(`[DocumentService] 🔄 Rolling back document ${documentId} to version ${targetVersionNumber}`);
    
    try {
      // Get the target version
      const targetVersion = await this.getDocumentVersion(documentId, targetVersionNumber);
      if (!targetVersion) {
        throw new VersionNotFoundError(documentId, targetVersionNumber);
      }
      
      // Create a new version with the content from the target version
      const newVersion = await this.addDocumentVersion(
        documentId, 
        targetVersion.content,
        'ROLLBACK',
        `Rollback to version ${targetVersionNumber}`
      );
      
      console.log(`[DocumentService] ✅ Rolled back document ${documentId} to version ${targetVersionNumber} (created new version ${newVersion.version})`);
      return newVersion;
    } catch (error: any) {
      if (error instanceof DocumentError) {
        throw error;
      }
      console.error(`[DocumentService] ❌ Failed to rollback document ${documentId} to version ${targetVersionNumber}:`, error.message);
      throw new DocumentError(`Failed to rollback document: ${error.message}`);
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();