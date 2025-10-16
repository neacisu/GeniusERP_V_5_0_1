/**
 * VatClosureService Unit Tests
 * 
 * Tests the VAT closure service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VATClosureService } from '../../../../../../server/modules/accounting/services/vat-closure.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');
jest.mock('../../../../../../server/modules/accounting/services/accounting-cache.service');

describe('VatClosureService Unit Tests', () => {
  let vatClosureService: VATClosureService;

  beforeEach(() => {
    vatClosureService = new VATClosureService();
  });

  describe('VAT Period Closure', () => {
    it('should close VAT period', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      const result = await vatClosureService.closeVATPeriod(request);

      expect(result).toBeDefined();
      expect(result.vatCollected).toBeDefined();
      expect(result.vatDeductible).toBeDefined();
      expect(result.vatBalance).toBeDefined();
      expect(result.dryRun).toBe(true);
    });

    it('should determine if VAT is payable or recoverable', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      const result = await vatClosureService.closeVATPeriod(request);

      expect(result.isPayable).toBeDefined();
      expect(typeof result.isPayable).toBe('boolean');
    });

    it('should handle dry run mode', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      const result = await vatClosureService.closeVATPeriod(request);

      expect(result.dryRun).toBe(true);
      expect(result.ledgerEntryId).toBeUndefined();
    });

    it('should calculate VAT balance correctly', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        userId: 'user-1',
        dryRun: true
      };

      const result = await vatClosureService.closeVATPeriod(request);

      const expectedBalance = result.vatCollected - result.vatDeductible;
      expect(result.vatBalance).toBe(expectedBalance);
    });
  });

  describe('D300 Report Generation', () => {
    it('should generate D300 VAT declaration', async () => {
      const params = {
        companyId: 'company-1',
        periodYear: 2024,
        periodMonth: 1,
        declarationFrequency: 'monthly' as const
      };

      const d300 = await vatClosureService.generateD300Declaration(params);

      expect(d300).toBeDefined();
      expect(d300.companyId).toBe(params.companyId);
      expect(d300.periodYear).toBe(params.periodYear);
      expect(d300.periodMonth).toBe(params.periodMonth);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid period', async () => {
      const request = {
        companyId: 'company-1',
        periodYear: 2050,
        periodMonth: 13, // Invalid month
        userId: 'user-1',
        dryRun: true
      };

      await expect(
        vatClosureService.closeVATPeriod(request)
      ).rejects.toThrow();
    });
  });
});

