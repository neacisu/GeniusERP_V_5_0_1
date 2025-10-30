/**
 * OCR Controller
 * 
 * Handles HTTP requests for document OCR operations
 * including processing documents and searching by text.
 */

import { Request, Response } from 'express';
import { ocrService } from '../services/ocr.service';

export class OcrController {
  /**
   * Process a document with OCR
   */
  async processDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      const extractedText = await ocrService.processDocument(id);
      
      return res.status(200).json({
        success: true,
        message: 'Document processed with OCR',
        data: {
          documentId: id,
          extractedText
        }
      });
    } catch (error: any) {
      console.error(`[OcrController] Error processing document:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to process document with OCR',
        error: error.message
      });
    }
  }
  
  /**
   * Search documents by OCR text
   */
  async searchByText(req: Request, res: Response) {
    try {
      const { companyId, text, limit, offset } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Search text is required'
        });
      }
      
      const options = {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined
      };
      
      const results = await ocrService.searchByText(
        companyId as string,
        text as string,
        options
      );
      
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error(`[OcrController] Error searching by text:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to search documents by text',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const ocrController = new OcrController();