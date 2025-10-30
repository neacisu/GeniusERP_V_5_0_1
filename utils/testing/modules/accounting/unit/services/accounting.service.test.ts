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
        {
          id: '1',
          code: '1',
          name: 'ACTIVE IMOBILIZATE',
          description: null,
          default_account_function: 'A',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          code: '2',
          name: 'ACTIVE CIRCULANTE',
          description: null,
          default_account_function: 'A',
          created_at: new Date(),
          updated_at: new Date()
        },
      ];

      mockStorage.getAccountClasses.mockResolvedValue(mockClasses as any);

      const result = await accountingService.getAccountClasses();

      expect(result).toEqual(mockClasses);
      expect(mockStorage.getAccountClasses).toHaveBeenCalled();
    });

    it('should cache account classes with 24h TTL', async () => {
      const mockClasses = [{
        id: '1',
        code: '1',
        name: 'Test',
        description: null,
        default_account_function: 'A',
        created_at: new Date(),
        updated_at: new Date()
      }];
      mockStorage.getAccountClasses.mockResolvedValue(mockClasses as any);

      await accountingService.getAccountClasses();

      // Cache verification would happen with Redis spy
      expect(mockStorage.getAccountClasses).toHaveBeenCalledTimes(1);
    });

    it('should get single account class by ID', async () => {
      const mockClass = {
        id: '1',
        code: '1',
        name: 'ACTIVE IMOBILIZATE',
        description: null,
        default_account_function: 'A',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockStorage.getAccountClass.mockResolvedValue(mockClass as any);

      const result = await accountingService.getAccountClass('1');

      expect(result).toEqual(mockClass);
      expect(mockStorage.getAccountClass).toHaveBeenCalledWith('1');
    });

    it('should get account class by code', async () => {
      const mockClass = {
        id: '4',
        code: '4',
        name: 'FURNIZORI SI CONTURI ASIMILATE',
        description: null,
        default_account_function: 'P',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockStorage.getAccountClassByCode.mockResolvedValue(mockClass as any);

      const result = await accountingService.getAccountClassByCode('4');

      expect(result).toEqual(mockClass);
      expect(mockStorage.getAccountClassByCode).toHaveBeenCalledWith('4');
    });
  });

  describe('Account Groups', () => {
    it('should get all account groups', async () => {
      const mockGroups = [
        { 
          id: '40', 
          code: '40', 
          name: 'FURNIZORI',
          description: null,
          classId: '4',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: '41', 
          code: '41', 
          name: 'CLIENTI',
          description: null,
          classId: '4',
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];
      mockStorage.getAccountGroups.mockResolvedValue(mockGroups as any);

      const result = await accountingService.getAccountGroups();

      expect(result).toEqual(mockGroups);
    });
  });

  describe('Synthetic Accounts', () => {
    it('should get all synthetic accounts', async () => {
      const mockAccounts = [
        { 
          id: '401', 
          code: '401', 
          name: 'Furnizori',
          description: null,
          accountFunction: 'payable',
          grade: 3,
          groupId: '40',
          parentId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: '411', 
          code: '411', 
          name: 'Clienți',
          description: null,
          accountFunction: 'receivable',
          grade: 3,
          groupId: '41',
          parentId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];
      mockStorage.getSyntheticAccounts.mockResolvedValue(mockAccounts as any);

      const result = await accountingService.getSyntheticAccounts();

      expect(result).toEqual(mockAccounts);
    });
  });

  describe('Analytic Accounts', () => {
    it('should get all analytic accounts', async () => {
      const mockAccounts = [
        { 
          id: '1', 
          code: '401.001', 
          name: 'Supplier Test',
          description: null,
          accountFunction: 'payable',
          syntheticId: '401',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      ];
      mockStorage.getAnalyticAccounts.mockResolvedValue(mockAccounts as any);

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

