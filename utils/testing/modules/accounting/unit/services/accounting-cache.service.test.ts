/**
 * Unit Tests: AccountingCacheService
 * 
 * Testează wrapper-ul Redis specific accounting
 * - Chart of Accounts caching
 * - Account balances caching
 * - Trial balance caching
 * - Settings caching
 * - Journal reports caching
 * - Invalidation patterns
 */

import { AccountingCacheService, CacheTTL, CachePrefix } from '../../../../../../server/modules/accounting/services/accounting-cache.service';
import { RedisService } from '../../../../../../server/services/redis.service';

jest.mock('../../../../../../server/services/redis.service');

describe('AccountingCacheService', () => {
  let service: AccountingCacheService;
  let mockRedisService: jest.Mocked<RedisService>;

  beforeEach(() => {
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockRedisService.connect = jest.fn().mockResolvedValue(undefined);
    mockRedisService.getCached = jest.fn();
    mockRedisService.setCached = jest.fn().mockResolvedValue(undefined);
    mockRedisService.invalidatePattern = jest.fn().mockResolvedValue(undefined);

    service = new AccountingCacheService();
    (service as any).redis = mockRedisService;
  });

  describe('Chart of Accounts Caching', () => {
    it('should cache and retrieve account classes', async () => {
      const mockData = [{ id: '1', code: '1', name: 'Active' }];
      mockRedisService.getCached.mockResolvedValue(mockData);

      const result = await service.getAccountClasses('company-1');

      expect(result).toEqual(mockData);
      expect(mockRedisService.getCached).toHaveBeenCalledWith(`${CachePrefix.ACCOUNT_CLASS}:company-1`);
    });

    it('should set account classes with correct TTL', async () => {
      const mockData = [{ id: '1', code: '1', name: 'Active' }];

      await service.setAccountClasses(mockData, 'company-1');

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_CLASS}:company-1`,
        mockData,
        CacheTTL.ACCOUNT_CLASSES
      );
    });

    it('should invalidate account classes cache', async () => {
      await service.invalidateAccountClasses('company-1');

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_CLASS}:company-1*`
      );
    });

    it('should cache synthetic accounts', async () => {
      const mockData = [{ id: '1', code: '101', name: 'Materii prime' }];

      await service.setSyntheticAccounts('company-1', mockData);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.SYNTHETIC_ACCOUNT}:company-1`,
        mockData,
        CacheTTL.SYNTHETIC_ACCOUNTS
      );
    });
  });

  describe('Account Balances Caching', () => {
    it('should cache and retrieve account balance', async () => {
      mockRedisService.getCached.mockResolvedValue(5000);

      const result = await service.getAccountBalance('company-1', 'account-1');

      expect(result).toBe(5000);
      expect(mockRedisService.getCached).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_BALANCE}:company-1:account-1:current`
      );
    });

    it('should cache account balance with date', async () => {
      const date = new Date('2025-01-15');

      await service.setAccountBalance('company-1', 'account-1', 10000, date);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_BALANCE}:company-1:account-1:2025-01-15`,
        10000,
        CacheTTL.ACCOUNT_BALANCE
      );
    });

    it('should invalidate multiple account balances', async () => {
      const accountIds = ['account-1', 'account-2', 'account-3'];

      await service.invalidateAccountBalances('company-1', accountIds);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledTimes(3);
      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_BALANCE}:company-1:account-1:*`
      );
    });
  });

  describe('Trial Balance Caching', () => {
    it('should cache trial balance for period', async () => {
      const mockTrialBalance = { accounts: [], totalDebit: 0, totalCredit: 0 };

      await service.setTrialBalance('company-1', 2025, 1, mockTrialBalance);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.TRIAL_BALANCE}:company-1:2025-1`,
        mockTrialBalance,
        CacheTTL.TRIAL_BALANCE
      );
    });

    it('should retrieve cached trial balance', async () => {
      const mockTrialBalance = { accounts: [], totalDebit: 0, totalCredit: 0 };
      mockRedisService.getCached.mockResolvedValue(mockTrialBalance);

      const result = await service.getTrialBalance('company-1', 2025, 1);

      expect(result).toEqual(mockTrialBalance);
    });

    it('should invalidate trial balance for specific period', async () => {
      await service.invalidateTrialBalance('company-1', 2025, 1);

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        `${CachePrefix.TRIAL_BALANCE}:company-1:2025-1`
      );
    });

    it('should invalidate all trial balances for company', async () => {
      await service.invalidateTrialBalance('company-1');

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        `${CachePrefix.TRIAL_BALANCE}:company-1:*`
      );
    });
  });

  describe('Settings Caching', () => {
    it('should cache accounting settings', async () => {
      const mockSettings = { fiscalYearStart: 1, vatRate: 19 };

      await service.setSettings('company-1', mockSettings);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.SETTINGS}:company-1`,
        mockSettings,
        CacheTTL.ACCOUNTING_SETTINGS
      );
    });

    it('should retrieve cached settings', async () => {
      const mockSettings = { fiscalYearStart: 1, vatRate: 19 };
      mockRedisService.getCached.mockResolvedValue(mockSettings);

      const result = await service.getSettings('company-1');

      expect(result).toEqual(mockSettings);
    });

    it('should invalidate settings cache', async () => {
      await service.invalidateSettings('company-1');

      expect(mockRedisService.invalidatePattern).toHaveBeenCalledWith(
        `${CachePrefix.SETTINGS}:company-1`
      );
    });
  });

  describe('Journal Reports Caching', () => {
    it('should cache sales journal', async () => {
      const mockJournal = { entries: [], total: 0 };

      await service.setSalesJournal('company-1', '2025-01-01', '2025-01-31', mockJournal);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        `${CachePrefix.SALES_JOURNAL}:company-1:2025-01-01:2025-01-31`,
        mockJournal,
        CacheTTL.SALES_JOURNAL
      );
    });

    it('should retrieve cached sales journal', async () => {
      const mockJournal = { entries: [], total: 0 };
      mockRedisService.getCached.mockResolvedValue(mockJournal);

      const result = await service.getSalesJournal('company-1', '2025-01-01', '2025-01-31');

      expect(result).toEqual(mockJournal);
    });
  });

  describe('Connection Management', () => {
    it('should connect to Redis', async () => {
      await service.connect();

      expect(mockRedisService.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate correct keys for account classes without companyId', async () => {
      await service.getAccountClasses();

      expect(mockRedisService.getCached).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_CLASS}:all`
      );
    });

    it('should generate correct keys with date for account balance', async () => {
      const date = new Date('2025-12-31');

      await service.getAccountBalance('company-1', 'account-1', date);

      expect(mockRedisService.getCached).toHaveBeenCalledWith(
        `${CachePrefix.ACCOUNT_BALANCE}:company-1:account-1:2025-12-31`
      );
    });
  });
});

