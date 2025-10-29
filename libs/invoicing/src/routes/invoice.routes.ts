/**
 * Invoice Routes
 * 
 * Express routes for CRUD operations on invoices
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { UserRole } from '@geniuserp/auth';
import { InvoiceService } from '../services/invoice.service';
import { storage } from "@api/storage";

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

// Get invoice statistics (MUST be before /:id route to avoid route matching conflicts)
router.get('/stats',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId || '';
      const stats = await InvoiceService.getInvoiceStatistics(companyId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      res.status(500).json({ message: 'Failed to fetch invoice statistics' });
    }
  }
);

// Get invoice by ID
router.get('/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId || '';
      const invoiceId = req.params['id'];
      // Use enhanced service method that includes customer information
      const invoice = await InvoiceService.getInvoiceById(invoiceId, companyId);
      
      if (!invoice) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      
      console.log(`Retrieved invoice ${invoiceId} with customer information`);
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params['id'];
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const invoiceId = req.params['id'];
      // Dacă ai companyId disponibil, folosește deleteInvoiceForCompany, altfel lasă apelul vechi pentru metoda cu 2 parametri
      await InvoiceService.deleteInvoice(invoiceId, userId);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      res.status(500).json({ message: 'Failed to delete invoice' });
    }
  }
);

export { router };