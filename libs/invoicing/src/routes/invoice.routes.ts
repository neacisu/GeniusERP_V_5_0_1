/**
 * Invoice Routes
 * 
 * Express routes for CRUD operations on invoices
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/types';
import { UserRole } from '../../../auth/src/types';
import { InvoiceService } from '../services/invoice.service';
import { storage } from '../../../../apps/api/src/storage';

const router = Router();

// Get all invoices
router.get('/',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId || '';
      const { page = '1', limit = '10', sortBy = 'issueDate', sortDir = 'desc' } = req.query;
      
      // Parse pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      
      // Use the enhanced InvoiceService method with JOIN support
      const result = await InvoiceService.getInvoicesForCompany(
        companyId,
        limitNum,
        offset,
        sortBy as string,
        sortDir as 'asc' | 'desc'
      );
      
      console.log(`Retrieved ${result.invoices.length} invoices with customer information`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  }
);

// Get invoice by ID
router.get('/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId || '';
      // Use enhanced service method that includes customer information
      const invoice = await InvoiceService.getInvoiceById(req.params.id, companyId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      console.log(`Retrieved invoice ${req.params.id} with customer information`);
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  }
);

// Update invoice
router.put('/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const updatedInvoice = await storage.updateInvoice(req.params.id, req.body);
      res.json(updatedInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(500).json({ message: 'Failed to update invoice' });
    }
  }
);

// Delete invoice
router.delete('/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.FINANCE_MANAGER]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      // Dacă ai companyId disponibil, folosește deleteInvoiceForCompany, altfel lasă apelul vechi pentru metoda cu 2 parametri
      await InvoiceService.deleteInvoice(req.params.id, userId);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  }
);

export { router };