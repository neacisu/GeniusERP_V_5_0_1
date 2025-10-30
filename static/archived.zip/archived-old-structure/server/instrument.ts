/**
 * Sentry Instrumentation
 * 
 * This file MUST be imported before any other imports in the application.
 * For ESM modules, use: node --import ./server/instrument.js server/index.js
 * 
 * See: https://docs.sentry.io/platforms/javascript/guides/express/install/esm/
 */

import * as Sentry from '@sentry/node';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Only initialize if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  console.log('[Sentry] Initializing Sentry instrumentation...');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations for Express and HTTP
    integrations: [
      // HTTP tracing
      Sentry.httpIntegration(),
      
      // Express integration - auto-instruments Express
      Sentry.expressIntegration(),
      
      // Node.js integrations
      Sentry.nativeNodeFetchIntegration(),
    ],

    // Release tracking
    release: process.env.npm_package_version || '1.0.0',

    // Ignore specific errors
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'NetworkError',
      'Network request failed',
    ],

    // Before send hook
    beforeSend(event) {
      // Don't send errors from development if configured
      if (process.env.NODE_ENV === 'development' && process.env.SENTRY_SKIP_DEV === 'true') {
        return null;
      }
      
      return event;
    },
  });
  
  console.log('[Sentry] ✅ Sentry instrumentation initialized');
} else {
  console.log('[Sentry] SENTRY_DSN not configured - Sentry disabled');
}

