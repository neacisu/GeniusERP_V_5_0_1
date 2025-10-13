/**
 * Configurație Cypress pentru testele E2E GeniusERP
 */

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL
    baseUrl: 'http://localhost:5000',
    
    // Spec patterns
    specPattern: 'utils/testing/modules/**/e2e/**/*.cypress.ts',
    
    // Support file
    supportFile: 'utils/testing/config/cypress.support.ts',
    
    // Fixtures folder
    fixturesFolder: 'utils/testing/fixtures',
    
    // Screenshots folder
    screenshotsFolder: 'utils/testing/screenshots/cypress',
    
    // Videos folder
    videosFolder: 'utils/testing/videos/cypress',
    
    // Downloads folder
    downloadsFolder: 'utils/testing/downloads/cypress',
    
    // Video recording
    video: true,
    videoCompression: 32,
    
    // Screenshot on failure
    screenshotOnRunFailure: true,
    
    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    
    // Retry
    retries: {
      runMode: 2,
      openMode: 0,
    },
    
    // Watch for file changes
    watchForFileChanges: true,
    
    // Chrome web security
    chromeWebSecurity: false,
    
    // Experimental features
    experimentalStudio: true,
    
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      
      // Reporter - log results pentru debugging
      on('after:run', (results) => {
        if (results) {
          // Silent - results sunt loggate automat de Cypress
        }
      });
      
      return config;
    },
  },
  
  // Component testing (optional)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'client/src/**/*.cy.{js,jsx,ts,tsx}',
  },
  
  // Environment variables
  env: {
    apiUrl: 'http://localhost:5000/api',
  },
});

