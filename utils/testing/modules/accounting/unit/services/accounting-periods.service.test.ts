/**
 * AccountingPeriodsService Unit Tests
 * 
 * Tests the accounting periods management service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingPeriodsService } from '../../../../../../server/modules/accounting/services/accounting-periods.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../../server/modules/accounting/services/period-lock.service');
jest.mock('../../../../../../server/services/redis.service');

describe('AccountingPeriodsService Unit Tests', () => {
  let accountingPeriodsService: AccountingPeriodsService;
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

    accountingPeriodsService = new AccountingPeriodsService();
    (accountingPeriodsService as any).redisService = mockRedisService;
  });

  describe('Period Creation', () => {
    it('should create a new accounting period', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'open' as const
      };

      const period = await accountingPeriodsService.createPeriod(request);

      expect(period).toBeDefined();
      expect(period.companyId).toBe(request.companyId);
      expect(mockRedisService.invalidatePattern).toHaveBeenCalled();
    });

    it('should prevent overlapping periods', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      await expect(
        accountingPeriodsService.createPeriod(request)
      ).rejects.toThrow();
    });
  });

  describe('Period Status Updates', () => {
    it('should update period status', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      const request = {
        status: 'soft_close' as const,
        closedBy: 'user-1',
        reason: 'Month-end closure'
      };

      await accountingPeriodsService.updatePeriodStatus(companyId, periodId, request);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalled();
    });

    it('should handle soft close', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      const request = {
        status: 'soft_close' as const,
        closedBy: 'user-1'
      };

      const result = await accountingPeriodsService.updatePeriodStatus(companyId, periodId, request);

      expect(result).toBeDefined();
    });

    it('should handle hard close', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      const request = {
        status: 'hard_close' as const,
        closedBy: 'user-1'
      };

      const result = await accountingPeriodsService.updatePeriodStatus(companyId, periodId, request);

      expect(result).toBeDefined();
    });
  });

  describe('Period Retrieval', () => {
    it('should get periods for company', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const periods = await accountingPeriodsService.getPeriodsForCompany(companyId);

      expect(periods).toBeDefined();
      expect(Array.isArray(periods)).toBe(true);
    });

    it('should get period by ID', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const period = await accountingPeriodsService.getPeriodById(companyId, periodId);

      expect(period).toBeDefined();
    });

    it('should get period by date', async () => {
      const companyId = 'company-1';
      const date = new Date('2024-01-15');

      const period = await accountingPeriodsService.getPeriodByDate(companyId, date);

      expect(period).toBeDefined();
    });
  });

  describe('Caching Behavior', () => {
    it('should cache periods list with 12h TTL', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      await accountingPeriodsService.getPeriodsForCompany(companyId);

      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should cache individual period with 6h TTL', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      mockRedisService.getCached.mockResolvedValue(null);

      await accountingPeriodsService.getPeriodById(companyId, periodId);

      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should invalidate cache on period creation', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 2,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29')
      };

      await accountingPeriodsService.createPeriod(request);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        expect.stringContaining('acc:periods:company-1')
      );
    });

    it('should invalidate cache on status update', async () => {
      const companyId = 'company-1';
      const periodId = 'period-1';
      const request = {
        status: 'soft_close' as const,
        closedBy: 'user-1'
      };

      await accountingPeriodsService.updatePeriodStatus(companyId, periodId, request);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid period dates', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01') // End before start
      };

      await expect(
        accountingPeriodsService.createPeriod(request)
      ).rejects.toThrow();
    });
  });
});

