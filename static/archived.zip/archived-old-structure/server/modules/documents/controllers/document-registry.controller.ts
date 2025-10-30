/**
 * Document Registry Controller
 * 
 * Handles HTTP requests for the document registry functionality
 * including registering documents and searching the registry.
 */

import { Request, Response } from 'express';
import { documentRegistryService, DocumentFlow } from '../services/document-registry.service';

export class DocumentRegistryController {
  /**
   * Register a document in the registry
   */
  async registerDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { flow, companyId, metadata } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }
      
      if (!flow || !Object.values(DocumentFlow).includes(flow as DocumentFlow)) {
        return res.status(400).json({
          success: false,
          message: 'Valid document flow is required (INCOMING, OUTGOING, or INTERNAL)'
        });
      }
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      const result = await documentRegistryService.registerDocument(
        id,
        flow as DocumentFlow,
        companyId,
        metadata
      );
      
      return res.status(200).json({
        success: true,
        message: 'Document registered successfully',
        data: result
      });
    } catch (error: any) {
      console.error(`[DocumentRegistryController] Error registering document:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to register document',
        error: error.message
      });
    }
  }
  
  /**
   * Search the document registry
   */
  async searchRegistry(req: Request, res: Response) {
    try {
      const { 
        companyId, 
        flow, 
        startDate, 
        endDate, 
        keyword,
        page,
        limit
      } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Parse dates if provided
      let parsedStartDate: Date | undefined;
      let parsedEndDate: Date | undefined;
      
      if (startDate && typeof startDate === 'string') {
        parsedStartDate = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        parsedEndDate = new Date(endDate);
      }
      
      const results = await documentRegistryService.searchRegistry({
        companyId: companyId as string,
        flow: flow as DocumentFlow | undefined,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        keyword: keyword as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      });
      
      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error(`[DocumentRegistryController] Error searching registry:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to search registry',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const documentRegistryController = new DocumentRegistryController();