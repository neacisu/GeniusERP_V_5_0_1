/**
 * Invoice Routes
 * 
 * Express routes for CRUD operations on invoices
 */

import { Router, Request, Response } from 'express';
import authGuard, { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';
import { InvoiceService } from '../services/invoice.service';
import { storage } from '../../../storage';

const router = Router();

// Get all invoices
router.get('/',
  authGuard.requireAuth(),
  authGuard.requireRoles([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  }
);

// Get invoice by ID
router.get('/:id',
  authGuard.requireAuth(),
  authGuard.requireCompanyAccess('companyId'),
  async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  }
);

// Update invoice
router.put('/:id',
  authGuard.requireAuth(),
  authGuard.requireRoles([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
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
  authGuard.requireAuth(),
  authGuard.requireRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER]),
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