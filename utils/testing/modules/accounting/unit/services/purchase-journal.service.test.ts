/**
 * PurchaseJournalService Unit Tests
 * 
 * Tests the purchase journal service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PurchaseJournalService } from '../../../../../../server/modules/accounting/services/purchase-journal.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-cache.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');

describe('PurchaseJournalService Unit Tests', () => {
  let purchaseJournalService: PurchaseJournalService;

  beforeEach(() => {
    purchaseJournalService = new PurchaseJournalService();
  });

  describe('Invoice Creation', () => {
    it('should create supplier invoice', async () => {
      const invoiceData = {
        companyId: 'company-1',
        invoiceNumber: 'PUR-2024-001',
        invoiceId: 'invoice-1',
        supplierId: 'supplier-1',
        supplierName: 'Test Supplier SRL',
        amount: 11900,
        netAmount: 10000,
        vatAmount: 1900,
        vatRate: 19,
        currency: 'RON',
        exchangeRate: 1,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Purchase of goods',
        expenseType: 'goods',
        deductibleVat: true
      };

      const supplier = {
        id: 'supplier-1',
        name: 'Test Supplier SRL',
        taxId: 'RO87654321'
      };

      const items = [
        {
          description: 'Product A',
          quantity: 10,
          unitPrice: 1000,
          vatRate: 19,
          amount: 10000
        }
      ];

      const invoiceId = await purchaseJournalService.createSupplierInvoice(
        invoiceData,
        supplier,
        items,
        [],
        undefined,
        undefined
      );

      expect(invoiceId).toBeDefined();
      expect(typeof invoiceId).toBe('string');
    });
  });

  describe('Payment Recording', () => {
    it('should record invoice payment', async () => {
      const payment = {
        invoiceId: 'invoice-1',
        companyId: 'company-1',
        amount: 11900,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'PAY-001',
        bankAccountId: 'bank-1'
      };

      const paymentId = await purchaseJournalService.recordSupplierPayment(payment);

      expect(paymentId).toBeDefined();
      expect(typeof paymentId).toBe('string');
    });
  });

  describe('Journal Reports', () => {
    it('should generate purchase journal report', async () => {
      const params = {
        companyId: 'company-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        includeDetails: true
      };

      const report = await purchaseJournalService.generatePurchaseJournal(params);

      expect(report).toBeDefined();
      expect(report.totals).toBeDefined();
      expect(Array.isArray(report.rows)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should validate invoice data', async () => {
      const invalidInvoiceData = {
        companyId: '',
        invoiceNumber: '',
        invoiceId: '',
        supplierId: '',
        supplierName: '',
        amount: -1000,
        netAmount: 0,
        vatAmount: 0,
        vatRate: 0,
        currency: 'RON',
        exchangeRate: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        description: '',
        expenseType: 'goods',
        deductibleVat: true
      };

      await expect(
        purchaseJournalService.createSupplierInvoice(invalidInvoiceData, undefined, [], [], undefined, undefined)
      ).rejects.toThrow();
    });
  });
});

