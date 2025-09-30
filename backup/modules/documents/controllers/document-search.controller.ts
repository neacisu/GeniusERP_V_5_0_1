/**
 * Document Search Controller
 * 
 * Handles API endpoints for searching documents with advanced filtering capabilities
 */

import { Request, Response } from 'express';
import { documentSearchService } from '../services/document-search.service';

export class DocumentSearchController {
  /**
   * Search documents with full text capabilities
   */
  async searchDocuments(req: Request, res: Response) {
    try {
      const { 
        companyId, 
        query, 
        documentTypes, 
        startDate, 
        endDate,
        useSemanticSearch,
        page,
        limit
      } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const searchResults = await documentSearchService.search(
        companyId as string,
        query as string,
        {
          documentTypes: documentTypes ? (documentTypes as string).split(',') : undefined,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          useSemanticSearch: useSemanticSearch === 'true',
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined
        }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: searchResults
      });
    } catch (error: any) {
      console.error('[DocumentSearchController] Search error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to search documents',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const documentSearchController = new DocumentSearchController();