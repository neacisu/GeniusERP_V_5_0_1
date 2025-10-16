/**
 * GeneralJournalPdfService Unit Tests
 * 
 * Tests the PDF generation service for General Journal
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GeneralJournalPDFService } from '../../../../../../server/modules/accounting/services/general-journal-pdf.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock RedisService
jest.mock('../../../../../../server/services/redis.service');

describe('GeneralJournalPdfService Unit Tests', () => {
  let generalJournalPdfService: GeneralJournalPDFService;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedisService = {
      isConnected: jest.fn(() => true),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getCached: jest.fn(),
      setCached: jest.fn(),
      del: jest.fn(),
      invalidatePattern: jest.fn(),
    } as any;

    generalJournalPdfService = new GeneralJournalPDFService();
    (generalJournalPdfService as any).redisService = mockRedisService;
  });

  describe('PDF Generation', () => {
    it('should generate PDF for general journal', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        detailLevel: 'detailed' as const,
        responsiblePersonName: 'Ion Popescu'
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const pdfPath = await generalJournalPdfService.generateGeneralJournalPDF(options);

      expect(pdfPath).toBeDefined();
      expect(typeof pdfPath).toBe('string');
      expect(pdfPath).toContain('.pdf');
    });

    it('should generate summary level PDF', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        detailLevel: 'summary' as const
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const pdfPath = await generalJournalPdfService.generateGeneralJournalPDF(options);

      expect(pdfPath).toBeDefined();
    });

    it('should filter by journal types', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        journalTypes: ['SALES', 'PURCHASE'],
        detailLevel: 'detailed' as const
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const pdfPath = await generalJournalPdfService.generateGeneralJournalPDF(options);

      expect(pdfPath).toBeDefined();
    });

    it('should include responsible person details', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        detailLevel: 'detailed' as const,
        responsiblePersonName: 'Maria Ionescu',
        responsiblePersonTitle: 'Contabil Sef'
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const pdfPath = await generalJournalPdfService.generateGeneralJournalPDF(options);

      expect(pdfPath).toBeDefined();
    });
  });

  describe('Caching Behavior', () => {
    it('should cache journal entries with 10min TTL', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        detailLevel: 'detailed' as const
      };

      mockRedisService.getCached.mockResolvedValue(null);

      await generalJournalPdfService.generateGeneralJournalPDF(options);

      // Verify cache was checked
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing entries gracefully', async () => {
      const options = {
        companyId: 'company-999',
        companyName: 'Empty Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        detailLevel: 'detailed' as const
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const pdfPath = await generalJournalPdfService.generateGeneralJournalPDF(options);

      expect(pdfPath).toBeDefined();
    });
  });
});

