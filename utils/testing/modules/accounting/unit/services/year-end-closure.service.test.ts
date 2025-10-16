/**
 * YearEndClosureService Unit Tests
 * 
 * Tests the year-end closure service (PUBLIC methods only)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { YearEndClosureService } from '../../../../../../server/modules/accounting/services/year-end-closure.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');

describe('YearEndClosureService Unit Tests', () => {
  let yearEndClosureService: YearEndClosureService;

  beforeEach(() => {
    yearEndClosureService = new YearEndClosureService();
  });

  describe('Fiscal Year Closure', () => {
    it('should close fiscal year', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await yearEndClosureService.closeFiscalYear(request);

      expect(result).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
      expect(result.totalExpenses).toBeDefined();
      expect(result.accountingProfit).toBeDefined();
      expect(result.dryRun).toBe(true);
    });

    it('should handle profit scenario', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await yearEndClosureService.closeFiscalYear(request);

      if (result.accountingProfit > 0) {
        expect(result.netProfit).toBeDefined();
        expect(result.profitTaxAmount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle dry run mode', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await yearEndClosureService.closeFiscalYear(request);

      expect(result.dryRun).toBe(true);
      expect(result.plClosureLedgerEntryId).toBeUndefined();
    });

    it('should calculate profit tax with adjustments', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const taxAdjustments = {
        nonDeductibleExpenses: 5000,
        nonTaxableIncome: 2000,
        taxLossCarryforward: 0,
        otherAdjustments: 0
      };

      const result = await yearEndClosureService.closeFiscalYear(
        request,
        taxAdjustments
      );

      expect(result).toBeDefined();
      expect(result.taxableProfit).toBeDefined();
    });

    it('should handle profit distribution', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const distribution = {
        legalReserve: 5000,
        statutoryReserves: 0,
        otherReserves: 0,
        dividends: 20000,
        retainedEarnings: 10000
      };

      const result = await yearEndClosureService.closeFiscalYear(
        request,
        undefined,
        distribution
      );

      expect(result).toBeDefined();
      expect(result.distribution).toEqual(distribution);
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate profit tax at 16%', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await yearEndClosureService.closeFiscalYear(request);

      if (result.taxableProfit > 0) {
        expect(result.profitTaxRate).toBe(0.16);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid fiscal year', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2050, // Future year
        userId: 'user-1',
        dryRun: true
      };

      await expect(
        yearEndClosureService.closeFiscalYear(request)
      ).rejects.toThrow();
    });
  });
});

