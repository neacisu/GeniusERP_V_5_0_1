/**
 * Unit Tests - OnboardingController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OnboardingController } from '../../../../../../server/modules/accounting/controllers/onboarding.controller';
import { OnboardingService } from '../../../../../../server/modules/accounting/services/onboarding.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

jest.mock('../../../../../../server/modules/accounting/services/onboarding.service');

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let mockOnboardingService: jest.Mocked<OnboardingService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockOnboardingService = new OnboardingService() as jest.Mocked<OnboardingService>;
    controller = new OnboardingController(mockOnboardingService);

    mockReq = {
      user: {
        id: 'user-1',
        username: 'testuser',
        companyId: 'company-1',
        email: 'test@test.com',
        role: 'admin'
      },
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  it('should start onboarding', async () => {
    mockReq.body = {
      companyId: 'company-1',
      startDate: '2024-01-01',
      fiscalYear: 2024
    };

    mockOnboardingService.startOnboarding.mockResolvedValue({ success: true } as any);

    await controller.startOnboarding(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should import chart of accounts', async () => {
    mockReq.body = {
      companyId: 'company-1',
      accounts: [{ code: '1011', name: 'Brevete' }]
    };

    mockOnboardingService.importChartOfAccounts.mockResolvedValue(undefined);

    await controller.importChartOfAccounts(mockReq as AuthenticatedRequest, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

