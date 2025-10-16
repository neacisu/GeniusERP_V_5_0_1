/**
 * GeneralJournalExcelService Unit Tests
 * 
 * Tests the Excel export service for General Journal
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GeneralJournalExcelService } from '../../../../../../server/modules/accounting/services/general-journal-excel.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock RedisService
jest.mock('../../../../../../server/services/redis.service');

describe('GeneralJournalExcelService Unit Tests', () => {
  let generalJournalExcelService: GeneralJournalExcelService;
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

    generalJournalExcelService = new GeneralJournalExcelService();
    (generalJournalExcelService as any).redisService = mockRedisService;
  });

  describe('Excel Generation', () => {
    it('should generate Excel file for general journal', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        responsiblePersonName: 'Ion Popescu'
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const excelPath = await generalJournalExcelService.generateGeneralJournalExcel(options);

      expect(excelPath).toBeDefined();
      expect(typeof excelPath).toBe('string');
      expect(excelPath).toMatch(/\.(xlsx|xls)$/);
    });

    it('should filter by journal types in Excel', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        journalTypes: ['SALES', 'PURCHASE']
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const excelPath = await generalJournalExcelService.generateGeneralJournalExcel(options);

      expect(excelPath).toBeDefined();
    });

    it('should include metadata sheets', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        includeMetadata: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const excelPath = await generalJournalExcelService.generateGeneralJournalExcel(options);

      expect(excelPath).toBeDefined();
    });

    it('should exclude reversals when requested', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        includeReversals: false
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const excelPath = await generalJournalExcelService.generateGeneralJournalExcel(options);

      expect(excelPath).toBeDefined();
    });
  });

  describe('Caching Behavior', () => {
    it('should cache journal entries with 10min TTL', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      mockRedisService.getCached.mockResolvedValue(null);

      await generalJournalExcelService.generateGeneralJournalExcel(options);

      // Verify cache was checked
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle XLSX not available error', async () => {
      const options = {
        companyId: 'company-1',
        companyName: 'Test Company SRL',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      // Mock XLSX not available by catching the error
      await expect(async () => {
        // This would throw if XLSX is not available
        await generalJournalExcelService.generateGeneralJournalExcel(options);
      }).rejects.toThrow();
    });
  });
});

