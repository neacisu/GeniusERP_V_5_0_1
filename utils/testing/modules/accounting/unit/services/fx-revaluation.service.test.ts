/**
 * FxRevaluationService Unit Tests
 * 
 * Tests the foreign exchange revaluation service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FXRevaluationService } from '../../../../../../server/modules/accounting/services/fx-revaluation.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../../server/services/redis.service');

describe('FxRevaluationService Unit Tests', () => {
  let fxRevaluationService: FXRevaluationService;
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

    fxRevaluationService = new FXRevaluationService();
    (fxRevaluationService as any).redisService = mockRedisService;
  });

  describe('FX Revaluation', () => {
    it('should revalue foreign currency balances', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result).toBeDefined();
      expect(result.totalGains).toBeDefined();
      expect(result.totalLosses).toBeDefined();
      expect(result.netDifference).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should filter by specific currency', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        currency: 'EUR',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result).toBeDefined();
    });

    it('should handle dry run mode', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result.dryRun).toBe(true);
      expect(result.ledgerEntryId).toBeUndefined();
    });
  });

  describe('Caching Behavior', () => {
    it('should cache revaluation results', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: false
      };

      mockRedisService.getCached.mockResolvedValue(null);

      await fxRevaluationService.revalueForeignCurrency(request);

      // Verify cache was checked
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: false
      };

      const cachedResult = {
        totalGains: 1000,
        totalLosses: 500,
        netDifference: 500,
        itemCount: 5,
        items: [],
        dryRun: false
      };
      
      mockRedisService.getCached.mockResolvedValue(cachedResult);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result).toEqual(cachedResult);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty revaluation results gracefully', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result).toBeDefined();
      expect(result.totalGains).toBeDefined();
      expect(result.totalLosses).toBeDefined();
      expect(result.netDifference).toBeDefined();
    });

    it('should handle Redis errors gracefully', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockRejectedValue(new Error('Redis connection failed'));

      // Should still work without Redis
      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result).toBeDefined();
    });
  });
});

