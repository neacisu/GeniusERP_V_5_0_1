/**
 * Create Invoice Route
 * 
 * Defines the Express route for creating invoices with currency conversion
 * Using granular Express-style routing with Auth middleware
 * Protected by role-based access control
 */

import { Router } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { CreateInvoiceService } from '../services/create-invoice.service';
import { CreateInvoiceInput } from '../types/invoice.input';
import { UserRole } from '../../../auth/src/types';

// Create a router instance
const router = Router();

/**
 * @route POST /v1/invoices/create
 * @desc Create a new invoice with optional currency conversion
 * @access Private - requires authentication and finance roles
 */
router.post('/v1/invoices/create', 
  AuthGuard.protect(JwtAuthMode.REQUIRED), 
  AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]), 
  async (req, res) => {
  try {
    // Parse input from request using snake_case for API consistency
    const input: CreateInvoiceInput = {
      company_id: req.body.companyId,
      franchise_id: req.body.franchiseId,
      currency: req.body.currency,
      convert_to: req.body.convertTo,
      amount: req.body.amount,
      series: req.body.series
    };

    // Convert to internal camelCase format for the service
    const serviceInput = {
      companyId: input.company_id,
      franchiseId: input.franchise_id || undefined, // Convert null to undefined if present
      currency: input.currency,
      convertTo: input.convert_to,
      totalAmount: input.amount,
      series: input.series,
      userId: req.user?.id
    };

    // Call the service with the converted input
    const result = await CreateInvoiceService.execute(serviceInput);
    
    // Return formatted response
    return res.status(201).json({ 
      success: true, 
      invoice: result 
    });
  } catch (err) {
    console.error('[InvoicesController] Failed to create invoice:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;