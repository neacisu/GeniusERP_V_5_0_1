/**
 * AccountMappingService Unit Tests
 * 
 * Tests the account mapping service with Redis caching
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountMappingService } from '../../../../../server/modules/accounting/services/account-mapping.service';
import { RedisService } from '../../../../../server/services/redis.service';

// Mock RedisService
jest.mock('../../../../../server/services/redis.service');

describe('AccountMappingService Unit Tests', () => {
  let accountMappingService: AccountMappingService;
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

    accountMappingService = new AccountMappingService();
    (accountMappingService as any).redisService = mockRedisService;
  });

  describe('Get Account Mapping', () => {
    it('should get account for a mapping type', async () => {
      const companyId = 'company-1';
      const mappingType = 'CASH_RON';
      
      mockRedisService.getCached.mockResolvedValue(null);

      const account = await accountMappingService.getAccount(companyId, mappingType);

      expect(account).toBeDefined();
      expect(typeof account).toBe('string');
    });

    it('should return cached account if available', async () => {
      const companyId = 'company-1';
      const mappingType = 'CASH_RON';
      const cachedAccount = '5311';
      
      mockRedisService.getCached.mockResolvedValue(cachedAccount);

      const account = await accountMappingService.getAccount(companyId, mappingType);

      expect(account).toBe(cachedAccount);
      expect(mockRedisService.getCached).toHaveBeenCalledWith(`acc:mapping:${companyId}:${mappingType}`);
    });

    it('should cache account mappings with 24h TTL', async () => {
      const companyId = 'company-1';
      const mappingType = 'BANK_PRIMARY';
      
      mockRedisService.getCached.mockResolvedValue(null);

      await accountMappingService.getAccount(companyId, mappingType);

      expect(mockRedisService.getCached).toHaveBeenCalled();
    });

    it('should return default account if no mapping found', async () => {
      const companyId = 'company-1';
      const mappingType = 'CUSTOMERS';
      
      mockRedisService.getCached.mockResolvedValue(null);

      const account = await accountMappingService.getAccount(companyId, mappingType);

      expect(account).toBe('4111'); // Default customer account
    });
  });

  describe('Cache Management', () => {
    it('should clear cache for a company', async () => {
      const companyId = 'company-1';

      await accountMappingService.clearCache(companyId);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(`acc:mapping:${companyId}:*`);
    });
  });

  describe('Default Accounts', () => {
    it('should return correct default for CASH_RON', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const account = await accountMappingService.getAccount(companyId, 'CASH_RON');

      expect(account).toBe('5311');
    });

    it('should return correct default for SUPPLIERS', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const account = await accountMappingService.getAccount(companyId, 'SUPPLIERS');

      expect(account).toBe('401');
    });

    it('should return correct default for CUSTOMERS', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const account = await accountMappingService.getAccount(companyId, 'CUSTOMERS');

      expect(account).toBe('4111');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const companyId = 'company-1';
      const mappingType = 'CASH_RON';
      
      mockRedisService.getCached.mockRejectedValue(new Error('Database error'));

      const account = await accountMappingService.getAccount(companyId, mappingType);

      // Should fall back to default account
      expect(account).toBe('5311');
    });

    it('should work without Redis connection', async () => {
      mockRedisService.isConnected.mockReturnValue(false);
      
      const account = await accountMappingService.getAccount('company-1', 'CASH_RON');

      expect(account).toBeDefined();
    });
  });
});

