/**
 * Transfer Stock Controller
 * 
 * This controller handles stock transfer operations between warehouses
 * with proper transaction management and document tracking. It implements
 * the Romanian inventory transfer standards with "Aviz de însoțire".
 */

import { Request, Response, NextFunction } from 'express';
import { transferStockService } from '../services/transfer-stock.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { UserRole } from '../../auth/types';
import { Logger } from '../../../common/logger';
import { z } from 'zod';

// Role constants for inventory operations
const INVENTORY_ROLES = [UserRole.INVENTORY_MANAGER, UserRole.ADMIN];

// Transfer stock validation schema
const transferStockSchema = z.object({
  sourceStockId: z.string().uuid('Invalid source stock ID'),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  documentNumber: z.string().optional(),
  notes: z.string().optional()
});

export class TransferStockController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TransferStockController');
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      // Validate request body
      const validationResult = transferStockSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid transfer data',
          errors: validationResult.error.format()
        });
        return;
      }

      const transferInput = {
        companyId: req.user.companyId,
        franchiseId: req.user.franchiseId || undefined,
        sourceStockId: req.body.sourceStockId,
        destinationWarehouseId: req.body.destinationWarehouseId,
        quantity: req.body.quantity,
        documentNumber: req.body.documentNumber,
        notes: req.body.notes,
        userId: req.user.id // Add user ID for audit logging
      };

      const result = await transferStockService.transferStock(transferInput);

      res.status(201).json({
        success: true,
        transfer: result.transfer,
        sourceStock: result.sourceStock,
        destinationStock: result.destinationStock,
        product: result.product
      });
    } catch (error: any) {
      this.logger.error(`Error transferring stock: ${error.message}`);
      
      if (error.message.includes('insufficient') || error.message.includes('not found')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to transfer stock',
        error: error.message
      });
    }
  }

  /**
   * Get transfer document by ID
   */
  async getTransferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transferId = req.params.id;
      
      if (!transferId) {
        res.status(400).json({
          success: false,
          message: 'Transfer ID is required'
        });
        return;
      }

      const transfer = await transferStockService.getTransferById(transferId);

      if (!transfer) {
        res.status(404).json({
          success: false,
          message: 'Transfer not found'
        });
        return;
      }

      // Check company access (unless admin)
      if (req.user && 
          !req.user.roles?.includes(UserRole.ADMIN) && 
          transfer.company_id !== req.user.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to the requested transfer'
        });
        return;
      }

      res.json({
        success: true,
        transfer
      });
    } catch (error: any) {
      this.logger.error(`Error fetching transfer: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transfer',
        error: error.message
      });
    }
  }

  /**
   * Get all transfers for a company
   */
  async getTransfersByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const status = req.query.status as string | undefined;
      const transfers = await transferStockService.getTransfersByCompany(
        req.user.companyId,
        status
      );

      res.json({
        success: true,
        transfers
      });
    } catch (error: any) {
      this.logger.error(`Error fetching transfers: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transfers',
        error: error.message
      });
    }
  }

  /**
   * Update transfer status
   */
  async updateTransferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transferId = req.params.id;
      const { status } = req.body;

      if (!status || !['in_transit', 'issued', 'received', 'canceled'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const transfer = await transferStockService.updateTransferStatus(
        transferId,
        status,
        userId
      );

      res.json({
        success: true,
        transfer
      });
    } catch (error: any) {
      this.logger.error(`Error updating transfer status: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to update transfer status',
        error: error.message
      });
    }
  }
}

// Export a singleton instance
export const transferStockController = new TransferStockController();