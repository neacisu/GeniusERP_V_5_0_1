/**
 * Sign Document Controller
 * 
 * Handles HTTP requests for document signing operations using PandaDoc integration.
 * Includes support for direct PDF uploads and conversion to signable documents.
 */

import { Request, Response } from 'express';
import { signDocumentService } from '../services/sign-document.service';

export class SignDocumentController {
  /**
   * Upload and create a signable document from PDF 
   */
  async uploadPdfForSigning(req: Request, res: Response) {
    try {
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
      
      // Call service to create document from PDF content
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
          tags
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Document has been created and sent for signing',
        data: result
      });
    } catch (error: any) {
      console.error(`[SignDocumentController] Error uploading PDF for signing:`, error);
      
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
      
      const result = await signDocumentService.sign(
        id, 
        signerEmail, 
        signerName,
        { subject, message, role }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Document has been submitted for signing',
        data: result
      });
    } catch (error: any) {
      console.error(`[SignDocumentController] Error signing document ${req.params.id}:`, error);
      
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
      const { pandaDocId } = req.params;
      
      if (!pandaDocId) {
        return res.status(400).json({
          success: false,
          message: 'PandaDoc ID is required'
        });
      }
      
      const result = await signDocumentService.checkSigningStatus(pandaDocId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[SignDocumentController] Error checking signing status:`, error);
      
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
      const { pandaDocId } = req.params;
      const { expiresIn } = req.body;
      
      if (!pandaDocId) {
        return res.status(400).json({
          success: false,
          message: 'PandaDoc ID is required'
        });
      }
      
      const result = await signDocumentService.generateSigningLink(
        pandaDocId,
        expiresIn
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[SignDocumentController] Error generating signing link:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate signing link',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const signDocumentController = new SignDocumentController();