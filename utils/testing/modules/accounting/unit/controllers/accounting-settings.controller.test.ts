/**
 * Unit Tests - AccountingSettingsController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AccountingSettingsController } from '../../../../../../server/modules/accounting/controllers/accounting-settings.controller';
import { AccountingSettingsService } from '../../../../../../server/modules/accounting/services/accounting-settings.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

jest.mock('../../../../../../server/modules/accounting/services/accounting-settings.service');

describe('AccountingSettingsController', () => {
  let controller: AccountingSettingsController;
  let mockSettingsService: jest.Mocked<AccountingSettingsService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockSettingsService = new AccountingSettingsService() as jest.Mocked<AccountingSettingsService>;
    controller = new AccountingSettingsController(mockSettingsService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin',
        roles: ['admin']
      },
      params: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  it('should get accounting settings', async () => {
    const mockSettings = {
      companyId: 'company-1',
      fiscalYearStartMonth: 1,
      enableAnalyticAccounting: true
    };

    mockSettingsService.getSettings.mockResolvedValue(mockSettings as any);

    await (controller as any).getSettings(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should update settings', async () => {
    mockReq.body = {
      fiscalYearStartMonth: 2
    };

    jest.spyOn(mockSettingsService, 'updateGeneralSettings').mockResolvedValue(undefined as any);

    await (controller as any).updateSettings(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

