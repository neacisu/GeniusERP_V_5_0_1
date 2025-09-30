/**
 * Document Editor Controller
 * 
 * Handles API endpoints for the embedded document editor
 */

import { Request, Response } from 'express';
import { documentEditorService } from '../services/document-editor.service';

export class DocumentEditorController {
  /**
   * Get document for editing
   */
  async getDocumentForEditing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication is required'
        });
      }
      
      const document = await documentEditorService.getDocumentForEditing(id, userId);
      
      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error: any) {
      console.error('[DocumentEditorController] Error getting document for editing:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get document for editing',
        error: error.message
      });
    }
  }
  
  /**
   * Save edited document
   */
  async saveDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content, comment } = req.body;
      const userId = req.user?.id;
      
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
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication is required'
        });
      }
      
      const result = await documentEditorService.saveDocument(id, content, userId, comment);
      
      return res.status(200).json({
        success: true,
        message: 'Document saved successfully',
        data: result
      });
    } catch (error: any) {
      console.error('[DocumentEditorController] Error saving document:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to save document',
        error: error.message
      });
    }
  }
  
  /**
   * Track document changes
   */
  async trackDocumentChanges(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { changes } = req.body;
      const userId = req.user?.id;
      const username = req.user?.username || 'Unknown User';
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({
          success: false,
          message: 'Valid changes array is required'
        });
      }
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication is required'
        });
      }
      
      await documentEditorService.trackDocumentChanges(id, {
        userId,
        username,
        timestamp: new Date(),
        changes
      });
      
      return res.status(200).json({
        success: true,
        message: 'Document changes tracked successfully'
      });
    } catch (error: any) {
      console.error('[DocumentEditorController] Error tracking document changes:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to track document changes',
        error: error.message
      });
    }
  }
  
  /**
   * Generate editing link
   */
  async generateEditingLink(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { expiresInMinutes } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      const result = await documentEditorService.generateEditingLink(
        id,
        expiresInMinutes
      );
      
      return res.status(200).json({
        success: true,
        message: 'Editing link generated successfully',
        data: result
      });
    } catch (error: any) {
      console.error('[DocumentEditorController] Error generating editing link:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate editing link',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const documentEditorController = new DocumentEditorController();