/**
 * Document Controller
 * 
 * Handles HTTP requests for document operations including
 * creation, retrieval, and PandaDoc integration.
 */

import { Request, Response } from 'express';
import { pandaDocService } from '../services/pandadoc.service';
import { documentService } from '../services/document.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

export class DocumentController {
  /**
   * List available PandaDoc templates
   */
  @AuthGuard(JwtAuthMode.JWT)
  async listTemplates(req: Request, res: Response) {
    try {
      const { folderId } = req.query;

      const templates = await pandaDocService.listTemplates(
        folderId ? String(folderId) : undefined
      );

      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error: any) {
      console.error('[DocumentController] Error listing templates:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to list templates',
        error: error.message
      });
    }
  }

  /**
   * Create a new document from template
   */
  @AuthGuard(JwtAuthMode.JWT)
  async createDocument(req: Request, res: Response) {
    try {
      const { 
        name, 
        templateId, 
        folderId, 
        recipients, 
        tokens, 
        fields,
        metadata,
        tags
      } = req.body;

      if (!name || !templateId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name and templateId are required'
        });
      }

      const document = await pandaDocService.createDocument({
        name,
        templateId,
        folderId,
        recipients,
        tokens,
        fields,
        metadata,
        tags
      });

      return res.status(201).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error('[DocumentController] Error creating document:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create document',
        error: error.message
      });
    }
  }

  /**
   * Get document status by ID
   */
  @AuthGuard(JwtAuthMode.JWT)
  async getDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const document = await pandaDocService.getDocument(id);

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error getting document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to get document',
        error: error.message
      });
    }
  }

  /**
   * Send document for signing
   */
  @AuthGuard(JwtAuthMode.JWT)
  async sendDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { subject, message } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const result = await pandaDocService.sendDocument(id, subject, message);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error sending document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to send document',
        error: error.message
      });
    }
  }

  /**
   * Create a share link for a document
   */
  @AuthGuard(JwtAuthMode.JWT)
  async createShareLink(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { lifetime } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const result = await pandaDocService.createShareLink(id, lifetime);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error creating share link for document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create share link',
        error: error.message
      });
    }
  }

  /**
   * Download document as PDF
   */
  @AuthGuard(JwtAuthMode.JWT)
  async downloadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const fileBuffer = await pandaDocService.downloadDocument(id);

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="document-${id}.pdf"`);
      res.setHeader('Content-Length', fileBuffer.length);

      // Send the PDF file
      return res.send(fileBuffer);
    } catch (error: any) {
      console.error(`[DocumentController] Error downloading document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  /**
   * Create a versioned document in the local database
   */
  @AuthGuard(JwtAuthMode.JWT)
  async createVersionedDocument(req: Request, res: Response) {
    try {
      const { companyId, franchiseId, filePath, type, ocrText, content } = req.body;

      if (!companyId || !filePath || !type || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: companyId, filePath, type, and content are required'
        });
      }

      const result = await documentService.createDocument(
        {
          companyId,
          franchiseId,
          filePath,
          type,
          ocrText
        },
        content
      );

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[DocumentController] Error creating versioned document:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to create versioned document',
        error: error.message
      });
    }
  }

  /**
   * Add a new version to an existing document
   */
  @AuthGuard(JwtAuthMode.JWT)
  async addDocumentVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Document content is required'
        });
      }

      const version = await documentService.addDocumentVersion(id, content);

      return res.status(201).json({
        success: true,
        data: version
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error adding version to document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to add document version',
        error: error.message
      });
    }
  }

  /**
   * Get a versioned document from the local database
   */
  @AuthGuard(JwtAuthMode.JWT)
  async getVersionedDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { includeVersions } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const document = await documentService.getDocumentById(
        id,
        includeVersions === 'true'
      );

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error getting versioned document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to get versioned document',
        error: error.message
      });
    }
  }

  /**
   * Get a specific version of a document
   */
  @AuthGuard(JwtAuthMode.JWT)
  async getDocumentVersion(req: Request, res: Response) {
    try {
      const { id, version } = req.params;

      if (!id || !version) {
        return res.status(400).json({
          success: false,
          message: 'Document ID and version number are required'
        });
      }

      const versionNumber = parseInt(version, 10);
      if (isNaN(versionNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Version must be a valid number'
        });
      }

      const documentVersion = await documentService.getDocumentVersion(id, versionNumber);

      return res.status(200).json({
        success: true,
        data: documentVersion
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error getting version ${req.params.version} of document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to get document version',
        error: error.message
      });
    }
  }

  /**
   * List versioned documents from the local database
   */
  @AuthGuard(JwtAuthMode.JWT)
  async listVersionedDocuments(req: Request, res: Response) {
    try {
      const { companyId, type, limit, offset } = req.query;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      const documents = await documentService.listDocuments(
        companyId as string,
        type as string | undefined,
        limit ? parseInt(limit as string, 10) : undefined,
        offset ? parseInt(offset as string, 10) : undefined
      );

      return res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error: any) {
      console.error('[DocumentController] Error listing versioned documents:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to list versioned documents',
        error: error.message
      });
    }
  }

  /**
   * Update document metadata
   */
  @AuthGuard(JwtAuthMode.JWT)
  async updateDocumentMetadata(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { filePath, type, ocrText } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      // At least one field should be updated
      if (!filePath && !type && ocrText === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field to update is required'
        });
      }

      const updates: any = {};
      if (filePath) updates.filePath = filePath;
      if (type) updates.type = type;
      if (ocrText !== undefined) updates.ocrText = ocrText;

      const document = await documentService.updateDocumentMetadata(id, updates);

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error updating document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to update document metadata',
        error: error.message
      });
    }
  }

  /**
   * Delete a document and all its versions
   */
  @AuthGuard(JwtAuthMode.JWT)
  async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      await documentService.deleteDocument(id);

      return res.status(200).json({
        success: true,
        message: 'Document and all its versions deleted successfully'
      });
    } catch (error: any) {
      console.error(`[DocumentController] Error deleting document ${req.params.id}:`, error);

      return res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }
}

// Export controller instance
export const documentController = new DocumentController();