/**
 * Sign Document Controller
 * 
 * Handles HTTP requests for document signing operations using PandaDoc integration.
 * Includes support for direct PDF uploads and conversion to signable documents.
 * Implements comprehensive audit logging for all document signing operations.
 */

import { Request, Response } from 'express';
import { signDocumentService } from '../services/sign-document.service';
import { AuditService, AuditAction } from '../../audit/services/audit.service';
import { Logger } from '../../../common/logger';

// Define entity name for audit logs
export const ENTITY_NAME = 'document';

export class SignDocumentController {
  private logger: Logger;
  private auditService: AuditService;

  constructor() {
    this.logger = new Logger('SignDocumentController');
    this.auditService = new AuditService();
  }

  /**
   * Upload and create a signable document from PDF 
   */
  async uploadPdfForSigning(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      // Check if file is included in the request
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file uploaded'
        });
      }
      
      // Validate required fields
      const { 
        name, 
        signerEmail, 
        signerName, 
        subject, 
        message 
      } = req.body;
      
      if (!name || !signerEmail || !signerName) {
        return res.status(400).json({
          success: false,
          message: 'Document name, signer email, and signer name are required'
        });
      }
      
      // Convert file buffer to base64
      const pdfContent = req.file.buffer.toString('base64');
      
      // Extract optional filename from the request or use the original filename
      const fileName = req.body.fileName || req.file.originalname;
      
      // Extract optional tags
      const tags = req.body.tags ? JSON.parse(req.body.tags) : undefined;
      
      // Extract optional metadata
      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;
      
      this.logger.info(`Processing PDF upload for signing: ${name} (${fileName})`);
      
      // Call service to create document from PDF content with audit logging
      const result = await signDocumentService.createFromPdf(
        name,
        pdfContent,
        signerEmail,
        signerName,
        {
          subject,
          message,
          fileName,
          metadata,
          tags,
          userId: userId as string,
          companyId: companyId as string,
          additionalAuditInfo: {
            documentSize: req.file.size,
            mimeType: req.file.mimetype,
            hasTags: !!tags,
            hasMetadata: !!metadata
          }
        }
      );
      
      // No need for separate audit log as it's now handled in the service
      
      this.logger.info(`Successfully created document for signing with ID: ${result.pandaDocId}`);
      
      return res.status(201).json({
        success: true,
        message: 'Document has been created and sent for signing',
        data: result
      });
    } catch (error: any) {
      this.logger.error(`Error uploading PDF for signing:`, error);
      
      // Audit the failed operation
      if (req.user?.id && req.user?.companyId) {
        await this.auditService.log({
          userId: req.user.id,
          companyId: req.user.companyId,
          action: 'CREATE_FAILED',
          entity: ENTITY_NAME,
          details: {
            operation: 'uploadPdfForSigning',
            error: error.message,
            fileName: req.file?.originalname,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload and process PDF document',
        error: error.message
      });
    }
  }

  /**
   * Sign a document by ID
   */
  async signDocument(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const { signerEmail, signerName, subject, message, role } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      if (!signerEmail || !signerName) {
        return res.status(400).json({
          success: false,
          message: 'Signer email and name are required'
        });
      }
      
      this.logger.info(`Sending document ${id} for signing to ${signerEmail}`);
      
      // Pass userId and companyId to the service for audit logging
      const result = await signDocumentService.sign(
        id, 
        signerEmail, 
        signerName,
        { 
          subject, 
          message, 
          role,
          userId: userId as string,
          companyId: companyId as string 
        }
      );
      
      // No need for separate audit log as it's now handled in the service
      
      this.logger.info(`Successfully sent document ${id} for signing, PandaDoc ID: ${result.pandaDocId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Document has been submitted for signing',
        data: result
      });
    } catch (error: any) {
      this.logger.error(`Error signing document ${req.params.id}:`, error);
      
      // Audit the failed operation
      if (req.user?.id && req.user?.companyId) {
        await this.auditService.log({
          userId: req.user.id,
          companyId: req.user.companyId,
          action: 'SIGN_REQUEST_FAILED',
          entity: ENTITY_NAME,
          entityId: req.params.id,
          details: {
            operation: 'signDocument',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to sign document',
        error: error.message
      });
    }
  }

  /**
   * Check signing status by PandaDoc ID
   */
  async checkSigningStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const { pandaDocId } = req.params;
      
      if (!pandaDocId) {
        return res.status(400).json({
          success: false,
          message: 'PandaDoc ID is required'
        });
      }
      
      this.logger.info(`Checking signing status for document ${pandaDocId}`);
      
      // Pass userId and companyId to the service for audit logging
      const result = await signDocumentService.checkSigningStatus(
        pandaDocId,
        userId && companyId ? { userId, companyId } : undefined
      );
      
      // No need for separate audit log as it's now handled in the service
      
      this.logger.info(`Document ${pandaDocId} status: ${result.status}`);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      this.logger.error(`Error checking signing status for ${req.params.pandaDocId}:`, error);
      
      // Audit the failed operation
      if (req.user?.id && req.user?.companyId) {
        await this.auditService.log({
          userId: req.user.id,
          companyId: req.user.companyId,
          action: 'VIEW_FAILED',
          entity: ENTITY_NAME,
          entityId: req.params.pandaDocId,
          details: {
            operation: 'checkSigningStatus',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to check signing status',
        error: error.message
      });
    }
  }

  /**
   * Generate signing link for document
   */
  async generateSigningLink(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const { pandaDocId } = req.params;
      const { expiresIn } = req.body;
      
      if (!pandaDocId) {
        return res.status(400).json({
          success: false,
          message: 'PandaDoc ID is required'
        });
      }
      
      this.logger.info(`Generating signing link for document ${pandaDocId}`);
      
      // Pass userId and companyId to the service for audit logging
      const result = await signDocumentService.generateSigningLink(
        pandaDocId,
        expiresIn,
        userId && companyId ? { userId, companyId } : undefined
      );
      
      // No need for separate audit log as it's now handled in the service
      
      this.logger.info(`Successfully generated signing link for document ${pandaDocId}`);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      this.logger.error(`Error generating signing link for ${req.params.pandaDocId}:`, error);
      
      // Audit the failed operation
      if (req.user?.id && req.user?.companyId) {
        await this.auditService.log({
          userId: req.user.id,
          companyId: req.user.companyId,
          action: 'GENERATE_LINK_FAILED',
          entity: ENTITY_NAME,
          entityId: req.params.pandaDocId,
          details: {
            operation: 'generateSigningLink',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate signing link',
        error: error.message
      });
    }
  }
  
  /**
   * Handle webhook callbacks from PandaDoc
   * This allows us to track document status changes in real-time
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const { event_type, data } = req.body;
      
      if (!event_type || !data) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook payload'
        });
      }
      
      this.logger.info(`Received webhook event: ${event_type} for document ${data.id}`);
      
      // Process different event types
      switch (event_type) {
        case 'document_state_changed':
          // Get the document details from our service with system audit logging
          const documentStatus = await signDocumentService.checkSigningStatus(
            data.id,
            { userId: 'system', companyId: 'system' }
          );
          
          // Create webhook audit log
          await this.auditService.log({
            userId: 'system', // Webhook events are system-triggered
            companyId: 'system', // We'll need to map the document ID to a company ID in a real implementation
            action: 'DOCUMENT_STATUS_CHANGED',
            entity: ENTITY_NAME,
            entityId: data.id,
            details: {
              operation: 'webhook',
              previousStatus: data.previous_status,
              newStatus: data.status,
              documentName: data.name,
              recipients: data.recipients,
              timestamp: new Date().toISOString()
            }
          });
          
          this.logger.info(`Document ${data.id} status changed from ${data.previous_status} to ${data.status}`);
          break;
          
        case 'document_completed':
          // Create webhook audit log for completed document
          await this.auditService.log({
            userId: 'system',
            companyId: 'system',
            action: 'DOCUMENT_COMPLETED',
            entity: ENTITY_NAME,
            entityId: data.id,
            details: {
              operation: 'webhook',
              documentName: data.name,
              completedAt: data.date_completed,
              timestamp: new Date().toISOString()
            }
          });
          
          this.logger.info(`Document ${data.id} has been completed`);
          break;
          
        default:
          // Log other event types
          await this.auditService.log({
            userId: 'system',
            companyId: 'system',
            action: 'WEBHOOK_EVENT',
            entity: ENTITY_NAME,
            entityId: data.id,
            details: {
              operation: 'webhook',
              eventType: event_type,
              documentName: data.name,
              timestamp: new Date().toISOString()
            }
          });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      this.logger.error(`Error processing webhook:`, error);
      
      // Audit the failed webhook processing
      await this.auditService.log({
        userId: 'system',
        companyId: 'system',
        action: 'WEBHOOK_PROCESSING_FAILED',
        entity: ENTITY_NAME,
        details: {
          operation: 'handleWebhook',
          error: error.message,
          payload: req.body,
          timestamp: new Date().toISOString()
        }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const signDocumentController = new SignDocumentController();