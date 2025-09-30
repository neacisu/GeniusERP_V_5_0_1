# Document Versioning System

This module implements advanced document version control with history tracking, tagging, and rollback capabilities.

## Overview

The Document Versioning System allows for storing multiple versions of a document's content while maintaining the original document metadata. It provides a comprehensive API for managing document versions with the following capabilities:

- Version comparison and diff analysis
- Version tagging (DRAFT, FINAL, APPROVED, etc.)
- Version rollback
- Pagination for version history
- Improved error handling with custom error types

## Database Schema

The system is built on two primary tables:

1. **documents** - Stores document metadata (type, company, path, etc.)
2. **document_versions** - Stores versioned content with versioning metadata

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  type VARCHAR NOT NULL, 
  company_id UUID NOT NULL REFERENCES companies(id),
  franchise_id UUID NULL,
  file_path VARCHAR NOT NULL,
  ocr_text TEXT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE document_versions (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL,
  tag VARCHAR(50) NULL,
  label VARCHAR(100) NULL,
  change_description TEXT NULL,
  created_at TIMESTAMP NOT NULL
);
```

## Core Functionality

### Document Creation with Initial Version

```typescript
const { document, version } = await documentService.createDocument(
  documentData,
  "Initial document content",
  "DRAFT" // Optional tag
);
```

### Adding New Versions

```typescript
// Standard version
const newVersion = await documentService.addDocumentVersion(
  documentId,
  "Updated document content",
  "REVIEW", // Optional tag
  "Added more information" // Optional change description
);

// Using convenient tagged version method
const taggedVersion = await documentService.addTaggedVersion(
  documentId,
  "This is the final content",
  "FINAL",
  "Finalized document"
);
```

### Retrieving Document Versions

```typescript
// Get document with all versions (paginated)
const documentWithVersions = await documentService.getDocumentById(documentId, true);

// Get a specific version
const specificVersion = await documentService.getDocumentVersion(documentId, 2);

// Get latest version
const latestVersion = await documentService.getLatestDocumentVersion(documentId);

// Get versions by tag
const finalVersions = await documentService.getDocumentVersionsByTag(documentId, "FINAL");
```

### Rolling Back to Previous Versions

```typescript
// Roll back to version 1 (creates a new version with content from version 1)
const rollbackVersion = await documentService.rollbackToVersion(documentId, 1);
```

### Searching and Updating

```typescript
// Search documents by company and term
const searchResults = await documentService.searchDocuments(companyId, "invoice");

// Update document metadata
const updatedDocument = await documentService.updateDocumentMetadata(documentId, {
  type: "invoice_updated",
  ocrText: "New OCR text"
});
```

### Deleting Documents

```typescript
// Delete a document and all its versions
await documentService.deleteDocument(documentId);
```

## Error Handling

The system uses custom error classes for better error handling:

- `DocumentError` - Base error class
- `DocumentNotFoundError` - Document not found
- `VersionNotFoundError` - Specific version not found
- `DatabaseConnectionError` - Database connection issues

## Integration with Other Modules

The document versioning system integrates with:

1. **Authentication System** - Documents are secured by companyId
2. **Audit System** - Document operations are tracked in the audit log
3. **Invoice Module** - Invoices can be stored as versioned documents
4. **Archive System** - Documents can be archived with full version history

## Testing

Run the document versioning tests to verify functionality:

```bash
npx tsx test-document-version-service.ts
```

## Best Practices

1. Always use the `documentService` methods for document operations to ensure proper version control
2. Use tags consistently for document workflow states
3. Provide meaningful change descriptions for better audit trails
4. Use pagination for large version histories to improve performance