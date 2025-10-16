/// <reference types="jest" />
/**
 * Unit Tests: FinancialReportsService
 * 
 * Testează serviciul pentru rapoarte financiare și KPIs
 * - Financial reports cu cache
 * - Financial indicators cu cache
 * - Cache invalidation
 */

import { FinancialReportsService } from '../../../../../../server/modules/accounting/services/financial-reports.service';
import { RedisService } from '../../../../../../server/services/redis.service';
import { getDrizzle } from '../../../../../../server/common/drizzle';

jest.mock('../../../../../../server/services/redis.service');
jest.mock('../../../../../../server/common/drizzle');

describe('FinancialReportsService', () => {
  let service: FinancialReportsService;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockDb: any;

  beforeEach(() => {
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockRedisService.connect = jest.fn().mockResolvedValue(undefined);
    mockRedisService.getCached = jest.fn();
    mockRedisService.setCached = jest.fn().mockResolvedValue(undefined);
    mockRedisService.invalidatePattern = jest.fn().mockResolvedValue(undefined);

    mockDb = {
      $client: {
        unsafe: jest.fn()
      }
    };
    (getDrizzle as jest.Mock).mockReturnValue(mockDb);

    (RedisService as jest.Mock).mockImplementation(() => mockRedisService);

    service = new FinancialReportsService();
  });

  describe('getFinancialReports', () => {
    it('should return cached reports if available', async () => {
      const cachedReports = [
        { id: '1', name: 'Vânzări', value: 100000, type: 'income' as const }
      ];
      mockRedisService.getCached.mockResolvedValue(cachedReports);

      const result = await service.getFinancialReports('company-1');

      expect(result).toEqual(cachedReports);
      expect(mockRedisService.getCached).toHaveBeenCalledWith('acc:financial-reports:company-1');
      expect(mockDb.$client.unsafe).not.toHaveBeenCalled();
    });

    it('should calculate reports from DB if cache miss', async () => {
      mockRedisService.getCached.mockResolvedValue(null);
      mockDb.$client.unsafe
        .mockResolvedValueOnce([{ total: '100000' }]) // sales
        .mockResolvedValueOnce([{ total: '50000' }])  // purchases
        .mockResolvedValueOnce([{ total: '10000' }])  // cash
        .mockResolvedValueOnce([{ total: '90000' }]); // bank

      const result = await service.getFinancialReports('company-1');

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({ name: 'Vânzări', value: 100000, type: 'income' });
      expect(result[1]).toMatchObject({ name: 'Achiziții', value: 50000, type: 'expense' });
      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        'acc:financial-reports:company-1',
        result,
        300 // 5min TTL
      );
    });

    it('should handle zero values from DB', async () => {
      mockRedisService.getCached.mockResolvedValue(null);
      mockDb.$client.unsafe
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ total: '0' }])
        .mockResolvedValueOnce([{ total: '0' }]);

      const result = await service.getFinancialReports('company-1');

      expect(result).toHaveLength(4);
      expect(result[0].value).toBe(0);
      expect(result[1].value).toBe(0);
    });
  });

  describe('getFinancialIndicators', () => {
    it('should return cached indicators if available', async () => {
      const cachedIndicators = {
        totalRevenue: 100000,
        totalExpenses: 50000,
        profit: 50000,
        profitMargin: 50,
        cashBalance: 10000,
        bankBalance: 90000,
        totalAssets: 200000,
        totalLiabilities: 50000,
        netWorth: 150000
      };
      mockRedisService.getCached.mockResolvedValue(cachedIndicators);

      const result = await service.getFinancialIndicators('company-1');

      expect(result).toEqual(cachedIndicators);
      expect(mockRedisService.getCached).toHaveBeenCalledWith('acc:financial-indicators:company-1');
    });

    it('should calculate indicators from DB if cache miss', async () => {
      mockRedisService.getCached.mockResolvedValue(null);
      mockDb.$client.unsafe
        .mockResolvedValueOnce([{ total: '100000' }]) // revenue
        .mockResolvedValueOnce([{ total: '50000' }])  // expenses
        .mockResolvedValueOnce([{ total: '10000' }])  // cash
        .mockResolvedValueOnce([{ total: '90000' }])  // bank
        .mockResolvedValueOnce([{ total: '200000' }]) // assets
        .mockResolvedValueOnce([{ total: '50000' }]); // liabilities

      const result = await service.getFinancialIndicators('company-1');

      expect(result.totalRevenue).toBe(100000);
      expect(result.totalExpenses).toBe(50000);
      expect(result.profit).toBe(50000);
      expect(result.profitMargin).toBe(50);
      expect(result.cashBalance).toBe(10000);
      expect(result.bankBalance).toBe(90000);
      expect(result.totalAssets).toBe(200000);
      expect(result.totalLiabilities).toBe(50000);
      expect(result.netWorth).toBe(150000);
      
      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        'acc:financial-indicators:company-1',
        result,
        300 // 5min TTL
      );
    });

    it('should handle zero revenue for profit margin calculation', async () => {
      mockRedisService.getCached.mockResolvedValue(null);
      mockDb.$client.unsafe
        .mockResolvedValueOnce([{ total: '0' }])      // revenue = 0
        .mockResolvedValueOnce([{ total: '50000' }])  // expenses
        .mockResolvedValueOnce([{ total: '10000' }])
        .mockResolvedValueOnce([{ total: '90000' }])
        .mockResolvedValueOnce([{ total: '200000' }])
        .mockResolvedValueOnce([{ total: '50000' }]);

      const result = await service.getFinancialIndicators('company-1');

      expect(result.profitMargin).toBe(0); // Should not throw division by zero
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate both reports and indicators cache', async () => {
      await service.invalidateCache('company-1');

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith('acc:financial-reports:company-1');
      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith('acc:financial-indicators:company-1');
    });
  });
});

