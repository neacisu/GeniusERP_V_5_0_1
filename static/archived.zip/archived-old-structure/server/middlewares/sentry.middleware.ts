import * as Sentry from '@sentry/node';
import { Express } from 'express';
import { setSentryActive } from '../common/sentry';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('sentry-middleware');

/**
 * Inițializează Sentry pentru tracking-ul erorilor în backend
 * Folosește Sentry SaaS (sentry.io) pentru agregarea erorilor
 * API Sentry v10+
 */
export function initializeSentry(app: Express): void {
  // Verifică dacă SENTRY_DSN este configurat
  if (!process.env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN nu este configurat - Sentry error tracking disabled');
    logger.warn('Pentru a activa Sentry, configurează SENTRY_DSN în fișierul .env');
    logger.warn('Vizitează https://sentry.io pentru a crea un cont și a obține DSN-ul');
    setSentryActive(false);
    return;
  }

  logger.info('Inițializare Sentry error tracking...');

  // Configurare Sentry v10+ API
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations (API v10+)
    integrations: [
      // HTTP tracing
      Sentry.httpIntegration(),
      
      // Express integration - instrumentare automată (fără parametri în v10+)
      Sentry.expressIntegration(),
    ],

    // Release tracking
    release: process.env.npm_package_version || '1.0.0',

    // Ignore specific errors
    ignoreErrors: [
      // Browser errors that shouldn't be tracked on backend
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'NetworkError',
      'Network request failed',
    ],

    // Before send hook - pentru filtrare suplimentară
    beforeSend(event) {
      // Nu trimite erori din development dacă nu vrei
      if (process.env.NODE_ENV === 'development' && process.env.SENTRY_SKIP_DEV === 'true') {
        return null;
      }
      
      // Log că trimitem eroare către Sentry
      logger.debug('Sending error to Sentry', { 
        message: event.message,
        level: event.level 
      });
      
      return event;
    },
  });

  // Marchează Sentry ca activ
  setSentryActive(true);
  logger.info('✅ Sentry error tracking activat');
}

/**
 * Returnează error handler-ul Sentry (API v10+)
 * Trebuie aplicat DUPĂ toate rutele, dar ÎNAINTE de error handler-ul default
 */
export function sentryErrorHandler(app: Express) {
  // Dacă SENTRY_DSN nu e configurat, returnează un middleware gol
  if (!process.env.SENTRY_DSN) {
    return (err: any, req: any, res: any, next: any) => next(err);
  }

  // API v10+: setupExpressErrorHandler primește app ca parametru
  // Această funcție adaugă error handler-ul direct la app
  Sentry.setupExpressErrorHandler(app);
  
  // Returnăm un middleware pass-through pentru compatibilitate cu apelurile existente
  return (err: any, req: any, res: any, next: any) => next(err);
}

// Re-export helpers from central module
export { 
  captureException, 
  captureMessage,
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  withSentry,
  createModuleSentry,
  isSentryEnabled
} from '../common/sentry';
