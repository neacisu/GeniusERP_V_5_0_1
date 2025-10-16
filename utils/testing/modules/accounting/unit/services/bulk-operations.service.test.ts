/**
 * BulkOperationsService Unit Tests
 * 
 * Tests the bulk operations service with Redis caching
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BulkOperationsService } from '../../../../../../server/modules/accounting/services/bulk-operations.service';
import { RedisService } from '../../../../../../server/services/redis.service';

// Mock dependencies
jest.mock('../../../../../../server/modules/accounting/services/accounting-queue.service');
jest.mock('../../../../../../server/services/redis.service');

describe('BulkOperationsService Unit Tests', () => {
  let bulkOperationsService: BulkOperationsService;
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

    bulkOperationsService = new BulkOperationsService();
    (bulkOperationsService as any).redisService = mockRedisService;
  });

  describe('Bulk Invoice Creation', () => {
    it('should queue bulk invoice creation', async () => {
      const invoices = [
        {
          invoiceDate: '2024-01-15',
          customerId: 'customer-1',
          items: [
            { description: 'Product A', quantity: 10, unitPrice: 100, vatRate: 19 }
          ]
        },
        {
          invoiceDate: '2024-01-16',
          customerId: 'customer-2',
          items: [
            { description: 'Product B', quantity: 5, unitPrice: 200, vatRate: 19 }
          ]
        }
      ];

      const result = await bulkOperationsService.bulkCreateInvoices('company-1', invoices, 'user-1');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.totalItems).toBe(2);
    });
  });

  describe('Bulk Payment Recording', () => {
    it('should queue bulk payment recording', async () => {
      const payments = [
        { invoiceId: 'invoice-1', amount: 1190, paymentMethod: 'bank_transfer', paymentDate: '2024-01-15' },
        { invoiceId: 'invoice-2', amount: 1000, paymentMethod: 'cash', paymentDate: '2024-01-16' }
      ];

      const result = await bulkOperationsService.bulkRecordPayments('company-1', payments, 'user-1');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.jobId).toBeDefined();
      expect(result.totalItems).toBe(2);
    });
  });

  describe('Bulk Operation Progress', () => {
    it('should get bulk operation progress', async () => {
      const jobId = 'job-123';

      const progress = await bulkOperationsService.getBulkOperationProgress(jobId);

      if (progress) {
        expect(progress.jobId).toBe(jobId);
        expect(progress.status).toBeDefined();
        expect(progress.progress).toBeGreaterThanOrEqual(0);
        expect(progress.progress).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Caching Behavior', () => {
    it('should cache bulk operation results with 10min TTL', async () => {
      const jobId = 'job-123';
      const result = {
        success: true,
        totalItems: 10,
        successCount: 8,
        errorCount: 2,
        results: [],
        errors: []
      };

      mockRedisService.getCached.mockResolvedValue(null);

      await bulkOperationsService.cacheBulkOperationResult(jobId, result);

      expect(mockRedisService.setCached).toHaveBeenCalledWith(
        expect.stringContaining(jobId),
        result,
        600 // 10min
      );
    });

    it('should return cached result when available', async () => {
      const jobId = 'job-123';
      const cachedResult = {
        success: true,
        totalItems: 10,
        successCount: 10,
        errorCount: 0,
        results: [],
        errors: []
      };

      mockRedisService.getCached.mockResolvedValue(cachedResult);

      const result = await bulkOperationsService.getBulkOperationResult(jobId);

      expect(result).toEqual(cachedResult);
      expect(mockRedisService.getCached).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty invoice array', async () => {
      await expect(
        bulkOperationsService.bulkCreateInvoices('company-1', [], 'user-1')
      ).rejects.toThrow();
    });

    it('should handle invalid job ID', async () => {
      mockRedisService.getCached.mockResolvedValue(null);

      await expect(
        bulkOperationsService.getBulkOperationProgress('invalid-job')
      ).rejects.toThrow();
    });
  });
});

