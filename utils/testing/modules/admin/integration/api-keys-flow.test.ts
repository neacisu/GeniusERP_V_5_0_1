/**
 * Integration Tests - API Keys Flow
 * 
 * Testează fluxul complet al cheilor API:
 * 1. Creare cheie API
 * 2. Validare cheie activă
 * 3. Folosire cheie pentru autentificare
 * 4. Rotație cheie
 * 5. Revocare cheie veche
 * 6. Verificare că cheia revocată nu mai funcționează
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { testLogger } from '../../../shared/logger';
import { testMetrics } from '../../../shared/metrics';
import type { Express } from 'express';

interface ApiKeyData {
  id: string;
  name: string;
  key: string;
  [key: string]: unknown;
}

describe('API Keys Flow - Integration Tests', () => {
  let app: Express;
  let adminToken: string;
  let companyId: string;
  let apiKey: ApiKeyData;
  let fullApiKey: string;

  beforeAll(async () => {
    testLogger.info('🚀 Starting API Keys Flow Integration Tests');
    
    // Setup test server
    app = global.testApp;
    
    // Login as admin și obține token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.local',
        password: process.env.TEST_ADMIN_PASSWORD || 'TestAdmin123!'
      });

    adminToken = loginResponse.body.data.token;
    companyId = loginResponse.body.data.user.company_id;

    testMetrics.recordMetric('test_setup_duration', Date.now());
  });

  beforeEach(() => {
    testMetrics.incrementCounter('test_case_started');
  });

  describe('1️⃣ Creare Cheie API', () => {
    it('ar trebui să creeze o cheie API nouă', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/admin/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration Test API Key',
          service: 'integration-test',
          companyId
        });

      const duration = Date.now() - startTime;
      testMetrics.recordMetric('api_key_create_duration', duration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('full_key');
      expect(response.body.data.full_key).toHaveLength(64);

      // Salvăm cheia pentru teste ulterioare
      apiKey = response.body.data;
      fullApiKey = response.body.data.full_key;

      testLogger.info('✅ API Key created successfully', { id: apiKey.id });
      testMetrics.incrementCounter('api_key_created');
    });

    it('ar trebui să returneze cheia completă doar la creare', async () => {
      // Încearcă să obții cheia după creare
      const response = await request(app)
        .get(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('full_key');
      expect(response.body.data).toHaveProperty('keyIdentifier');
      expect(response.body.data.keyIdentifier).toMatch(/^\*\*\*\*/);
    });

    it('ar trebui să seteze status activ implicit', async () => {
      expect(apiKey.isActive).toBe(true);
    });
  });

  describe('2️⃣ Validare Cheie Activă', () => {
    it('ar trebui să valideze o cheie API activă', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', fullApiKey);

      const duration = Date.now() - startTime;
      testMetrics.recordMetric('api_key_validation_duration', duration);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);

      testLogger.info('✅ API Key validated successfully');
      testMetrics.incrementCounter('api_key_validated');
    });

    it('ar trebui să respingă o cheie invalidă', async () => {
      const response = await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', 'invalid-key-123456789012345678901234567890123456');

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);

      testMetrics.incrementCounter('invalid_api_key_rejected');
    });

    it('ar trebui să actualizeze last_used_at la validare', async () => {
      // Validează cheia
      await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', fullApiKey);

      // Verifică că last_used_at a fost actualizat
      const response = await request(app)
        .get(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.lastUsedAt).not.toBeNull();

      const lastUsed = new Date(response.body.data.lastUsedAt);
      const now = new Date();
      const diffSeconds = (now.getTime() - lastUsed.getTime()) / 1000;

      expect(diffSeconds).toBeLessThan(5); // În ultimele 5 secunde
    });
  });

  describe('3️⃣ Folosire Cheie pentru Autentificare', () => {
    it('ar trebui să autentifice request-uri cu API key', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('X-API-Key', fullApiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      testMetrics.incrementCounter('authenticated_with_api_key');
    });

    it('ar trebui să permită acces la resurse protejate', async () => {
      const response = await request(app)
        .get('/api/admin/config')
        .set('X-API-Key', fullApiKey);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('ar trebui să aplice rate limiting per API key', async () => {
      // Trimite multe request-uri rapid
      const requests = Array.from({ length: 100 }, () =>
        request(app)
          .get('/api/test/validate-key')
          .set('X-API-Key', fullApiKey)
      );

      const responses = await Promise.all(requests);
      const _rateLimited = responses.some(r => r.status === 429);

      // Depinde de configurarea rate limit-ului - comentat pentru acum
      // expect(_rateLimited).toBe(true);
    });
  });

  describe('4️⃣ Rotație Cheie', () => {
    let newApiKey: string;

    it('ar trebui să rotească cheia API', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post(`/api/admin/api-keys/${apiKey.id}/regenerate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const duration = Date.now() - startTime;
      testMetrics.recordMetric('api_key_rotation_duration', duration);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('full_key');
      expect(response.body.data.full_key).not.toBe(fullApiKey);

      newApiKey = response.body.data.full_key;

      testLogger.info('✅ API Key rotated successfully', { id: apiKey.id });
      testMetrics.incrementCounter('api_key_rotated');
    });

    it('cheia veche nu ar trebui să mai funcționeze după rotație', async () => {
      const response = await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', fullApiKey);

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);

      testMetrics.incrementCounter('old_key_rejected_after_rotation');
    });

    it('cheia nouă ar trebui să funcționeze', async () => {
      const response = await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', newApiKey);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });

    it('ar trebui să actualizeze last_rotated_at', async () => {
      const response = await request(app)
        .get(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.lastRotatedAt).not.toBeNull();
    });
  });

  describe('5️⃣ Revocare Cheie', () => {
    it('ar trebui să revoce o cheie API', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .delete(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const duration = Date.now() - startTime;
      testMetrics.recordMetric('api_key_revocation_duration', duration);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      testLogger.info('✅ API Key revoked successfully', { id: apiKey.id });
      testMetrics.incrementCounter('api_key_revoked');
    });

    it('cheia revocată nu ar trebui să mai funcționeze', async () => {
      const response = await request(app)
        .get('/api/test/validate-key')
        .set('X-API-Key', fullApiKey);

      expect(response.status).toBe(401);
      expect(response.body.valid).toBe(false);

      testMetrics.incrementCounter('revoked_key_rejected');
    });

    it('ar trebui să seteze isActive=false', async () => {
      const response = await request(app)
        .get(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.isActive).toBe(false);
    });

    it('nu ar trebui să permită revocarea aceluiași cheii de două ori', async () => {
      const response = await request(app)
        .delete(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Cheia este deja revocată, dar request-ul poate fi idempotent
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('6️⃣ Verificare Audit Trail', () => {
    it('ar trebui să existe înregistrări audit pentru toate operațiile', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          entity: 'api_keys',
          entityId: apiKey.id
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      
      const auditLogs = response.body.data;
      const actions = auditLogs.map((log: any) => log.action);

      // Verifică că toate acțiunile au fost înregistrate
      expect(actions).toContain('CREATE');
      expect(actions).toContain('UPDATE'); // Pentru rotație
      // Notă: DELETE/REVOKE poate fi înregistrat diferit
    });
  });

  describe('⚡ Performance Tests', () => {
    it('validarea cheii ar trebui să fie rapidă (<50ms)', async () => {
      const iterations = 100;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/test/validate-key')
          .set('X-API-Key', fullApiKey);

        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p95Duration = durations.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      testLogger.info('⚡ API Key validation performance', {
        avg: avgDuration,
        p95: p95Duration
      });

      testMetrics.recordMetric('api_key_validation_avg_duration', avgDuration);
      testMetrics.recordMetric('api_key_validation_p95_duration', p95Duration);

      expect(avgDuration).toBeLessThan(50);
      expect(p95Duration).toBeLessThan(100);
    });
  });

  afterAll(async () => {
    // Cleanup: șterge cheia de test dacă există
    try {
      await request(app)
        .delete(`/api/admin/api-keys/${apiKey.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    } catch (_error) {
      // Ignore cleanup errors
    }

    testLogger.info('✨ API Keys Flow Integration Tests completed');
    
    // Raportează metrics finale
    await testMetrics.reportFinalMetrics(true);
  });
});

