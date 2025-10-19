/**
 * Unit Tests - AccountingController
 * 
 * Tests pentru controllerul principal de contabilitate
 * - Chart of Accounts (classes, groups, synthetic, analytic)
 * - Request handling prin BaseController
 * - Error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingController } from '../../../../../../server/modules/accounting/controllers/accounting.controller';
import { AccountingService } from '../../../../../../server/modules/accounting/services/accounting.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

// Mock AccountingService
jest.mock('../../../../../../server/modules/accounting/services/accounting.service');

describe('AccountingController', () => {
  let controller: AccountingController;
  let mockAccountingService: jest.Mocked<AccountingService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockAccountingService = new AccountingService({} as any) as jest.Mocked<AccountingService>;
    controller = new AccountingController(mockAccountingService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin',
        roles: ['admin']
      },
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  describe('Account Classes', () => {
    it('should get all account classes', async () => {
      const mockClasses = [
        { id: '1', code: '1', name: 'Active', description: 'Conturi de active' },
        { id: '2', code: '2', name: 'Pasive', description: 'Conturi de pasive' }
      ];

      mockAccountingService.getAccountClasses.mockResolvedValue(mockClasses as any);

      await controller.getAccountClasses(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAccountClasses).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockClasses
      }));
    });
  });

  describe('Account Groups', () => {
    it('should get all account groups', async () => {
      const mockGroups = [
        { id: '1', code: '10', name: 'Imobilizări necorporale', classId: '1' },
        { id: '2', code: '20', name: 'Imobilizări corporale', classId: '2' }
      ];

      mockAccountingService.getAccountGroups.mockResolvedValue(mockGroups as any);

      await controller.getAccountGroups(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAccountGroups).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should get account groups by class ID (UUID)', async () => {
      const classId = '123e4567-e89b-12d3-a456-426614174000';
      mockReq.params = { classId };

      const mockGroups = [
        { id: '1', code: '10', name: 'Imobilizări necorporale', classId }
      ];

      mockAccountingService.getAccountGroupsByClass.mockResolvedValue(mockGroups as any);

      await controller.getAccountGroupsByClass(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAccountGroupsByClass).toHaveBeenCalledWith(classId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should get account groups by class code', async () => {
      const classCode = '1';
      mockReq.params = { classId: classCode };

      const mockClasses = [
        { id: 'class-uuid-1', code: '1', name: 'Active' }
      ];

      const mockGroups = [
        { id: '1', code: '10', name: 'Imobilizări necorporale', classId: 'class-uuid-1' }
      ];

      mockAccountingService.getAccountClasses.mockResolvedValue(mockClasses as any);
      mockAccountingService.getAccountGroupsByClass.mockResolvedValue(mockGroups as any);

      await controller.getAccountGroupsByClass(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAccountClasses).toHaveBeenCalled();
      expect(mockAccountingService.getAccountGroupsByClass).toHaveBeenCalledWith('class-uuid-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if class code not found', async () => {
      const classCode = '999';
      mockReq.params = { classId: classCode };

      mockAccountingService.getAccountClasses.mockResolvedValue([]);

      await controller.getAccountGroupsByClass(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Account class not found'
      }));
    });
  });

  describe('Synthetic Accounts', () => {
    it('should get all synthetic accounts', async () => {
      const mockAccounts = [
        { id: '1', code: '1011', name: 'Brevete', grade: 4, groupId: '1' },
        { id: '2', code: '2111', name: 'Terenuri', grade: 4, groupId: '2' }
      ];

      mockAccountingService.getSyntheticAccounts.mockResolvedValue(mockAccounts as any);

      await controller.getSyntheticAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getSyntheticAccounts).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should get synthetic accounts by group ID (UUID)', async () => {
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      mockReq.params = { groupId };

      const mockAccounts = [
        { id: '1', code: '1011', name: 'Brevete', grade: 4, groupId }
      ];

      mockAccountingService.getSyntheticAccountsByGroup.mockResolvedValue(mockAccounts as any);

      await controller.getSyntheticAccountsByGroup(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getSyntheticAccountsByGroup).toHaveBeenCalledWith(groupId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should get synthetic accounts by group code', async () => {
      const groupCode = '10';
      mockReq.params = { groupId: groupCode };

      const mockGroups = [
        { id: 'group-uuid-1', code: '10', name: 'Imobilizări necorporale' }
      ];

      const mockAccounts = [
        { id: '1', code: '1011', name: 'Brevete', grade: 4, groupId: 'group-uuid-1' }
      ];

      mockAccountingService.getAccountGroups.mockResolvedValue(mockGroups as any);
      mockAccountingService.getSyntheticAccountsByGroup.mockResolvedValue(mockAccounts as any);

      await controller.getSyntheticAccountsByGroup(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAccountGroups).toHaveBeenCalled();
      expect(mockAccountingService.getSyntheticAccountsByGroup).toHaveBeenCalledWith('group-uuid-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Analytic Accounts', () => {
    it('should get all analytic accounts', async () => {
      const mockAccounts = [
        { 
          id: '1', 
          code: '40111001', 
          name: 'Client ABC SRL', 
          companyId: 'company-1',
          syntheticId: 'synthetic-1',
          isActive: true
        }
      ];

      mockAccountingService.getAnalyticAccounts.mockResolvedValue(mockAccounts as any);

      await controller.getAnalyticAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.getAnalyticAccounts).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should create analytic account', async () => {
      mockReq.body = {
        code: '40111001',
        name: 'Client ABC SRL',
        syntheticId: 'synthetic-1',
        description: 'Client principal'
      };

      const mockAccount = {
        id: 'new-account-id',
        code: '40111001',
        name: 'Client ABC SRL',
        description: 'Client principal',
        createdAt: new Date(),
        updatedAt: new Date(),
        accountFunction: 'receivables',
        isActive: true,
        syntheticId: 'synthetic-1'
      };

      mockAccountingService.createAnalyticAccount.mockResolvedValue(mockAccount as any);

      await controller.createAnalyticAccount(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockAccountingService.createAnalyticAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          code: '40111001',
          name: 'Client ABC SRL',
          syntheticId: 'synthetic-1',
          companyId: 'company-1'
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockAccount
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockAccountingService.getAccountClasses.mockRejectedValue(new Error('Database error'));

      await controller.getAccountClasses(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Database error'
      }));
    });

    it('should handle custom errors with status codes', async () => {
      mockAccountingService.getAnalyticAccounts.mockRejectedValue({
        statusCode: 404,
        message: 'Accounts not found'
      });
      
      await controller.getAnalyticAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Accounts not found'
      }));
    });
  });
});

