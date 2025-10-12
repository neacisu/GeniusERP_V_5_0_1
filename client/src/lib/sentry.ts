import * as Sentry from '@sentry/react';

/**
 * Inițializează Sentry pentru tracking-ul erorilor în frontend
 * Folosește Sentry SaaS (sentry.io) pentru agregarea erorilor
 */
export function initializeSentry(): void {
  // Verifică dacă VITE_SENTRY_DSN este configurat
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('⚠️  VITE_SENTRY_DSN nu este configurat - Sentry error tracking disabled');
    console.warn('   Pentru a activa Sentry, configurează VITE_SENTRY_DSN în fișierul .env');
    console.warn('   Vizitează https://sentry.io pentru a crea un cont și a obține DSN-ul');
    return;
  }

  console.log('🔍 Inițializare Sentry error tracking (Frontend)...');

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    
    // Integrations (API v10+)
    integrations: [
      // Browser tracing pentru performance monitoring (API v10+)
      Sentry.browserTracingIntegration(),
      
      // Session Replay pentru înregistrarea sesiunilor cu erori (API v10+)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Trace propagation targets (moved to top-level in v10+)
    tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.geniuserp\.ro/],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% din sesiuni
    replaysOnErrorSampleRate: 1.0, // 100% din sesiunile cu erori

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Send default PII (Personal Identifiable Information) like IP address
    // Recommended by Sentry for better error context
    sendDefaultPii: true,

    // Ignore specific errors
    ignoreErrors: [
      // Erori comune care nu sunt relevante
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Erori de rețea care nu sunt controlabile
      'NetworkError',
      'Network request failed',
      // Erori de la extensii browser
      'chrome-extension://',
      'moz-extension://',
    ],

    // Before send hook
    beforeSend(event, hint) {
      // În development, afișează erorile în consolă
      if (import.meta.env.DEV) {
        console.error('Sentry captured error:', hint.originalException || hint.syntheticException);
      }
      
      return event;
    },
  });

  console.log('✅ Sentry error tracking activat (Frontend)');
}

/**
 * Helper pentru capturarea manuală a excepțiilor în frontend
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return; // Sentry not configured
  }

  Sentry.withScope((scope) => {
    if (context) {
      // Add all context as extra data
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });

      // Set user if present
      if (context.userId) {
        scope.setUser({ id: String(context.userId) });
      }

      // Set tags for better filtering
      if (context.module) {
        scope.setTag('module', context.module);
      }
      if (context.operation) {
        scope.setTag('operation', context.operation);
      }
    }

    Sentry.captureException(error);
  });
}

/**
 * Capturează un mesaj custom
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setExtra(key, context[key]);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

/**
 * Adaugă breadcrumb pentru tracking flow
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Setează user context
 */
export function setUserContext(user: {
  id: string | number;
  email?: string;
  username?: string;
}): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (logout)
 */
export function clearUserContext(): void {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Helper pentru module-specific error tracking
 */
export function createModuleSentry(moduleName: string) {
  return {
    captureException: (error: Error, operation?: string, extra?: Record<string, any>) => {
      captureException(error, {
        module: moduleName,
        operation,
        ...extra,
      });
    },

    captureMessage: (message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') => {
      captureMessage(message, level, { module: moduleName });
    },

    addBreadcrumb: (message: string, data?: Record<string, any>) => {
      addBreadcrumb(message, moduleName, data);
    },
  };
}
