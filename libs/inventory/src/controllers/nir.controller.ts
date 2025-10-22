/**
 * NIR Controller
 * 
 * This controller handles the reception documents (Notă de Intrare Recepție) operations
 * for receiving goods into warehouse with proper validation. It follows the
 * Romanian inventory management standards.
 */

import { Request, Response, NextFunction } from 'express';
import { nirService } from '../services/nir.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { UserRole } from '../../auth/types';
import { Logger } from "@common/logger";
import { z } from 'zod';
import { nirStatusEnum } from '../schema/inventory.schema';

// Role constants for NIR operations
const INVENTORY_ROLES = [UserRole.INVENTORY_MANAGER, UserRole.ADMIN];

export class NirController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('NirController');
  }

  /**
   * Create a new NIR document
   */
  async createNirDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { document, items } = req.body;

      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      if (!document || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid NIR document structure. Document and items array required.'
        });
        return;
      }

      // Add company ID to document
      document.company_id = req.user.companyId;
      document.created_by = req.user.id;
      
      // If franchise ID exists in user, add it to document
      if (req.user.franchiseId) {
        document.franchise_id = req.user.franchiseId;
      }

      const nirDocument = await nirService.createNirDocument(document, items);
      
      this.logger.debug(`Created NIR document: ${nirDocument.id}`);
      
      res.status(201).json({
        success: true,
        message: 'NIR document created successfully',
        document: nirDocument
      });
    } catch (error: any) {
      this.logger.error(`Error creating NIR document: ${error.message}`);
      if (error.message.includes('Validation')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get NIR document by ID
   */
  async getNirDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nirId = req.params.id;
      
      if (!nirId) {
        res.status(400).json({
          success: false,
          message: 'NIR document ID is required'
        });
        return;
      }

      const result = await nirService.getNirDocument(nirId);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'NIR document not found'
        });
        return;
      }
      
      // Check company access (unless admin)
      if (req.user && 
          !req.user.roles?.includes(UserRole.ADMIN) && 
          result.document.company_id !== req.user.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to the requested NIR document'
        });
        return;
      }

      res.json({
        success: true,
        document: result.document,
        items: result.items
      });
    } catch (error: any) {
      this.logger.error(`Error retrieving NIR document: ${error.message}`);
      next(error);
    }
  }

  /**
   * Update NIR document status
   */
  async updateNirStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nirId = req.params.id;
      const { status } = req.body;
      
      if (!nirId) {
        res.status(400).json({
          success: false,
          message: 'NIR document ID is required'
        });
        return;
      }

      if (!status || !nirStatusEnum.enumValues.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status. Valid values are: ${nirStatusEnum.enumValues.join(', ')}`
        });
        return;
      }

      const updatedDocument = await nirService.updateNirStatus(nirId, status);
      
      res.json({
        success: true,
        message: `NIR document status updated to ${status}`,
        document: updatedDocument
      });
    } catch (error: any) {
      this.logger.error(`Error updating NIR document status: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get all NIR documents for a company
   */
  async getNirDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      // Get optional warehouse filter from query parameters
      const warehouseId = req.query.warehouseId as string;

      // Get NIR documents from service
      const documents = await nirService.getNirDocuments(req.user.companyId, warehouseId);
      
      this.logger.debug(`Found ${documents.length} NIR documents for company ${req.user.companyId}`);

      res.json({
        success: true,
        message: `Found ${documents.length} NIR documents`,
        documents: documents
      });
    } catch (error: any) {
      this.logger.error(`Error fetching NIR documents: ${error.message}`);
      next(error);
    }
  }
}

// Export a singleton instance
export const nirController = new NirController();