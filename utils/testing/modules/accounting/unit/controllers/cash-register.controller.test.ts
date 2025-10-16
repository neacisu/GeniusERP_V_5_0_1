/**
 * Unit Tests - CashRegisterController
 * 
 * Tests pentru controllerul casă
 * - Cash registers CRUD
 * - Cash transactions (receipts, payments)
 * - Daily closing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CashRegisterController } from '../../../../../../server/modules/accounting/controllers/cash-register.controller';
import { CashRegisterService } from '../../../../../../server/modules/accounting/services/cash-register.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

// Mock services
jest.mock('../../../../../../server/modules/accounting/services/cash-register.service');

describe('CashRegisterController', () => {
  let controller: CashRegisterController;
  let mockCashRegisterService: jest.Mocked<CashRegisterService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockCashRegisterService = new CashRegisterService() as jest.Mocked<CashRegisterService>;
    controller = new CashRegisterController(mockCashRegisterService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin'
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

  describe('Cash Registers', () => {
    it('should get all cash registers', async () => {
      const mockRegisters = [
        { id: '1', name: 'Casă Principală', currency: 'RON', balance: 5000 },
        { id: '2', name: 'Casă Secondară', currency: 'RON', balance: 2000 }
      ];

      mockCashRegisterService.getCashRegisters.mockResolvedValue(mockRegisters as any);

      await controller.getCashRegisters(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockCashRegisterService.getCashRegisters).toHaveBeenCalledWith('company-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should create cash register', async () => {
      mockReq.body = {
        name: 'Casă Principală',
        currency: 'RON',
        location: 'Sediu central'
      };

      const mockRegisterId = 'register-123';
      const mockRegister = { id: mockRegisterId, ...mockReq.body, balance: 0 };

      mockCashRegisterService.createCashRegister.mockResolvedValue(mockRegisterId);
      mockCashRegisterService.getCashRegister.mockResolvedValue(mockRegister as any);

      await controller.createCashRegister(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockCashRegisterService.createCashRegister).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent cash register', async () => {
      mockReq.params = { id: 'nonexistent' };

      mockCashRegisterService.getCashRegister.mockResolvedValue(null);

      await controller.getCashRegister(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Cash Transactions', () => {
    it('should record cash receipt', async () => {
      mockReq.body = {
        registerId: 'register-1',
        amount: 1000,
        transactionDate: '2024-01-15',
        description: 'Cash sale'
      };

      const mockTransactionId = 'transaction-456';
      mockCashRegisterService.recordReceipt = jest.fn().mockResolvedValue(mockTransactionId);

      await controller.recordReceipt(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should record cash payment', async () => {
      mockReq.body = {
        registerId: 'register-1',
        amount: 500,
        transactionDate: '2024-01-15',
        description: 'Petty cash expense'
      };

      const mockTransactionId = 'transaction-457';
      mockCashRegisterService.recordPayment = jest.fn().mockResolvedValue(mockTransactionId);

      await controller.recordPayment(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Daily Closing', () => {
    it('should get daily closing report', async () => {
      mockReq.params = { id: 'register-1' };
      mockReq.query = { date: '2024-01-15' };

      const mockClosing = {
        registerId: 'register-1',
        date: '2024-01-15',
        openingBalance: 5000,
        receipts: 3000,
        payments: 1000,
        closingBalance: 7000
      };

      mockCashRegisterService.getDailyClosing = jest.fn().mockResolvedValue(mockClosing);

      await controller.getDailyClosing(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockCashRegisterService.getCashRegisters.mockRejectedValue(new Error('Database error'));

      await controller.getCashRegisters(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

