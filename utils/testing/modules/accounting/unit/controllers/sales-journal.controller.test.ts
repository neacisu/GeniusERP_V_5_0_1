/**
 * Unit Tests - SalesJournalController
 * 
 * Tests pentru controllerul jurnal vânzări
 * - Customer invoices CRUD
 * - Payment recording
 * - Sales reports
 * - Bulk operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SalesJournalController } from '../../../../../../server/modules/accounting/controllers/sales-journal.controller';
import { SalesJournalService } from '../../../../../../server/modules/accounting/services/sales-journal.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

// Mock services
jest.mock('../../../../../../server/modules/accounting/services/sales-journal.service');
jest.mock('../../../../../../server/modules/accounting/services/sales-journal-export.service');
jest.mock('../../../../../../server/modules/accounting/services/bulk-operations.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');

describe('SalesJournalController', () => {
  let controller: SalesJournalController;
  let mockSalesJournalService: jest.Mocked<SalesJournalService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockSalesJournalService = new SalesJournalService() as jest.Mocked<SalesJournalService>;
    controller = new SalesJournalController(mockSalesJournalService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin'
      },
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  describe('Get Customer Invoices', () => {
    it('should get all customer invoices with pagination', async () => {
      mockReq.query = {
        page: '1',
        limit: '10'
      };

      const mockInvoices = {
        invoices: [
          { id: '1', invoiceNumber: 'INV-001', total: 11900, companyId: 'company-1' },
          { id: '2', invoiceNumber: 'INV-002', total: 23800, companyId: 'company-1' }
        ],
        total: 2,
        page: 1,
        limit: 10
      };

      mockSalesJournalService.getCustomerInvoices.mockResolvedValue(mockInvoices as any);

      await controller.getCustomerInvoices(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.getCustomerInvoices).toHaveBeenCalledWith(
        'company-1',
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockInvoices
      }));
    });

    it('should filter invoices by date range', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      mockSalesJournalService.getCustomerInvoices.mockResolvedValue({ invoices: [], total: 0 } as any);

      await controller.getCustomerInvoices(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.getCustomerInvoices).toHaveBeenCalledWith(
        'company-1',
        1,
        50,
        expect.any(Date),
        expect.any(Date),
        undefined,
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Create Customer Invoice', () => {
    it('should create customer invoice successfully', async () => {
      mockReq.body = {
        invoiceData: {
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          totalAmount: 11900
        },
        customer: {
          name: 'ABC SRL',
          taxId: 'RO12345678',
          address: 'Bucharest'
        },
        items: [
          { description: 'Product A', quantity: 10, unitPrice: 1000, vatRate: 19 }
        ],
        taxRates: [{ rate: 19, amount: 1900 }],
        paymentTerms: '30 days',
        notes: 'Test invoice'
      };

      const mockInvoiceId = 'invoice-123';
      const mockCreatedInvoice = { id: mockInvoiceId, ...mockReq.body.invoiceData };

      mockSalesJournalService.createCustomerInvoice.mockResolvedValue(mockInvoiceId);
      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(mockCreatedInvoice as any);

      await controller.createCustomerInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.createCustomerInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          userId: 'user-1',
          invoiceNumber: 'INV-001'
        }),
        mockReq.body.customer,
        mockReq.body.items,
        mockReq.body.taxRates,
        mockReq.body.paymentTerms,
        mockReq.body.notes
      );
      expect(mockSalesJournalService.getCustomerInvoice).toHaveBeenCalledWith(mockInvoiceId, 'company-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Update Customer Invoice', () => {
    it('should update existing invoice', async () => {
      mockReq.params = { id: 'invoice-123' };
      mockReq.body = {
        invoiceData: {
          invoiceNumber: 'INV-001-UPDATED',
          totalAmount: 13090
        },
        customer: { name: 'ABC SRL' },
        items: [{ description: 'Product A', quantity: 11, unitPrice: 1000, vatRate: 19 }]
      };

      const mockExistingInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001' };
      const mockUpdatedInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001-UPDATED' };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValueOnce(mockExistingInvoice as any);
      mockSalesJournalService.updateCustomerInvoice.mockResolvedValue(undefined);
      mockSalesJournalService.getCustomerInvoice.mockResolvedValueOnce(mockUpdatedInvoice as any);

      await controller.updateCustomerInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.updateCustomerInvoice).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent invoice', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { invoiceData: {} };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(null);

      await controller.updateCustomerInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Customer invoice not found'
      }));
    });
  });

  describe('Delete Customer Invoice', () => {
    it('should delete existing invoice', async () => {
      mockReq.params = { id: 'invoice-123' };

      const mockExistingInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001' };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(mockExistingInvoice as any);
      mockSalesJournalService.deleteCustomerInvoice.mockResolvedValue(undefined);

      await controller.deleteCustomerInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.deleteCustomerInvoice).toHaveBeenCalledWith('invoice-123', 'company-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ message: 'Customer invoice deleted successfully' })
      }));
    });

    it('should return 404 when deleting non-existent invoice', async () => {
      mockReq.params = { id: 'nonexistent' };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(null);

      await controller.deleteCustomerInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Customer invoice not found'
      }));
    });
  });

  describe('Record Invoice Payment', () => {
    it('should record payment for existing invoice', async () => {
      mockReq.params = { id: 'invoice-123' };
      mockReq.body = {
        paymentData: {
          amount: 11900,
          paymentDate: '2024-01-20',
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'PAY-001'
        }
      };

      const mockExistingInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001', totalAmount: 11900 };
      const mockPaymentId = 'payment-456';
      const mockPayment = { 
        id: mockPaymentId, 
        invoiceId: 'invoice-123', 
        amount: 11900,
        paymentDate: '2024-01-20'
      };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(mockExistingInvoice as any);
      mockSalesJournalService.recordInvoicePayment.mockResolvedValue(mockPaymentId);
      mockSalesJournalService.getInvoicePayment.mockResolvedValue(mockPayment as any);

      await controller.recordInvoicePayment(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockSalesJournalService.recordInvoicePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-1',
          userId: 'user-1',
          invoiceId: 'invoice-123',
          amount: 11900
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when recording payment for non-existent invoice', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { paymentData: { amount: 100 } };

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(null);

      await controller.recordInvoicePayment(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Customer invoice not found'
      }));
    });
  });

  describe('Get Invoice Payments', () => {
    it('should get all payments for an invoice', async () => {
      mockReq.params = { id: 'invoice-123' };

      const mockInvoice = { id: 'invoice-123', invoiceNumber: 'INV-001' };
      const mockPayments = [
        { id: 'payment-1', amount: 5000, paymentDate: '2024-01-15' },
        { id: 'payment-2', amount: 6900, paymentDate: '2024-01-20' }
      ];

      mockSalesJournalService.getCustomerInvoice.mockResolvedValue(mockInvoice as any);
      (mockSalesJournalService as any).getInvoicePayments = jest.fn().mockResolvedValue(mockPayments);

      await controller.getInvoicePayments(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockReq.query = {};
      
      mockSalesJournalService.getCustomerInvoices.mockRejectedValue(new Error('Database error'));

      await controller.getCustomerInvoices(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Database error'
      }));
    });
  });
});

