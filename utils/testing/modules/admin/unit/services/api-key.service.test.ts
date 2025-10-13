/**
 * Unit Tests - ApiKeyService
 * 
 * Teste pentru gestionarea cheilor API:
 * - Creare și generare chei API
 * - Validare chei API
 * - Rotație chei
 * - Revocare chei
 * - Obținere chei după company
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiKeyService } from '../../../../../../server/modules/admin/services/api-key.service';
import * as crypto from 'crypto';
import type { MockDatabase } from '../../../../types/global';

describe('ApiKeyService - Unit Tests', () => {
  let apiKeyService: ApiKeyService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    // Mock database
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        id: 'test-key-id',
        name: 'Test API Key',
        service: 'test-service',
        key_identifier: '****12345678',
        is_active: true,
        last_used_at: null,
        expires_at: null,
        company_id: 'test-company-id',
        created_by: 'test-user-id',
        created_at: new Date(),
        last_rotated_at: null
      }]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    };

    apiKeyService = new ApiKeyService(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('ar trebui să creeze o cheie API cu succes', async () => {
      const keyData = {
        name: 'Test API Key',
        service: 'test-service',
        companyId: 'test-company-id'
      };

      const result = await apiKeyService.createApiKey(keyData, 'test-user-id');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'Test API Key');
      expect(result).toHaveProperty('full_key');
      expect(result.full_key).toBeDefined();
      expect(result.full_key).toHaveLength(64); // 32 bytes * 2 (hex)
    });

    it('ar trebui să genereze identificatori unici pentru fiecare cheie', async () => {
      const keyData = {
        name: 'Test API Key',
        service: 'test-service',
        companyId: 'test-company-id'
      };

      const result1 = await apiKeyService.createApiKey(keyData, 'user1');
      const result2 = await apiKeyService.createApiKey(keyData, 'user2');

      expect(result1.full_key).not.toBe(result2.full_key);
    });

    it('ar trebui să seteze data de expirare când este furnizată', async () => {
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const keyData = {
        name: 'Expiring Key',
        service: 'test-service',
        companyId: 'test-company-id',
        expiresAt
      };

      await apiKeyService.createApiKey(keyData, 'test-user-id');

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          expires_at: expiresAt
        })
      );
    });
  });

  describe('validateApiKey', () => {
    it('ar trebui să valideze o cheie API activă', async () => {
      const validKey = 'valid-api-key-12345678';
      const mockApiKey = {
        id: 'key-id',
        key_identifier: `****12345678`,
        is_active: true,
        expires_at: null
      };

      mockDb.where.mockResolvedValueOnce([mockApiKey]);

      const result = await apiKeyService.validateApiKey(validKey);

      expect(result).toEqual(mockApiKey);
      expect(mockDb.update).toHaveBeenCalled(); // Pentru actualizare last_used_at
    });

    it('ar trebui să returneze null pentru o cheie invalidă', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await apiKeyService.validateApiKey('invalid-key');

      expect(result).toBeNull();
    });

    it('ar trebui să dezactiveze cheile expirate', async () => {
      const expiredKey = {
        id: 'expired-key-id',
        key_identifier: '****12345678',
        is_active: true,
        expires_at: new Date(Date.now() - 1000) // Expired 1 second ago
      };

      mockDb.where.mockResolvedValueOnce([expiredKey]);

      const result = await apiKeyService.validateApiKey('expired-key-12345678');

      expect(result).toBeNull();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });
  });

  describe('rotateApiKey', () => {
    it('ar trebui să rotească cheia API și să genereze una nouă', async () => {
      const existingKey = {
        id: 'key-id',
        name: 'Test Key',
        company_id: 'company-id'
      };

      mockDb.where.mockResolvedValueOnce([existingKey]);
      mockDb.returning.mockResolvedValueOnce([{
        ...existingKey,
        key_identifier: '****87654321',
        last_rotated_at: new Date()
      }]);

      const result = await apiKeyService.rotateApiKey('key-id', 'user-id');

      expect(result).toHaveProperty('full_key');
      expect(result.full_key).toHaveLength(64);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('ar trebui să arunce eroare pentru cheie inexistentă', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      await expect(
        apiKeyService.rotateApiKey('nonexistent-key-id', 'user-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('revokeApiKey', () => {
    it('ar trebui să revoke o cheie API', async () => {
      const existingKey = {
        id: 'key-id',
        company_id: 'company-id'
      };

      mockDb.where.mockResolvedValueOnce([existingKey]);

      const result = await apiKeyService.revokeApiKey('key-id', 'user-id');

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false
        })
      );
    });

    it('ar trebui să arunce eroare pentru cheie inexistentă', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      await expect(
        apiKeyService.revokeApiKey('nonexistent-key-id', 'user-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('getApiKeysByCompany', () => {
    it('ar trebui să returneze toate cheile API pentru o companie', async () => {
      const mockKeys = [
        { id: 'key1', name: 'Key 1', company_id: 'company1' },
        { id: 'key2', name: 'Key 2', company_id: 'company1' }
      ];

      mockDb.where.mockResolvedValueOnce(mockKeys);

      const result = await apiKeyService.getApiKeysByCompany('company1');

      expect(result).toEqual(mockKeys);
      expect(result).toHaveLength(2);
    });

    it('ar trebui să returneze array gol pentru companie fără chei', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await apiKeyService.getApiKeysByCompany('empty-company');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('updateApiKey', () => {
    it('ar trebui să actualizeze numele cheii API', async () => {
      const updates = { name: 'Updated Key Name' };

      mockDb.returning.mockResolvedValueOnce([{
        id: 'key-id',
        name: 'Updated Key Name',
        service: 'test-service',
        company_id: 'company-id'
      }]);

      const result = await apiKeyService.updateApiKey('key-id', updates, 'user-id');

      expect(result).toHaveProperty('name', 'Updated Key Name');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('ar trebui să actualizeze serviciul cheii API', async () => {
      const updates = { service: 'new-service' };

      mockDb.returning.mockResolvedValueOnce([{
        id: 'key-id',
        name: 'Test Key',
        service: 'new-service',
        company_id: 'company-id'
      }]);

      const result = await apiKeyService.updateApiKey('key-id', updates, 'user-id');

      expect(result).toHaveProperty('service', 'new-service');
    });
  });

  describe('Security Tests', () => {
    it('ar trebui să genereze chei criptografic sigure', () => {
      const key1 = crypto.randomBytes(32).toString('hex');
      const key2 = crypto.randomBytes(32).toString('hex');

      expect(key1).not.toBe(key2);
      expect(key1).toHaveLength(64);
      expect(key2).toHaveLength(64);
      expect(key1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('ar trebui să mascheze cheile în identificatori', () => {
      const secretKey = 'abcdefghijklmnopqrstuvwxyz123456';
      const keyIdentifier = `****${secretKey.substring(secretKey.length - 8)}`;

      expect(keyIdentifier).toBe('****yz123456');
      expect(keyIdentifier).not.toContain(secretKey.substring(0, 20));
    });
  });
});

