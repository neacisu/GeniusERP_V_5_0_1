/**
 * Unit Tests - PurchaseJournalController
 * 
 * Tests pentru controllerul jurnal achiziții
 * - Supplier invoices CRUD
 * - Payment recording
 * - Purchase reports
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PurchaseJournalController } from '../../../../../../server/modules/accounting/controllers/purchase-journal.controller';
import { PurchaseJournalService } from '../../../../../../server/modules/accounting/services/purchase-journal.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

// Mock services
jest.mock('../../../../../../server/modules/accounting/services/purchase-journal.service');
jest.mock('../../../../../../server/modules/accounting/services/purchase-journal-export.service');
jest.mock('../../../../../../server/modules/accounting/services/bulk-operations.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');

describe('PurchaseJournalController', () => {
  let controller: PurchaseJournalController;
  let mockPurchaseJournalService: jest.Mocked<PurchaseJournalService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockPurchaseJournalService = new PurchaseJournalService() as jest.Mocked<PurchaseJournalService>;
    controller = new PurchaseJournalController(mockPurchaseJournalService);

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

  describe('Get Supplier Invoices', () => {
    it('should get all supplier invoices with pagination', async () => {
      mockReq.query = {
        page: '1',
        limit: '10'
      };

      const mockInvoices = {
        invoices: [
          { id: '1', invoiceNumber: 'SUPP-001', total: 10000, companyId: 'company-1' },
          { id: '2', invoiceNumber: 'SUPP-002', total: 15000, companyId: 'company-1' }
        ],
        total: 2,
        page: 1,
        limit: 10
      };

      mockPurchaseJournalService.getSupplierInvoices.mockResolvedValue(mockInvoices as any);

      await controller.getSupplierInvoices(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockPurchaseJournalService.getSupplierInvoices).toHaveBeenCalledWith(
        'company-1',
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Record Supplier Invoice', () => {
    it('should record supplier invoice successfully', async () => {
      mockReq.body = {
        invoiceData: {
          invoiceNumber: 'SUPP-001',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          totalAmount: 10000,
          expenseType: 'goods'
        },
        supplier: {
          name: 'Supplier SRL',
          taxId: 'RO98765432',
          address: 'Bucharest'
        },
        items: [
          { description: 'Raw Material', quantity: 100, unitPrice: 100, vatRate: 19 }
        ]
      };

      const mockInvoiceId = 'invoice-456';
      const mockCreatedInvoice = { id: mockInvoiceId, ...mockReq.body.invoiceData };

      mockPurchaseJournalService.recordSupplierInvoice.mockResolvedValue(mockInvoiceId);
      mockPurchaseJournalService.getSupplierInvoice.mockResolvedValue(mockCreatedInvoice as any);

      await controller.recordSupplierInvoice(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockPurchaseJournalService.recordSupplierInvoice).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockReq.query = {};
      
      mockPurchaseJournalService.getSupplierInvoices.mockRejectedValue(new Error('Database error'));

      await controller.getSupplierInvoices(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

