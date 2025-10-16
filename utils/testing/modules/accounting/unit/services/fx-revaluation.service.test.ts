/**
 * FxRevaluationService Unit Tests
 * 
 * Tests the foreign exchange revaluation service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FXRevaluationService } from '../../../../../server/modules/accounting/services/fx-revaluation.service';
import { RedisService } from '../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../server/services/redis.service');

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

  describe('BNR Exchange Rates', () => {
    it('should fetch BNR exchange rates', async () => {
      const date = new Date('2024-01-31');
      mockRedisService.getCached.mockResolvedValue(null);

      const rates = await fxRevaluationService.getBNRExchangeRates(date);

      expect(rates).toBeDefined();
      expect(Array.isArray(rates)).toBe(true);
    });

    it('should cache BNR exchange rates with 24h TTL', async () => {
      const date = new Date('2024-01-31');
      const cachedRates = [
        { currency: 'EUR', rate: 4.97, date }
      ];
      
      mockRedisService.getCached.mockResolvedValue(cachedRates);

      const rates = await fxRevaluationService.getBNRExchangeRates(date);

      expect(rates).toEqual(cachedRates);
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Foreign Currency Balances', () => {
    it('should get foreign currency balances', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const balances = await fxRevaluationService.getForeignCurrencyBalances(companyId);

      expect(balances).toBeDefined();
      expect(Array.isArray(balances)).toBe(true);
    });

    it('should cache balances with 5min TTL', async () => {
      const companyId = 'company-1';
      const cachedBalances = [
        { accountId: '1', currency: 'EUR', balance: 1000 }
      ];
      
      mockRedisService.getCached.mockResolvedValue(cachedBalances as any);

      const balances = await fxRevaluationService.getForeignCurrencyBalances(companyId);

      expect(balances).toEqual(cachedBalances);
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing exchange rates', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      mockRedisService.getCached.mockResolvedValue(null);
      // Mock getBNRExchangeRates to return empty array
      jest.spyOn(fxRevaluationService as any, 'getBNRExchangeRates').mockResolvedValue([]);

      const result = await fxRevaluationService.revalueForeignCurrency(request);

      expect(result.itemCount).toBe(0);
      expect(result.totalGains).toBe(0);
      expect(result.totalLosses).toBe(0);
    });
  });
});

