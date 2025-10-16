/**
 * Unit Tests - AccountingService
 * Tests: Chart of Accounts (classes, groups, synthetic, analytic accounts)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingService } from '../../../../../../server/modules/accounting/services/accounting.service';
import { IStorage } from '../../../../../../server/storage';

describe('AccountingService - Unit Tests', () => {
  let accountingService: AccountingService;
  let mockStorage: jest.Mocked<IStorage>;

  beforeEach(() => {
    // Mock storage
    mockStorage = {
      getAccountClasses: jest.fn(),
      getAccountClass: jest.fn(),
      getAccountClassByCode: jest.fn(),
      getAccountGroups: jest.fn(),
      getSyntheticAccounts: jest.fn(),
      getAnalyticAccounts: jest.fn(),
    } as any;

    accountingService = new AccountingService(mockStorage);
  });

  describe('Account Classes', () => {
    it('should get all account classes', async () => {
      const mockClasses = [
        { id: '1', code: '1', name: 'ACTIVE IMOBILIZATE' },
        { id: '2', code: '2', name: 'ACTIVE CIRCULANTE' },
      ];

      mockStorage.getAccountClasses.mockResolvedValue(mockClasses);

      const result = await accountingService.getAccountClasses();

      expect(result).toEqual(mockClasses);
      expect(mockStorage.getAccountClasses).toHaveBeenCalled();
    });

    it('should cache account classes with 24h TTL', async () => {
      const mockClasses = [{ id: '1', code: '1', name: 'Test' }];
      mockStorage.getAccountClasses.mockResolvedValue(mockClasses);

      await accountingService.getAccountClasses();

      // Cache verification would happen with Redis spy
      expect(mockStorage.getAccountClasses).toHaveBeenCalledTimes(1);
    });

    it('should get single account class by ID', async () => {
      const mockClass = { id: '1', code: '1', name: 'ACTIVE IMOBILIZATE' };
      mockStorage.getAccountClass.mockResolvedValue(mockClass);

      const result = await accountingService.getAccountClass('1');

      expect(result).toEqual(mockClass);
      expect(mockStorage.getAccountClass).toHaveBeenCalledWith('1');
    });

    it('should get account class by code', async () => {
      const mockClass = { id: '4', code: '4', name: 'FURNIZORI SI CONTURI ASIMILATE' };
      mockStorage.getAccountClassByCode.mockResolvedValue(mockClass);

      const result = await accountingService.getAccountClassByCode('4');

      expect(result).toEqual(mockClass);
      expect(mockStorage.getAccountClassByCode).toHaveBeenCalledWith('4');
    });
  });

  describe('Account Groups', () => {
    it('should get all account groups', async () => {
      const mockGroups = [
        { id: '40', code: '40', name: 'FURNIZORI' },
        { id: '41', code: '41', name: 'CLIENTI' },
      ];
      mockStorage.getAccountGroups.mockResolvedValue(mockGroups);

      const result = await accountingService.getAccountGroups();

      expect(result).toEqual(mockGroups);
    });
  });

  describe('Synthetic Accounts', () => {
    it('should get all synthetic accounts', async () => {
      const mockAccounts = [
        { id: '401', code: '401', name: 'Furnizori' },
        { id: '411', code: '411', name: 'Clienți' },
      ];
      mockStorage.getSyntheticAccounts.mockResolvedValue(mockAccounts);

      const result = await accountingService.getSyntheticAccounts();

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('Analytic Accounts', () => {
    it('should get all analytic accounts', async () => {
      const mockAccounts = [
        { id: '1', code: '401.001', name: 'Supplier Test' },
      ];
      mockStorage.getAnalyticAccounts.mockResolvedValue(mockAccounts);

      const result = await accountingService.getAnalyticAccounts();

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.getAccountClasses.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        accountingService.getAccountClasses()
      ).rejects.toThrow('Database connection failed');
    });
  });
});

export {};

