/**
 * Unit Tests - NoteContabilController
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NoteContabilController } from '../../../../../../server/modules/accounting/controllers/note-contabil.controller';
import NoteContabilService from '../../../../../../server/modules/accounting/services/note-contabil.service';
import { AuthenticatedRequest } from '../../../../../../server/common/middleware/auth-types';
import { Response } from 'express';

describe('NoteContabilController', () => {
  let controller: NoteContabilController;
  let mockNoteService: jest.Mocked<NoteContabilService>;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockNoteService = new NoteContabilService() as jest.Mocked<NoteContabilService>;
    controller = new NoteContabilController(mockNoteService);

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
});

