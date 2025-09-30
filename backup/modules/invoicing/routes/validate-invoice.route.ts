/**
 * Validate Invoice Route
 * 
 * Express route to validate invoices and generate accounting notes.
 */

import { Router, Request, Response } from 'express';
import { ValidateInvoiceService } from '../services/validate-invoice.service';
import authGuard from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode, UserRole, AuthenticatedRequest } from '../../../modules/auth/types';

// Create router
const router = Router();

/**
 * @route POST /api/invoices/v2/validate
 * @desc Validate an invoice and generate accounting note
 * @access Private (requires authentication)
 * @body {
 *   invoiceId: string // UUID of the invoice to validate
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data?: {
 *     invoiceId: string,
 *     ledgerEntryId: string,
 *     validatedAt: string,
 *     validatedBy: string
 *   }
 * }
 */
router.post('/validate', 
  authGuard.requireAuth(),
  authGuard.requireRoles([
    UserRole.ADMIN, 
    UserRole.ACCOUNTANT, 
    UserRole.FINANCE_MANAGER
  ]),
  async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.body;
      
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          message: 'Invoice ID is required'
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
      
      // Call the validate invoice service with the non-null user ID
      const validationResult = await ValidateInvoiceService.validateInvoice(invoiceId, authReq.user.id);
      
      return res.status(200).json({
        success: true,
        message: 'Invoice validated successfully',
        data: validationResult
      });
    } catch (error) {
      console.error('[ValidateInvoiceRoute] Error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to validate invoice'
      });
    }
  }
);

export default router;