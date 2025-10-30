/**
 * Document Controller
 * 
 * Handles HTTP requests related to documents, providing RESTful endpoints
 * for document management operations including creating, retrieving, updating, 
 * and deleting documents as well as managing document versions.
 */

import { Request, Response } from 'express';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';
import { DocumentService } from '../services/document.service';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../common/logger';

const logger = new Logger('DocumentController');

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * Register document routes with the Express application
   */
  registerRoutes(app: any): void {
    logger.info('Registering document routes');
    
    // Document management routes
    app.post('/api/documents', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createDocument.bind(this));
    app.get('/api/documents/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getDocument.bind(this));
    app.get('/api/documents', AuthGuard.protect(JwtAuthMode.REQUIRED), this.listDocuments.bind(this));
    app.patch('/api/documents/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateDocumentMetadata.bind(this));
    app.delete('/api/documents/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.deleteDocument.bind(this));
    app.get('/api/documents/search', AuthGuard.protect(JwtAuthMode.REQUIRED), this.searchDocuments.bind(this));

    // Document version routes
    app.post('/api/documents/:id/versions', AuthGuard.protect(JwtAuthMode.REQUIRED), this.addDocumentVersion.bind(this));
    app.get('/api/documents/:id/versions/:versionNumber', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getDocumentVersion.bind(this));
    app.get('/api/documents/:id/versions', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getDocumentVersions.bind(this));
    app.post('/api/documents/:id/rollback/:versionNumber', AuthGuard.protect(JwtAuthMode.REQUIRED), this.rollbackToVersion.bind(this));
  }

  /**
   * Create a new document
   */
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, userId } = req.user as any;
      const documentData = { ...req.body, id: uuidv4(), companyId };
      
      const result = await this.documentService.createDocument(documentData, req.body.content || '');
      
      res.status(201).json(result);
    } catch (error: any) {
      logger.error(`Error creating document: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user as any;
      const includeVersions = req.query.versions === 'true';
      
      // Pass includeVersions as a boolean (third parameter)
      const document = await this.documentService.getDocumentById(id, companyId, includeVersions ? 1 : 0);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      res.json(document);
    } catch (error: any) {
      logger.error(`Error retrieving document: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * List documents with optional filtering
   */
  async listDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      const type = req.query.type as string;
      
      const result = await this.documentService.listDocuments(companyId, type, page, pageSize);
      
      res.json(result);
    } catch (error: any) {
      logger.error(`Error listing documents: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user as any;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      const updatedDocument = await this.documentService.updateDocumentMetadata(id, req.body);
      
      res.json(updatedDocument);
    } catch (error: any) {
      logger.error(`Error updating document metadata: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user as any;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      await this.documentService.deleteDocument(id);
      
      res.status(204).end();
    } catch (error: any) {
      logger.error(`Error deleting document: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Search documents by content or metadata
   */
  async searchDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.user as any;
      const searchTerm = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 50;
      
      if (!searchTerm) {
        res.status(400).json({ error: 'Search term is required' });
        return;
      }
      
      const result = await this.documentService.searchDocuments(companyId, searchTerm, page, pageSize);
      
      res.json(result);
    } catch (error: any) {
      logger.error(`Error searching documents: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Add a new version to a document
   */
  async addDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user as any;
      const { content, tag, changeDescription } = req.body;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }
      
      const newVersion = await this.documentService.addDocumentVersion(id, content, tag, changeDescription);
      
      res.status(201).json(newVersion);
    } catch (error: any) {
      logger.error(`Error adding document version: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get a specific version of a document
   */
  async getDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id, versionNumber } = req.params;
      const { companyId } = req.user as any;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      const version = await this.documentService.getDocumentVersion(id, parseInt(versionNumber));
      
      if (!version) {
        res.status(404).json({ error: 'Version not found' });
        return;
      }
      
      res.json(version);
    } catch (error: any) {
      logger.error(`Error getting document version: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all versions of a document
   */
  async getDocumentVersions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user as any;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      const versions = await this.documentService.getDocumentVersionsByDocumentId(id);
      
      res.json(versions);
    } catch (error: any) {
      logger.error(`Error getting document versions: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Rollback a document to a previous version
   */
  async rollbackToVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id, versionNumber } = req.params;
      const { companyId } = req.user as any;
      
      // First verify the document exists and belongs to the company
      const document = await this.documentService.getDocumentById(id, companyId);
      
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      
      const newVersion = await this.documentService.rollbackToVersion(id, parseInt(versionNumber));
      
      res.status(201).json(newVersion);
    } catch (error: any) {
      logger.error(`Error rolling back document version: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}