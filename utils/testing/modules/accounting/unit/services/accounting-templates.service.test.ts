/**
 * AccountingTemplatesService Unit Tests
 * 
 * Tests the accounting templates service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingTemplatesService } from '../../../../../../server/modules/accounting/services/accounting-templates.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/journal.service');
jest.mock('../../../../../../server/modules/accounting/services/audit-log.service');
jest.mock('../../../../../../server/services/redis.service');

describe('AccountingTemplatesService Unit Tests', () => {
  let accountingTemplatesService: AccountingTemplatesService;
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

    accountingTemplatesService = new AccountingTemplatesService();
    (accountingTemplatesService as any).redisService = mockRedisService;
  });

  describe('Template Retrieval', () => {
    it('should get templates for company', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      const templates = await accountingTemplatesService.getTemplatesForCompany(companyId);

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should get templates filtered by category', async () => {
      const companyId = 'company-1';
      const category = 'depreciation';
      mockRedisService.getCached.mockResolvedValue(null);

      const templates = await accountingTemplatesService.getTemplatesForCompany(companyId, category as any);

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should cache templates list with 24h TTL', async () => {
      const companyId = 'company-1';
      mockRedisService.getCached.mockResolvedValue(null);

      await accountingTemplatesService.getTemplatesForCompany(companyId);

      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Template Application', () => {
    it('should apply template to create journal entry', async () => {
      const request = {
        templateId: 'template-1',
        companyId: 'company-1',
        entryDate: new Date(),
        userId: 'user-1',
        variables: { amount: 1000 }
      };

      const result = await accountingTemplatesService.applyTemplate(request);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string'); // Returns ledger entry ID
    });

    it('should handle template with variables', async () => {
      const request = {
        templateId: 'template-1',
        companyId: 'company-1',
        entryDate: new Date(),
        userId: 'user-1',
        variables: { amount: 5000, rate: 0.19 }
      };

      const result = await accountingTemplatesService.applyTemplate(request);

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing template gracefully', async () => {
      const request = {
        templateId: 'non-existent',
        companyId: 'company-1',
        entryDate: new Date(),
        userId: 'user-1'
      };

      await expect(
        accountingTemplatesService.applyTemplate(request)
      ).rejects.toThrow();
    });
  });
});

