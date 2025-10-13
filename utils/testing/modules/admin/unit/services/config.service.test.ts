/**
 * Unit Tests - ConfigService
 * 
 * Teste pentru gestionarea configurărilor sistem:
 * - Get/Set configurări (global, company, user, module scope)
 * - Cascade fallback pentru configurări
 * - Cache management
 * - Reset to defaults
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigService, ConfigScope } from '../../../../../../server/modules/admin/services/config.service';
import type { MockDatabase } from '../../../../types/global';

describe('ConfigService - Unit Tests', () => {
  let configService: ConfigService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        id: 'config-id',
        key: 'test.setting',
        value: 'test-value',
        scope: ConfigScope.GLOBAL,
        created_at: new Date(),
        updated_at: new Date()
      }]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue([])
    };

    configService = new ConfigService(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setConfig', () => {
    it('ar trebui să creeze o configurare globală nouă', async () => {
      mockDb.where.mockResolvedValueOnce([]); // Nu există configurare existentă

      const result = await configService.setConfig(
        'app.theme',
        'dark',
        { scope: ConfigScope.GLOBAL },
        'user-id'
      );

      expect(result).toHaveProperty('key', 'test.setting');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('ar trebui să actualizeze o configurare existentă', async () => {
      const existingConfig = {
        id: 'existing-id',
        key: 'app.theme',
        value: 'light'
      };

      mockDb.where.mockResolvedValueOnce([existingConfig]);

      await configService.setConfig(
        'app.theme',
        'dark',
        { scope: ConfigScope.GLOBAL },
        'user-id'
      );

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'dark'
        })
      );
    });

    it('ar trebui să valideze company ID pentru scope COMPANY', async () => {
      await expect(
        configService.setConfig(
          'company.setting',
          'value',
          { scope: ConfigScope.COMPANY }, // Missing companyId
          'user-id'
        )
      ).rejects.toThrow('Company ID is required');
    });

    it('ar trebui să valideze user ID și company ID pentru scope USER', async () => {
      await expect(
        configService.setConfig(
          'user.preference',
          'value',
          { scope: ConfigScope.USER, companyId: 'company-id' }, // Missing userId
          'user-id'
        )
      ).rejects.toThrow('User ID');
    });
  });

  describe('getConfig', () => {
    it('ar trebui să obțină o configurare din cache', async () => {
      // Prima dată, obține din DB
      mockDb.where.mockResolvedValueOnce([{
        key: 'cached.setting',
        value: 'cached-value',
        scope: ConfigScope.GLOBAL
      }]);

      const result1 = await configService.getConfig('cached.setting', {
        scope: ConfigScope.GLOBAL,
        useCache: true
      });

      // A doua oară, ar trebui să vină din cache
      const result2 = await configService.getConfig('cached.setting', {
        scope: ConfigScope.GLOBAL,
        useCache: true
      });

      expect(result1).toEqual(result2);
      expect(mockDb.select).toHaveBeenCalledTimes(1); // Doar o singură dată
    });

    it('ar trebui să bypass cache când useCache=false', async () => {
      mockDb.where.mockResolvedValue([{
        key: 'no-cache.setting',
        value: 'value'
      }]);

      await configService.getConfig('no-cache.setting', {
        scope: ConfigScope.GLOBAL,
        useCache: false
      });

      await configService.getConfig('no-cache.setting', {
        scope: ConfigScope.GLOBAL,
        useCache: false
      });

      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('ar trebui să returneze null pentru configurare inexistentă', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await configService.getConfig('nonexistent', {
        scope: ConfigScope.GLOBAL
      });

      expect(result).toBeNull();
    });
  });

  describe('getConfigWithFallback', () => {
    it('ar trebui să aplice cascade fallback: user > company > module > global', async () => {
      // Mock pentru a returna null pentru user și company scope
      mockDb.where
        .mockResolvedValueOnce([]) // User scope - nu există
        .mockResolvedValueOnce([]) // Company scope - nu există
        .mockResolvedValueOnce([{  // Global scope - există
          key: 'fallback.setting',
          value: 'global-value',
          scope: ConfigScope.GLOBAL
        }]);

      const result = await configService.getConfigWithFallback('fallback.setting', {
        userId: 'user-id',
        companyId: 'company-id',
        useCache: false
      });

      expect(result).toHaveProperty('value', 'global-value');
      expect(mockDb.select).toHaveBeenCalledTimes(3); // User, Company, Global
    });

    it('ar trebui să returneze configurarea user dacă există', async () => {
      mockDb.where.mockResolvedValueOnce([{
        key: 'priority.setting',
        value: 'user-value',
        scope: ConfigScope.USER
      }]);

      const result = await configService.getConfigWithFallback('priority.setting', {
        userId: 'user-id',
        companyId: 'company-id',
        useCache: false
      });

      expect(result).toHaveProperty('value', 'user-value');
      expect(mockDb.select).toHaveBeenCalledTimes(1); // Doar user scope
    });
  });

  describe('deleteConfig', () => {
    it('ar trebui să șteargă o configurare existentă', async () => {
      mockDb.where.mockResolvedValueOnce([{
        id: 'config-id',
        key: 'to-delete'
      }]);

      const result = await configService.deleteConfig(
        'to-delete',
        { scope: ConfigScope.GLOBAL },
        'user-id'
      );

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('ar trebui să returneze false pentru configurare inexistentă', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await configService.deleteConfig(
        'nonexistent',
        { scope: ConfigScope.GLOBAL },
        'user-id'
      );

      expect(result).toBe(false);
    });

    it('ar trebui să invalideze cache-ul după ștergere', async () => {
      mockDb.where.mockResolvedValueOnce([{
        id: 'config-id',
        key: 'cached.config'
      }]);

      await configService.deleteConfig(
        'cached.config',
        { scope: ConfigScope.GLOBAL },
        'user-id'
      );

      // Verificăm că cache-ul este invalidat prin a obține din DB din nou
      mockDb.where.mockResolvedValueOnce([]);
      const result = await configService.getConfig('cached.config', {
        scope: ConfigScope.GLOBAL,
        useCache: true
      });

      expect(result).toBeNull();
    });
  });

  describe('listConfigurations', () => {
    it('ar trebui să listeze configurări cu paginare', async () => {
      const mockConfigs = Array.from({ length: 5 }, (_, i) => ({
        id: `config-${i}`,
        key: `key-${i}`,
        value: `value-${i}`
      }));

      mockDb.offset.mockResolvedValueOnce(mockConfigs);

      const result = await configService.listConfigurations({
        limit: 5,
        offset: 0
      });

      expect(result).toHaveLength(5);
      expect(mockDb.limit).toHaveBeenCalledWith(5);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
    });

    it('ar trebui să filtreze după scope', async () => {
      mockDb.offset.mockResolvedValueOnce([]);

      await configService.listConfigurations({
        scope: ConfigScope.COMPANY,
        companyId: 'company-id'
      });

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('ar trebui să filtreze după keyPrefix', async () => {
      mockDb.offset.mockResolvedValueOnce([]);

      await configService.listConfigurations({
        keyPrefix: 'app.'
      });

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('resetToDefaults', () => {
    it('ar trebui să reseteze toate configurările non-global', async () => {
      await configService.resetToDefaults();

      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('ar trebui să reseteze doar configurările pentru o companie specifică', async () => {
      await configService.resetToDefaults({
        companyId: 'company-id'
      });

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('ar trebui să șteargă cache-ul după reset', async () => {
      const clearCacheSpy = vi.spyOn(configService, 'clearCache');

      await configService.resetToDefaults();

      expect(clearCacheSpy).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('ar trebui să expire cache-ul după TTL', async () => {
      // Setăm un TTL foarte scurt
      (configService as any).cacheTTL = 10; // 10ms

      mockDb.where.mockResolvedValueOnce([{
        key: 'expiring.config',
        value: 'initial-value'
      }]);

      // Prima obținere - din DB
      await configService.getConfig('expiring.config', {
        scope: ConfigScope.GLOBAL,
        useCache: true
      });

      // Așteptăm să expire cache-ul
      await new Promise(resolve => setTimeout(resolve, 15));

      mockDb.where.mockResolvedValueOnce([{
        key: 'expiring.config',
        value: 'updated-value'
      }]);

      // A doua obținere - ar trebui să fie din DB din nou
      const result = await configService.getConfig('expiring.config', {
        scope: ConfigScope.GLOBAL,
        useCache: true
      });

      expect(result).toHaveProperty('value', 'updated-value');
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('ar trebui să curățe complet cache-ul', () => {
      configService.clearCache();

      // Verificăm că cache-ul este gol
      const cache = (configService as any).cache;
      expect(cache.size).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('ar trebui să gestioneze volume mari de configurări', async () => {
      const configs = Array.from({ length: 1000 }, (_, i) => ({
        key: `perf.key.${i}`,
        value: `value-${i}`,
        scope: ConfigScope.GLOBAL
      }));

      mockDb.offset.mockResolvedValueOnce(configs);

      const startTime = Date.now();
      const result = await configService.listConfigurations({
        limit: 1000,
        offset: 0
      });
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Sub 1 secundă
    });
  });
});

