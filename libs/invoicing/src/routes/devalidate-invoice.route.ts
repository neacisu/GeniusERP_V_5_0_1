/**
 * Devalidate Invoice Route
 * 
 * Express route to devalidate invoices and reverse accounting notes.
 */

import { Router, Request, Response } from 'express';
import { DevalidateInvoiceService } from '../services/devalidate-invoice.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode, UserRole, AuthenticatedRequest } from '@geniuserp/auth';

// Create router
const router = Router();

/**
 * @route POST /api/invoices/v2/devalidate
 * @desc Devalidate an invoice and reverse accounting note
 * @access Private (requires authentication with elevated privileges)
 * @body {
 *   invoiceId: string // UUID of the invoice to devalidate
 *   reason: string // Reason for devalidation (required for audit purposes)
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data?: {
 *     invoiceId: string,
 *     devalidatedAt: string,
 *     devalidatedBy: string
 *   }
 * }
 */
router.post('/devalidate', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([
    UserRole.ADMIN, 
    UserRole.ACCOUNTANT, 
    UserRole.FINANCE_MANAGER
  ]),
  async (req: Request, res: Response) => {
    try {
      const { invoiceId, reason } = req.body;
      
      // Validate required fields
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required'
        });
      }
      
      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Devalidation reason is required for audit purposes'
        });
      }
      
      // Get user ID from authenticated request
      const authReq = req as AuthenticatedRequest;
      
      // Ensure user is available
      if (!authReq.user || !authReq.user.id) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }
      
      // Call the devalidate invoice service with non-null user ID
      const devalidationResult = await DevalidateInvoiceService.devalidateInvoice(
        invoiceId, 
        authReq.user.id, 
        reason
      );
      
      return res.status(200).json({
        success: true,
        message: 'Invoice devalidated successfully',
        data: devalidationResult
      });
    } catch (error) {
      console.error('[DevalidateInvoiceRoute] Error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to devalidate invoice'
      });
    }
  }
);

export default router;