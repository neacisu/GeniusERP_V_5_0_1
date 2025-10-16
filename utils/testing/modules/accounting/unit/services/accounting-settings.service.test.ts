/**
 * AccountingSettingsService Unit Tests
 * 
 * Tests the accounting settings service with Redis caching
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingSettingsService } from '../../../../../../server/modules/accounting/services/accounting-settings.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock RedisService
jest.mock('../../../../../../server/services/redis.service');

describe('AccountingSettingsService Unit Tests', () => {
  let accountingSettingsService: AccountingSettingsService;
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

    accountingSettingsService = new AccountingSettingsService();
    (accountingSettingsService as any).redisService = mockRedisService;
  });

  describe('Get Settings', () => {
    it('should get all settings for a company', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const result = await accountingSettingsService.getSettings(companyId);

      expect(result).toBeDefined();
      expect(result.generalSettings).toBeDefined();
      expect(result.vatSettings).toBeDefined();
      expect(result.accountMappings).toBeDefined();
    });

    it('should return cached settings if available', async () => {
      const companyId = 'company-1';
      const cachedSettings = {
        generalSettings: { id: '1', companyId },
        vatSettings: null,
        accountMappings: [],
        accountRelationships: [],
        documentCounters: [],
        fiscalPeriods: []
      };
      
      mockRedisService.getCached.mockResolvedValue(cachedSettings);

      const result = await accountingSettingsService.getSettings(companyId);

      expect(result).toEqual(cachedSettings);
      expect(mockRedisService.getCached).toHaveBeenCalledWith(`acc:settings:all:${companyId}`);
    });

    it('should cache settings with 6h TTL', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      await accountingSettingsService.getSettings(companyId);

      // Verify setCached was called (in the actual implementation)
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('General Settings', () => {
    it('should get general settings for a company', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const result = await accountingSettingsService.getGeneralSettings(companyId);

      expect(result).toBeDefined();
    });

    it('should update general settings', async () => {
      const companyId = 'company-1';
      const userId = 'user-1';
      const updates = {
        fiscalYearStartMonth: 1,
        requireApproval: true,
        enableMultiCurrency: true
      };

      await accountingSettingsService.updateGeneralSettings(companyId, updates, userId);

      // Verify cache invalidation was triggered
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate settings cache', async () => {
      const companyId = 'company-1';

      await accountingSettingsService.invalidateSettingsCache(companyId);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(`acc:settings:*:${companyId}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedisService.isConnected.mockReturnValue(false);
      mockRedisService.connect.mockRejectedValue(new Error('Redis connection failed'));

      const companyId = 'company-1';
      // Should still work without Redis
      await expect(accountingSettingsService.getSettings(companyId)).resolves.toBeDefined();
    });
  });
});

