/**
 * SalesJournalService Unit Tests
 * 
 * Tests the sales journal service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SalesJournalService } from '../../../../../../server/modules/accounting/services/sales-journal.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-cache.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');

describe('SalesJournalService Unit Tests', () => {
  let salesJournalService: SalesJournalService;

  beforeEach(() => {
    salesJournalService = new SalesJournalService();
  });

  describe('Invoice Creation', () => {
    it('should create customer invoice', async () => {
      const invoiceData = {
        companyId: 'company-1',
        invoiceNumber: 'INV-2024-001',
        invoiceId: 'invoice-1',
        customerId: 'customer-1',
        customerName: 'Test Customer SRL',
        amount: 11900,
        netAmount: 10000,
        vatAmount: 1900,
        vatRate: 19,
        currency: 'RON',
        exchangeRate: 1,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Sale of goods'
      };

      const customer = {
        id: 'customer-1',
        name: 'Test Customer SRL',
        taxId: 'RO12345678'
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

      const invoiceId = await salesJournalService.createCustomerInvoice(
        invoiceData,
        customer,
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

      const paymentId = await salesJournalService.recordInvoicePayment(payment);

      expect(paymentId).toBeDefined();
      expect(typeof paymentId).toBe('string');
    });
  });

  describe('Journal Reports', () => {
    it('should generate sales journal report', async () => {
      const params = {
        companyId: 'company-1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        includeDetails: true
      };

      const report = await salesJournalService.generateSalesJournal(params);

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
        customerId: '',
        customerName: '',
        amount: -1000, // Negative amount!
        netAmount: 0,
        vatAmount: 0,
        vatRate: 0,
        currency: 'RON',
        exchangeRate: 1,
        issueDate: new Date(),
        dueDate: new Date(),
        description: ''
      };

      await expect(
        salesJournalService.createCustomerInvoice(invalidInvoiceData, undefined, [], [], undefined, undefined)
      ).rejects.toThrow();
    });
  });
});

