/**
 * E2E Tests - Admin Setup Flow
 * 
 * Testează setup-ul complet al sistemului:
 * 1. Verificare cerințe sistem
 * 2. Verificare status database
 * 3. Rulare migrări database
 * 4. Creare prim utilizator admin
 * 5. Configurări inițiale
 * 6. Verificare sistem gata de utilizare
 */

import { test, expect, Page } from '@playwright/test';
import { testLogger } from '../../../shared/logger';
import { testMetrics } from '../../../shared/metrics';

test.describe('Admin Setup Flow - E2E Tests', () => {
  let page: Page;
  const baseURL = process.env.TEST_API_URL || 'http://localhost:5000';

  test.beforeAll(async () => {
    testLogger.info('🚀 Starting Admin Setup Flow E2E Tests');
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    testMetrics.incrementCounter('e2e_test_started');
  });

  test('1️⃣ Ar trebui să verifice cerințele sistemului', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/requirements`);
    
    // Verifică că toate cerințele sunt afișate
    await expect(page.locator('h1')).toContainText('System Requirements');
    
    // Verifică cerințe Node.js
    const nodeRequirement = page.locator('[data-testid="requirement-nodejs"]');
    await expect(nodeRequirement).toBeVisible();
    await expect(nodeRequirement).toContainText('>= 18.0.0');
    
    // Verifică cerințe Database
    const dbRequirement = page.locator('[data-testid="requirement-postgres"]');
    await expect(dbRequirement).toBeVisible();
    await expect(dbRequirement).toContainText('PostgreSQL');
    
    // Verifică cerințe Memory
    const memRequirement = page.locator('[data-testid="requirement-memory"]');
    await expect(memRequirement).toBeVisible();
    
    // Verifică că toate cerințele sunt îndeplinite
    const allMetButton = page.locator('[data-testid="requirements-met"]');
    await expect(allMetButton).toBeVisible();
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('requirements_check_duration', duration);
    testLogger.info('✅ System requirements verified');
  });

  test('2️⃣ Ar trebui să afișeze status-ul database', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/database`);
    
    // Verifică conexiunea la database
    const connectionStatus = page.locator('[data-testid="db-connection"]');
    await expect(connectionStatus).toBeVisible();
    await expect(connectionStatus).toContainText('Connected');
    
    // Verifică lista de tabele
    const tablesSection = page.locator('[data-testid="db-tables"]');
    await expect(tablesSection).toBeVisible();
    
    // Verifică că există tabele core
    await expect(page.locator('text=users')).toBeVisible();
    await expect(page.locator('text=companies')).toBeVisible();
    await expect(page.locator('text=roles')).toBeVisible();
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('db_status_check_duration', duration);
    testLogger.info('✅ Database status displayed');
  });

  test('3️⃣ Ar trebui să ruleze migrările database', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/database`);
    
    // Click pe butonul de migrări
    const migrateButton = page.locator('[data-testid="run-migrations"]');
    await migrateButton.click();
    
    // Așteaptă progresul migrărilor
    await expect(page.locator('.migration-progress')).toBeVisible({ timeout: 30000 });
    
    // Așteaptă finalizarea
    await expect(page.locator('.migration-success')).toBeVisible({ timeout: 60000 });
    
    // Verifică mesajul de succes
    await expect(page.locator('.success-message')).toContainText('Migrations completed successfully');
    
    // Verifică numărul de migrări aplicate
    const migrationsApplied = await page.locator('[data-testid="migrations-count"]').textContent();
    expect(parseInt(migrationsApplied || '0')).toBeGreaterThan(0);
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('migrations_duration', duration);
    testLogger.info('✅ Database migrations completed');
    testMetrics.incrementCounter('migrations_completed');
  });

  test('4️⃣ Ar trebui să creeze primul utilizator admin', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/initialize`);
    
    // Completează formularul admin
    await page.fill('[data-testid="admin-email"]', 'admin@geniuserp.local');
    await page.fill('[data-testid="admin-password"]', 'SecureAdmin123!');
    await page.fill('[data-testid="admin-password-confirm"]', 'SecureAdmin123!');
    await page.fill('[data-testid="admin-firstname"]', 'System');
    await page.fill('[data-testid="admin-lastname"]', 'Administrator');
    
    // Completează informații companie
    await page.fill('[data-testid="company-name"]', 'GeniusERP Test Company');
    await page.fill('[data-testid="company-email"]', 'contact@geniuserp.local');
    
    // Submit formular
    await page.click('[data-testid="create-admin"]');
    
    // Așteaptă succes
    await expect(page.locator('.admin-created-success')).toBeVisible({ timeout: 10000 });
    
    // Verifică că utilizatorul a fost creat
    await expect(page.locator('[data-testid="admin-email-display"]')).toContainText('admin@geniuserp.local');
    
    // Verifică că compania a fost creată
    await expect(page.locator('[data-testid="company-name-display"]')).toContainText('GeniusERP Test Company');
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('admin_creation_duration', duration);
    testLogger.info('✅ First admin user created');
    testMetrics.incrementCounter('admin_user_created');
  });

  test('5️⃣ Ar trebui să configureze setările inițiale', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/configuration`);
    
    // Selectează limba
    await page.selectOption('[data-testid="language-select"]', 'ro');
    
    // Selectează timezone
    await page.selectOption('[data-testid="timezone-select"]', 'Europe/Bucharest');
    
    // Selectează moneda
    await page.selectOption('[data-testid="currency-select"]', 'RON');
    
    // Selectează formatul datei
    await page.selectOption('[data-testid="date-format-select"]', 'DD/MM/YYYY');
    
    // Salvează configurările
    await page.click('[data-testid="save-configuration"]');
    
    // Verifică succes
    await expect(page.locator('.config-saved-success')).toBeVisible();
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('initial_config_duration', duration);
    testLogger.info('✅ Initial configuration saved');
  });

  test('6️⃣ Ar trebui să verifice că sistemul este gata', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/setup/status`);
    
    // Verifică status-ul completării setup-ului
    await expect(page.locator('[data-testid="setup-status"]')).toContainText('Complete');
    
    // Verifică că există admin
    const hasAdmin = await page.locator('[data-testid="has-admin"]').textContent();
    expect(hasAdmin).toBe('true');
    
    // Verifică că există companie
    const hasCompany = await page.locator('[data-testid="has-company"]').textContent();
    expect(hasCompany).toBe('true');
    
    // Verifică că migrările sunt la zi
    const migrationsUpToDate = await page.locator('[data-testid="migrations-up-to-date"]').textContent();
    expect(migrationsUpToDate).toBe('true');
    
    // Click pe butonul "Go to Dashboard"
    await page.click('[data-testid="go-to-dashboard"]');
    
    // Verifică redirecționarea la dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('setup_verification_duration', duration);
    testLogger.info('✅ System setup verified and ready');
    testMetrics.incrementCounter('setup_completed');
  });

  test('7️⃣ Ar trebui să permită login cu adminul creat', async () => {
    const startTime = Date.now();

    await page.goto(`${baseURL}/login`);
    
    // Login cu credențiale admin
    await page.fill('[data-testid="email"]', 'admin@geniuserp.local');
    await page.fill('[data-testid="password"]', 'SecureAdmin123!');
    await page.click('[data-testid="login-button"]');
    
    // Verifică redirecționarea la dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
    
    // Verifică că utilizatorul este logat
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText('System Administrator');
    
    // Verifică că are rol admin
    await expect(page.locator('[data-testid="user-role"]')).toContainText('Admin');
    
    const duration = Date.now() - startTime;
    testMetrics.recordMetric('admin_login_duration', duration);
    testLogger.info('✅ Admin login successful');
    testMetrics.incrementCounter('admin_login_success');
  });

  test('⚡ Ar trebui să completeze setup-ul complet în < 2 minute', async () => {
    const startTime = Date.now();
    
    // Rulează toate pașii setup-ului
    // 1. Requirements check
    await page.goto(`${baseURL}/setup/requirements`);
    await expect(page.locator('[data-testid="requirements-met"]')).toBeVisible();
    
    // 2. Database status
    await page.goto(`${baseURL}/setup/database`);
    await expect(page.locator('[data-testid="db-connection"]')).toContainText('Connected');
    
    // 3. Skip migrations dacă sunt deja rulate
    
    // 4. Create admin
    await page.goto(`${baseURL}/setup/initialize`);
    await page.fill('[data-testid="admin-email"]', `admin${Date.now()}@test.local`);
    await page.fill('[data-testid="admin-password"]', 'TestPass123!');
    await page.fill('[data-testid="admin-password-confirm"]', 'TestPass123!');
    await page.fill('[data-testid="company-name"]', 'Test Company');
    await page.click('[data-testid="create-admin"]');
    await expect(page.locator('.admin-created-success')).toBeVisible();
    
    // 5. Configuration
    await page.goto(`${baseURL}/setup/configuration`);
    await page.selectOption('[data-testid="language-select"]', 'ro');
    await page.click('[data-testid="save-configuration"]');
    await expect(page.locator('.config-saved-success')).toBeVisible();
    
    // 6. Verify complete
    await page.goto(`${baseURL}/setup/status`);
    await expect(page.locator('[data-testid="setup-status"]')).toContainText('Complete');
    
    const totalDuration = Date.now() - startTime;
    testMetrics.recordMetric('full_setup_duration', totalDuration);
    
    testLogger.info('⚡ Complete setup flow', {
      duration: `${(totalDuration / 1000).toFixed(2)}s`
    });
    
    // Verifică că setup-ul s-a făcut în mai puțin de 2 minute
    expect(totalDuration).toBeLessThan(120000); // 120 secunde = 2 minute
  });

  test.afterAll(async () => {
    testLogger.info('✨ Admin Setup Flow E2E Tests completed');
    await testMetrics.reportFinalMetrics(true);
  });
});

