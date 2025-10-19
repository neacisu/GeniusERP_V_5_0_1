/**
 * Unit Tests - BankJournalController
 * 
 * Tests pentru controllerul jurnal bancar
 * - Bank accounts CRUD
 * - Bank transactions (deposits, payments, transfers)
 * - Bank reconciliation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BankJournalController } from '../../../../../../server/modules/accounting/controllers/bank-journal.controller';
import { BankJournalService } from '../../../../../../server/modules/accounting/services/bank-journal.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

// Mock services
jest.mock('../../../../../../server/modules/accounting/services/bank-journal.service');

describe('BankJournalController', () => {
  let controller: BankJournalController;
  let mockBankJournalService: jest.Mocked<BankJournalService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockBankJournalService = new BankJournalService() as jest.Mocked<BankJournalService>;
    controller = new BankJournalController(mockBankJournalService);

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

  describe('Bank Accounts', () => {
    it('should get all bank accounts', async () => {
      const mockAccounts = [
        { id: '1', accountNumber: 'RO49AAAA1B31007593840000', bankName: 'BCR', balance: 50000 },
        { id: '2', accountNumber: 'RO49BTRL0140R1A9S5N5A60B', bankName: 'BT', balance: 30000 }
      ];

      mockBankJournalService.getBankAccounts.mockResolvedValue(mockAccounts as any);

      await controller.getBankAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockBankJournalService.getBankAccounts).toHaveBeenCalledWith('company-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should create bank account', async () => {
      mockReq.body = {
        accountNumber: 'RO49AAAA1B31007593840000',
        bankName: 'BCR',
        accountType: 'current',
        currency: 'RON'
      };

      const mockAccountId = 'account-123';
      const mockAccount = { id: mockAccountId, ...mockReq.body, balance: 0 };

      mockBankJournalService.createBankAccount.mockResolvedValue(mockAccountId);
      mockBankJournalService.getBankAccount.mockResolvedValue(mockAccount as any);

      await controller.createBankAccount(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockBankJournalService.createBankAccount).toHaveBeenCalled();
      expect(mockBankJournalService.getBankAccount).toHaveBeenCalledWith(mockAccountId, 'company-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent bank account', async () => {
      mockReq.params = { id: 'nonexistent' };

      mockBankJournalService.getBankAccount.mockResolvedValue(null);

      await controller.getBankAccount(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Bank Transactions', () => {
    it('should create bank deposit', async () => {
      mockReq.body = {
        bankAccountId: 'account-1',
        amount: 10000,
        transactionDate: '2024-01-15',
        description: 'Customer payment'
      };

      const mockTransactionId = 'transaction-789';
      jest.spyOn(mockBankJournalService as any, 'createDeposit').mockResolvedValue(mockTransactionId);

      await controller.createDeposit(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should create bank payment', async () => {
      mockReq.body = {
        bankAccountId: 'account-1',
        amount: 5000,
        transactionDate: '2024-01-15',
        description: 'Supplier payment'
      };

      const mockTransactionId = 'transaction-790';
      jest.spyOn(mockBankJournalService as any, 'createPayment').mockResolvedValue(mockTransactionId);

      await controller.createPayment(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockBankJournalService.getBankAccounts.mockRejectedValue(new Error('Database error'));

      await controller.getBankAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

