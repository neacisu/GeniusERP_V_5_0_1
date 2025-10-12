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
    
    // Integrations
    integrations: [
      // Browser tracing pentru performance monitoring
      new Sentry.BrowserTracing({
        // Set tracing origins pentru a captura request-uri către API
        tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.geniuserp\.ro/],
      }),
      
      // Session Replay pentru înregistrarea sesiunilor cu erori
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% din sesiuni
    replaysOnErrorSampleRate: 1.0, // 100% din sesiunile cu erori

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

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
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Helper pentru capturarea mesajelor custom
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Helper pentru setarea user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user);
}

