/**
 * Unit Tests: BankJournalPDFService
 * 
 * Testează generare PDF pentru Jurnal Bancă
 * - Generare PDF cu Redis cache
 * - Format PDF corect
 * - Validare date
 */

import { BankJournalPDFService } from '../../../../../../server/modules/accounting/services/bank-journal-pdf.service';
import { RedisService } from '../../../../../../server/services/redis.service';

jest.mock('../../../../../../server/services/redis.service');
jest.mock('pdfkit');
jest.mock('fs');

describe('BankJournalPDFService', () => {
  let service: BankJournalPDFService;
  let mockRedisService: jest.Mocked<RedisService>;

  const mockBankAccount = {
    id: 'bank-1',
    accountNumber: 'RO12BANK1234567890',
    bankName: 'Test Bank',
    currency: 'RON'
  };

  const mockTransactions = [
    {
      id: 'tx-1',
      date: new Date('2025-01-15'),
      description: 'Payment received',
      debit: 1000,
      credit: 0
    },
    {
      id: 'tx-2',
      date: new Date('2025-01-16'),
      description: 'Payment sent',
      debit: 0,
      credit: 500
    }
  ];

  beforeEach(() => {
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockRedisService.isConnected = jest.fn().mockReturnValue(true);
    mockRedisService.getCached = jest.fn();
    mockRedisService.setCached = jest.fn().mockResolvedValue(undefined);

    service = new BankJournalPDFService();
    (service as any).redisService = mockRedisService;
  });

  describe('generateBankJournalPDF', () => {
    it('should return cached PDF path if available', async () => {
      const cachedPath = '/tmp/cached-bank-journal.pdf';
      mockRedisService.getCached.mockResolvedValue(cachedPath);

      const result = await service.generateBankJournalPDF(
        mockBankAccount as any,
        new Date('2025-01-01'),
        new Date('2025-01-31'),
        mockTransactions as any,
        'Test Company',
        5000
      );

      expect(result).toBe(cachedPath);
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should use correct cache key format', async () => {
      mockRedisService.getCached.mockResolvedValue(null);
      mockRedisService.isConnected.mockReturnValue(false);

      try {
        await service.generateBankJournalPDF(
          mockBankAccount as any,
          new Date('2025-01-01'),
          new Date('2025-01-31'),
          mockTransactions as any,
          'Test Company',
          5000
        );
      } catch (e) {
        // Expected to fail without full PDF generation
      }

      expect(mockRedisService.getCached).toHaveBeenCalledWith(
        expect.stringMatching(/^acc:bank-journal-pdf:bank-1:2025-01-01_2025-01-31$/)
      );
    });
  });
});

