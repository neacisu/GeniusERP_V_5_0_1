/**
 * AuditLogService Unit Tests
 * 
 * Tests the audit log service (write-only service)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuditLogService, AuditAction, AuditSeverity } from '../../../../../../server/modules/accounting/services/audit-log.service';

describe('AuditLogService Unit Tests', () => {
  let auditLogService: AuditLogService;

  beforeEach(() => {
    auditLogService = new AuditLogService();
  });

  describe('Audit Logging', () => {
    it('should log an audit entry', async () => {
      const params = {
        companyId: 'company-1',
        userId: 'user-1',
        action: AuditAction.CASH_REGISTER_CLOSED,
        severity: AuditSeverity.INFO,
        entityType: 'cash_register',
        entityId: 'register-1',
        description: 'Cash register closed successfully'
      };

      const logId = await auditLogService.log(params);

      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');
    });

    it('should log with metadata', async () => {
      const params = {
        companyId: 'company-1',
        userId: 'user-1',
        action: AuditAction.BALANCE_ADJUSTMENT,
        severity: AuditSeverity.WARNING,
        entityType: 'account',
        entityId: 'account-1',
        description: 'Balance adjusted',
        metadata: {
          oldBalance: 1000,
          newBalance: 1500,
          reason: 'Correction'
        }
      };

      const logId = await auditLogService.log(params);

      expect(logId).toBeDefined();
    });

    it('should log critical actions', async () => {
      const params = {
        companyId: 'company-1',
        userId: 'user-1',
        action: AuditAction.SAFT_EXPORTED,
        severity: AuditSeverity.CRITICAL,
        entityType: 'export',
        entityId: 'export-1',
        description: 'SAF-T D406 exported'
      };

      const logId = await auditLogService.log(params);

      expect(logId).toBeDefined();
    });

    it('should log with IP address and user agent', async () => {
      const params = {
        companyId: 'company-1',
        userId: 'user-1',
        action: AuditAction.DAILY_CLOSING,
        severity: AuditSeverity.INFO,
        entityType: 'period',
        entityId: 'period-1',
        description: 'Daily closing performed',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      };

      const logId = await auditLogService.log(params);

      expect(logId).toBeDefined();
    });
  });

  describe('Different Action Types', () => {
    it('should log cash operations', async () => {
      const actions = [
        AuditAction.CASH_TRANSACTION_CREATED,
        AuditAction.CASH_DEPOSIT_TO_BANK,
        AuditAction.CASH_TRANSFER
      ];

      for (const action of actions) {
        const logId = await auditLogService.log({
          companyId: 'company-1',
          userId: 'user-1',
          action,
          severity: AuditSeverity.INFO,
          entityType: 'cash_transaction',
          entityId: 'transaction-1',
          description: `Action: ${action}`
        });

        expect(logId).toBeDefined();
      }
    });

    it('should log bank operations', async () => {
      const actions = [
        AuditAction.BANK_TRANSACTION_CREATED,
        AuditAction.BANK_TRANSACTION_RECONCILED,
        AuditAction.BANK_TRANSFER
      ];

      for (const action of actions) {
        const logId = await auditLogService.log({
          companyId: 'company-1',
          userId: 'user-1',
          action,
          severity: AuditSeverity.INFO,
          entityType: 'bank_transaction',
          entityId: 'transaction-1',
          description: `Action: ${action}`
        });

        expect(logId).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const invalidParams = {
        companyId: '',
        userId: '',
        action: AuditAction.CASH_REGISTER_CLOSED,
        severity: AuditSeverity.INFO,
        entityType: '',
        entityId: '',
        description: ''
      };

      await expect(
        auditLogService.log(invalidParams)
      ).rejects.toThrow();
    });
  });
});

