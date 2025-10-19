/**
 * Unit Tests - BaseController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BaseController } from '../../../../../../server/modules/accounting/controllers/base.controller';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

describe('BaseController', () => {
  let controller: BaseController;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = new BaseController();

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
      query: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as any;
  });

  it('should be instantiated', () => {
    expect(controller).toBeDefined();
  });

  it('should have handleRequest method', () => {
    expect(typeof (controller as any).handleRequest).toBe('function');
  });

  it('should have getCompanyId method', () => {
    expect(typeof (controller as any).getCompanyId).toBe('function');
  });

  it('should have getUserId method', () => {
    expect(typeof (controller as any).getUserId).toBe('function');
  });
});

