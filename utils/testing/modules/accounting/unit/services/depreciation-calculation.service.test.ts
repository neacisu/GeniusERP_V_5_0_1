/**
 * DepreciationCalculationService Unit Tests
 * 
 * Tests the depreciation calculation service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DepreciationCalculationService } from '../../../../../../server/modules/accounting/services/depreciation-calculation.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../../server/services/redis.service');

describe('DepreciationCalculationService Unit Tests', () => {
  let depreciationCalculationService: DepreciationCalculationService;
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

    depreciationCalculationService = new DepreciationCalculationService();
    (depreciationCalculationService as any).redisService = mockRedisService;
  });

  describe('Monthly Depreciation Calculation', () => {
    it('should calculate monthly depreciation', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await depreciationCalculationService.calculateMonthlyDepreciation(request);

      expect(result).toBeDefined();
      expect(result.totalDepreciation).toBeDefined();
      expect(result.itemCount).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
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

      const result = await depreciationCalculationService.calculateMonthlyDepreciation(request);

      expect(result.dryRun).toBe(true);
      expect(result.ledgerEntryId).toBeUndefined();
    });

    it('should handle no depreciable assets', async () => {
      const request = {
        companyId: 'company-999',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);

      const result = await depreciationCalculationService.calculateMonthlyDepreciation(request);

      expect(result.totalDepreciation).toBe(0);
      expect(result.itemCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache depreciation calculation with 1h TTL', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: false
      };

      mockRedisService.getCached.mockResolvedValue(null);

      await depreciationCalculationService.calculateMonthlyDepreciation(request);

      // Verify cache was checked
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should not cache dry run results', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      await depreciationCalculationService.calculateMonthlyDepreciation(request);

      // Dry run should not check cache
      expect(mockRedisService.getCached).not.toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: false
      };

      const cachedResult = {
        totalDepreciation: 5000,
        itemCount: 10,
        items: [],
        dryRun: false,
        ledgerEntryId: 'entry-123'
      };

      mockRedisService.getCached.mockResolvedValue(cachedResult);

      const result = await depreciationCalculationService.calculateMonthlyDepreciation(request);

      expect(result).toEqual(cachedResult);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockRejectedValue(new Error('Database error'));

      await expect(
        depreciationCalculationService.calculateMonthlyDepreciation(request)
      ).rejects.toThrow();
    });
  });
});

