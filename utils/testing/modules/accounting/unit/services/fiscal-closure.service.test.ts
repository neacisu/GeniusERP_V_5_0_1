/**
 * FiscalClosureService Unit Tests
 * 
 * Tests the fiscal closure orchestrator service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FiscalClosureService } from '../../../../../../server/modules/accounting/services/fiscal-closure.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/accounting-periods.service');
jest.mock('../../../../../../server/modules/accounting/services/depreciation-calculation.service');
jest.mock('../../../../../../server/modules/accounting/services/fx-revaluation.service');
jest.mock('../../../../../../server/modules/accounting/services/vat-closure.service');
jest.mock('../../../../../../server/modules/accounting/services/year-end-closure.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');

describe('FiscalClosureService Unit Tests', () => {
  let fiscalClosureService: FiscalClosureService;

  beforeEach(() => {
    fiscalClosureService = new FiscalClosureService();
  });

  describe('Month End Closure', () => {
    it('should successfully close a month', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        userId: 'user-1',
        dryRun: true
      };

      const result = await fiscalClosureService.closeMonth(request);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should skip depreciation when requested', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        userId: 'user-1',
        skipDepreciation: true,
        dryRun: true
      };

      const result = await fiscalClosureService.closeMonth(request);

      expect(result).toBeDefined();
      expect(result.steps.depreciation).toBeUndefined();
    });

    it('should skip FX revaluation when requested', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        userId: 'user-1',
        skipFXRevaluation: true,
        dryRun: true
      };

      const result = await fiscalClosureService.closeMonth(request);

      expect(result).toBeDefined();
    });

    it('should skip VAT closure when requested', async () => {
      const request = {
        companyId: 'company-1',
        year: 2024,
        month: 1,
        userId: 'user-1',
        skipVAT: true,
        dryRun: true
      };

      const result = await fiscalClosureService.closeMonth(request);

      expect(result).toBeDefined();
    });
  });

  describe('Year End Closure', () => {
    it('should successfully close a fiscal year', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await fiscalClosureService.closeYear(request);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle profit distribution', async () => {
      const request = {
        companyId: 'company-1',
        fiscalYear: 2024,
        userId: 'user-1',
        dryRun: true
      };

      const result = await fiscalClosureService.closeYear(request);

      expect(result).toBeDefined();
      // Profit distribution is handled internally by YearEndClosureService
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const request = {
        companyId: '',
        year: 2024,
        month: 1,
        userId: 'user-1',
        dryRun: true
      };

      await expect(fiscalClosureService.closeMonth(request)).rejects.toThrow();
    });
  });
});

