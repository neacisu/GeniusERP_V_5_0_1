/**
 * Unit Tests - FiscalClosureController
 * 
 * Tests pentru controllerul de închidere fiscală
 * - Monthly closure
 * - Yearly closure
 * - VAT closure
 * - Async operations via BullMQ
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FiscalClosureController } from '../../../../../../server/modules/accounting/controllers/fiscal-closure.controller';
import FiscalClosureService from '../../../../../../server/modules/accounting/services/fiscal-closure.service';
import AccountingPeriodsService from '../../../../../../server/modules/accounting/services/accounting-periods.service';
import VATClosureService from '../../../../../../server/modules/accounting/services/vat-closure.service';
import { Request, Response } from 'express';

// Mock services
jest.mock('../../../../../../server/modules/accounting/services/fiscal-closure.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-periods.service');
jest.mock('../../../../../../server/modules/accounting/services/vat-closure.service');
jest.mock('../../../../../../server/modules/accounting/services/bulk-operations.service');

describe('FiscalClosureController', () => {
  let controller: FiscalClosureController;
  let mockClosureService: jest.Mocked<FiscalClosureService>;
  let mockPeriodsService: jest.Mocked<AccountingPeriodsService>;
  let mockVATService: jest.Mocked<VATClosureService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    controller = new FiscalClosureController();
    
    // Access mocked instances
    mockClosureService = (controller as any).closureService;
    mockPeriodsService = (controller as any).periodsService;
    mockVATService = (controller as any).vatService;

    mockReq = {
      body: {},
      params: {}
    } as any;

    (mockReq as any).user = {
      id: 'user-1',
      username: 'testuser',
      companyId: 'company-1',
      email: 'test@test.com',
      role: 'admin'
    };

    mockRes = {
      status: jest.fn<any, any>().mockReturnThis(),
      json: jest.fn<any, any>().mockReturnThis()
    } as any;
  });

  describe('Monthly Closure', () => {
    it('should close month successfully', async () => {
      mockReq.body = {
        year: 2024,
        month: 1,
        skipDepreciation: false,
        skipFXRevaluation: false,
        skipVAT: false,
        dryRun: false
      };

      const mockResult = {
        success: true,
        periodId: 'period-1',
        depreciation: { success: true, entries: 5 },
        fxRevaluation: { success: true, entries: 2 },
        vat: { success: true, vatCollected: 1900, vatDeductible: 950 }
      };

      mockClosureService.closeMonth.mockResolvedValue(mockResult as any);

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockClosureService.closeMonth).toHaveBeenCalledWith({
        companyId: 'company-1',
        year: 2024,
        month: 1,
        userId: 'user-1',
        skipDepreciation: false,
        skipFXRevaluation: false,
        skipVAT: false,
        dryRun: false
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Luna 1/2024 închisă cu succes',
        data: mockResult
      }));
    });

    it('should handle dry run for monthly closure', async () => {
      mockReq.body = {
        year: 2024,
        month: 2,
        dryRun: true
      };

      const mockResult = {
        success: true,
        dryRun: true,
        depreciation: { entries: 5, totalAmount: 5000 },
        fxRevaluation: { entries: 2, totalAmount: 150 },
        vat: { vatCollected: 1900, vatDeductible: 950, vatBalance: 950 }
      };

      mockClosureService.closeMonth.mockResolvedValue(mockResult as any);

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockClosureService.closeMonth).toHaveBeenCalledWith(expect.objectContaining({
        dryRun: true
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should skip optional steps', async () => {
      mockReq.body = {
        year: 2024,
        month: 3,
        skipDepreciation: true,
        skipFXRevaluation: true,
        skipVAT: false
      };

      const mockResult = {
        success: true,
        periodId: 'period-1',
        depreciation: { skipped: true },
        fxRevaluation: { skipped: true },
        vat: { success: true }
      };

      mockClosureService.closeMonth.mockResolvedValue(mockResult as any);

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockClosureService.closeMonth).toHaveBeenCalledWith(expect.objectContaining({
        skipDepreciation: true,
        skipFXRevaluation: true,
        skipVAT: false
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle validation errors', async () => {
      mockReq.body = {
        // Missing year and month
      };

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Anul și luna sunt obligatorii'
      }));
    });

    it('should handle unauthorized request', async () => {
      (mockReq as any).user = undefined;

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
    });

    it('should handle closure errors with warnings', async () => {
      mockReq.body = {
        year: 2024,
        month: 1
      };

      const mockResult = {
        success: false,
        errors: ['Period already closed', 'Missing exchange rates'],
        warnings: ['Some entries may be incomplete']
      };

      mockClosureService.closeMonth.mockResolvedValue(mockResult as any);

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        errors: mockResult.errors,
        warnings: mockResult.warnings
      }));
    });
  });

  describe('Yearly Closure', () => {
    it('should close year successfully', async () => {
      mockReq.body = {
        fiscalYear: 2023,
        taxAdjustments: {
          nonDeductibleExpenses: 5000,
          taxExemptRevenues: 2000,
          temporaryDifferences: 1000
        },
        profitDistribution: {
          legalReserve: 500,
          statutoryReserves: 1000,
          dividends: 3000,
          retainedEarnings: 5500
        },
        dryRun: false
      };

      const mockResult = {
        success: true,
        periodId: 'period-year-1',
        closingEntries: ['entry-1', 'entry-2'],
        netProfit: 10000,
        profitDistribution: mockReq.body.profitDistribution
      };

      mockClosureService.closeYear.mockResolvedValue(mockResult as any);

      await controller.closeYear(mockReq as Request, mockRes as Response);

      expect(mockClosureService.closeYear).toHaveBeenCalledWith({
        companyId: 'company-1',
        fiscalYear: 2023,
        userId: 'user-1',
        taxAdjustments: mockReq.body.taxAdjustments,
        profitDistribution: mockReq.body.profitDistribution,
        dryRun: false
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Anul fiscal 2023 închis cu succes'
      }));
    });

    it('should handle dry run for yearly closure', async () => {
      mockReq.body = {
        fiscalYear: 2023,
        dryRun: true
      };

      const mockResult = {
        success: true,
        dryRun: true,
        netProfit: 10000,
        profitBeforeTax: 12000,
        taxAdjustments: { total: 2000 }
      };

      mockClosureService.closeYear.mockResolvedValue(mockResult as any);

      await controller.closeYear(mockReq as Request, mockRes as Response);

      expect(mockClosureService.closeYear).toHaveBeenCalledWith(expect.objectContaining({
        dryRun: true
      }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing fiscal year', async () => {
      mockReq.body = {
        // Missing fiscalYear
      };

      await controller.closeYear(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Anul fiscal este obligatoriu'
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in monthly closure', async () => {
      mockReq.body = {
        year: 2024,
        month: 1
      };

      mockClosureService.closeMonth.mockRejectedValue(new Error('Database connection failed'));

      await controller.closeMonth(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Eroare la închiderea lunii',
        details: 'Database connection failed'
      }));
    });

    it('should handle service errors in yearly closure', async () => {
      mockReq.body = {
        fiscalYear: 2023
      };

      mockClosureService.closeYear.mockRejectedValue(new Error('Period validation failed'));

      await controller.closeYear(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Eroare la închiderea anului',
        details: 'Period validation failed'
      }));
    });
  });
});

