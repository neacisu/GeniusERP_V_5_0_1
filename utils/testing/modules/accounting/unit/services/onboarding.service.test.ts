/**
 * OnboardingService Unit Tests
 * 
 * Tests the onboarding service for new companies
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OnboardingService } from '../../../../../../server/modules/accounting/services/onboarding.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/accounting-settings.service');
jest.mock('../../../../../../server/services/redis.service');

describe('OnboardingService Unit Tests', () => {
  let onboardingService: OnboardingService;
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

    onboardingService = new OnboardingService();
    (onboardingService as any).redisService = mockRedisService;
  });

  describe('Onboarding Status', () => {
    it('should get onboarding status for company and fiscal year', async () => {
      const companyId = 'company-1';
      const fiscalYear = 2024;
      mockRedisService.getCached.mockResolvedValue(null);

      const status = await onboardingService.getOnboardingStatus(companyId, fiscalYear);

      expect(status).toBeDefined();
      expect(status.started).toBeDefined();
      expect(status.completed).toBeDefined();
    });

    it('should cache onboarding status with 5min TTL', async () => {
      const companyId = 'company-1';
      const fiscalYear = 2024;
      mockRedisService.getCached.mockResolvedValue(null);

      await onboardingService.getOnboardingStatus(companyId, fiscalYear);

      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Chart of Accounts Import', () => {
    it('should import chart of accounts', async () => {
      const companyId = 'company-1';
      const accounts = [
        {
          code: '401',
          name: 'Furnizori',
          accountFunction: 'P' as const,
          grade: 3,
          groupId: '40',
          description: 'Suppliers'
        }
      ];

      await onboardingService.importChartOfAccounts(companyId, accounts);

      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('Opening Balances Import', () => {
    it('should import opening balances', async () => {
      const companyId = 'company-1';
      const balances = [
        {
          accountCode: '411',
          accountName: 'Clienți',
          debitBalance: '10000',
          creditBalance: '0'
        }
      ];
      const fiscalYear = 2024;
      const importSource = 'MANUAL';
      const userId = 'user-1';

      await onboardingService.importOpeningBalances(companyId, balances, fiscalYear, importSource as any, userId);

      expect(mockRedisService.del).toHaveBeenCalled();
    });

    it('should validate balance totals', async () => {
      const companyId = 'company-1';
      const fiscalYear = 2024;

      const validation = await onboardingService.validateOpeningBalances(companyId, fiscalYear);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.totalDebit).toBeDefined();
      expect(validation.totalCredit).toBeDefined();
      expect(validation.difference).toBeDefined();
    });
  });

  describe('Onboarding Finalization', () => {
    it('should finalize onboarding', async () => {
      const companyId = 'company-1';
      const fiscalYear = 2024;
      const userId = 'user-1';

      await onboardingService.finalizeOnboarding(companyId, fiscalYear, userId);

      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const companyId = 'company-1';
      const fiscalYear = 2024;
      mockRedisService.getCached.mockRejectedValue(new Error('Database error'));

      await expect(
        onboardingService.getOnboardingStatus(companyId, fiscalYear)
      ).rejects.toThrow();
    });
  });
});

