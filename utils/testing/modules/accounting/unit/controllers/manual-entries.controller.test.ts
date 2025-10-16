/**
 * Unit Tests - ManualEntriesController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ManualEntriesController } from '../../../../../../server/modules/accounting/controllers/manual-entries.controller';
import { JournalService } from '../../../../../../server/modules/accounting/services/journal.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

jest.mock('../../../../../../server/modules/accounting/services/journal.service');

describe('ManualEntriesController', () => {
  let controller: ManualEntriesController;
  let mockJournalService: jest.Mocked<JournalService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockJournalService = new JournalService() as jest.Mocked<JournalService>;
    controller = new ManualEntriesController(mockJournalService);

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

  it('should create manual entry', async () => {
    mockReq.body = {
      companyId: 'company-1',
      date: '2024-01-15',
      description: 'Manual adjustment',
      entries: [
        { accountCode: '4111', debit: 5000, credit: 0 },
        { accountCode: '7011', debit: 0, credit: 5000 }
      ]
    };

    jest.spyOn(mockJournalService, 'recordTransaction').mockResolvedValue('entry-456');

    await (controller as any).createManualEntry(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should get manual entries', async () => {
    const mockEntries = [
      { id: '1', date: '2024-01-15', description: 'Adjustment' }
    ];

    jest.spyOn(mockJournalService as any, 'getManualEntries').mockResolvedValue(mockEntries);

    await (controller as any).getManualEntries(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

