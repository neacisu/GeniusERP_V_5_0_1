/**
 * Email Attachment Controller
 * 
 * Handles API endpoints for processing email attachments into the document system
 */

import { Request, Response } from 'express';
import { emailAttachmentService } from '../services/email-attachment.service';

export class EmailAttachmentController {
  /**
   * Process an email attachment
   */
  async processAttachment(req: Request, res: Response) {
    try {
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File attachment is required'
        });
      }
      
      const {
        emailSubject,
        emailFrom,
        emailDate,
        emailTo
      } = req.body;
      
      // Create attachment object from request
      const attachment = {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        content: req.file.buffer,
        emailSubject: emailSubject || 'No Subject',
        emailFrom: emailFrom || 'unknown@example.com',
        emailDate: emailDate ? new Date(emailDate) : new Date(),
        emailTo: emailTo ? emailTo.split(',') : []
      };
      
      const result = await emailAttachmentService.processAttachment(
        companyId,
        attachment
      );
      
      return res.status(200).json({
        success: true,
        message: 'Email attachment processed successfully',
        data: result
      });
    } catch (error: any) {
      console.error('[EmailAttachmentController] Processing error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process email attachment',
        error: error.message
      });
    }
  }
  
  /**
   * Configure email polling
   */
  async configureEmailPolling(req: Request, res: Response) {
    try {
      const { 
        companyId,
        emailServer,
        username,
        password,
        pollingInterval,
        folderToMonitor
      } = req.body;
      
      if (!companyId || !emailServer || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Required email configuration parameters are missing'
        });
      }
      
      const result = await emailAttachmentService.configureEmailPolling({
        companyId,
        emailServer,
        username,
        password,
        pollingInterval: pollingInterval || 5, // Default to 5 minutes
        folderToMonitor: folderToMonitor || 'INBOX'
      });
      
      return res.status(200).json({
        success: true,
        message: 'Email polling configured successfully',
        data: result
      });
    } catch (error: any) {
      console.error('[EmailAttachmentController] Configuration error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to configure email polling',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const emailAttachmentController = new EmailAttachmentController();