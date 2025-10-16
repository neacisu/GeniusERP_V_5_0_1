/**
 * Unit Tests - JournalController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JournalController } from '../../../../../../server/modules/accounting/controllers/journal.controller';
import { JournalService } from '../../../../../../server/modules/accounting/services/journal.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

jest.mock('../../../../../../server/modules/accounting/services/journal.service');

describe('JournalController', () => {
  let controller: JournalController;
  let mockJournalService: jest.Mocked<JournalService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockJournalService = new JournalService() as jest.Mocked<JournalService>;
    controller = new JournalController(mockJournalService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin'
      },
      params: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  it('should record transaction', async () => {
    mockReq.body = {
      companyId: 'company-1',
      debitAccount: '4111',
      creditAccount: '7011',
      amount: 10000,
      description: 'Test transaction'
    };

    mockJournalService.recordTransaction.mockResolvedValue('transaction-123');

    await (controller as any).recordTransaction(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should get ledger entries', async () => {
    const mockEntries = [
      { id: '1', debit: 10000, credit: 0, accountCode: '4111' },
      { id: '2', debit: 0, credit: 10000, accountCode: '7011' }
    ];

    jest.spyOn(mockJournalService as any, 'getLedgerEntries').mockResolvedValue(mockEntries);

    await (controller as any).getLedgerEntries(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

