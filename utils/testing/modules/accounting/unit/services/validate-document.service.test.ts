/**
 * Unit Tests: ValidateDocumentService
 * 
 * Testează serviciul pentru validare documente și generare note contabile
 * - Validare diverse tipuri de documente
 * - Generare ledger entries
 * - Devalidare documente
 * - Audit logging
 */

import { ValidateDocumentService, DocumentType } from '../../../../../../server/modules/accounting/services/validate-document';
import { JournalService } from '../../../../../../server/modules/accounting/services/journal.service';
import { SalesJournalService } from '../../../../../../server/modules/accounting/services/sales-journal.service';

jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/sales-journal.service');

describe('ValidateDocumentService', () => {
  let service: ValidateDocumentService;
  let mockJournalService: jest.Mocked<JournalService>;
  let mockSalesJournalService: jest.Mocked<SalesJournalService>;

  beforeEach(() => {
    mockJournalService = new JournalService() as jest.Mocked<JournalService>;
    mockSalesJournalService = new SalesJournalService() as jest.Mocked<SalesJournalService>;

    service = new ValidateDocumentService();
    (service as any).journalService = mockJournalService;
    (service as any).salesJournalService = mockSalesJournalService;
  });

  describe('validateDocument', () => {
    it('should reject validation without document type', async () => {
      const result = await service.validateDocument(null as any, 'doc-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Document type is required');
    });

    it('should reject validation without document ID', async () => {
      const result = await service.validateDocument(DocumentType.INVOICE, '', 'user-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Document ID is required');
    });

    it('should reject validation without user ID', async () => {
      const result = await service.validateDocument(DocumentType.INVOICE, 'doc-1', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('User ID is required');
    });

    it('should handle unimplemented document types', async () => {
      jest.spyOn(service as any, 'getDocumentData').mockResolvedValue({});

      const result = await service.validateDocument(DocumentType.BANK_STATEMENT, 'doc-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not implemented');
    });
  });

  describe('devalidateDocument', () => {
    it('should reject devalidation without document type', async () => {
      const result = await service.devalidateDocument(null as any, 'doc-1', 'user-1', 'reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Document type is required');
    });

    it('should reject devalidation without reason', async () => {
      const result = await service.devalidateDocument(DocumentType.INVOICE, 'doc-1', 'user-1', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('reason is required');
    });

    it('should reject devalidation of non-validated document', async () => {
      jest.spyOn(service as any, 'getDocumentData').mockResolvedValue({
        isValidated: false
      });

      const result = await service.devalidateDocument(DocumentType.INVOICE, 'doc-1', 'user-1', 'Test reason');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not validated');
    });
  });

  describe('Document Type Enum', () => {
    it('should have all expected document types', () => {
      expect(DocumentType.INVOICE).toBe('invoice');
      expect(DocumentType.PURCHASE_INVOICE).toBe('purchase_invoice');
      expect(DocumentType.BANK_STATEMENT).toBe('bank_statement');
      expect(DocumentType.CASH_RECEIPT).toBe('cash_receipt');
      expect(DocumentType.CREDIT_NOTE).toBe('credit_note');
      expect(DocumentType.DEBIT_NOTE).toBe('debit_note');
      expect(DocumentType.PAYROLL).toBe('payroll');
    });
  });
});

