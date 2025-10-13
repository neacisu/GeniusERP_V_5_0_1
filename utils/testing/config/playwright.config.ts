/**
 * Configurație Playwright pentru testele E2E GeniusERP
 */

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export default defineConfig({
  // Test directory
  testDir: '../modules',
  
  // Test match patterns
  testMatch: '**/e2e/**/*.playwright.ts',
  
  // Timeout
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  
  // Fullyparallel
  fullyParallel: false,
  
  // Fail on console errors
  forbidOnly: !!process.env.CI,
  
  // Retry on CI
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 1 : 4,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: '../reports/playwright' }],
    ['json', { outputFile: '../reports/playwright/results.json' }],
    ['junit', { outputFile: '../reports/playwright/junit.xml' }],
    ['list'],
  ],
  
  // Shared settings
  use: {
    // Base URL
    baseURL: BASE_URL,
    
    // Browser options
    headless: true,
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on failure
    trace: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Projects (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // Web server (optional - start app before tests)
  // webServer: {
  //   command: 'npm run dev',
  //   url: BASE_URL,
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },
  
  // Output folder
  outputDir: '../test-results/playwright',
});

