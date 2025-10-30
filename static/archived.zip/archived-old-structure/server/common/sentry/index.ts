/**
 * GeniusERP - Central Sentry Integration Module
 * 
 * Centralizează tracking-ul erorilor cu Sentry across toată aplicația
 * Oferă helpers pentru capturare context-aware errors
 */

import * as Sentry from '@sentry/node';
import { createModuleLogger } from '../logger/loki-logger';

const logger = createModuleLogger('sentry');

// Track dacă Sentry e activ
let isSentryActive = false;

/**
 * Verifică dacă Sentry e activ
 */
export function isSentryEnabled(): boolean {
  return isSentryActive && !!process.env.SENTRY_DSN;
}

/**
 * Setează status Sentry
 */
export function setSentryActive(active: boolean): void {
  isSentryActive = active;
}

/**
 * Capturează o excepție cu context complet
 */
export function captureException(
  error: Error,
  context?: {
    module?: string;
    operation?: string;
    userId?: string | number;
    companyId?: string | number;
    extra?: Record<string, any>;
  }
): void {
  if (!isSentryEnabled()) {
    logger.debug('Sentry disabled, eroare nu a fost trimisă', { error: error.message });
    return;
  }

  // Setează scope cu context
  Sentry.withScope((scope) => {
    if (context?.module) {
      scope.setTag('module', context.module);
    }

    if (context?.operation) {
      scope.setTag('operation', context.operation);
    }

    if (context?.userId) {
      scope.setUser({ id: String(context.userId) });
    }

    if (context?.companyId) {
      scope.setTag('company_id', String(context.companyId));
    }

    if (context?.extra) {
      scope.setContext('extra_data', context.extra);
    }

    Sentry.captureException(error);
  });

  logger.info('Eroare trimisă către Sentry', { 
    error: error.message, 
    module: context?.module,
    operation: context?.operation 
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
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('message_context', context);
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
  if (!isSentryEnabled()) {
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
 * Setează user context pentru toate erorile următoare
 */
export function setUserContext(user: {
  id: string | number;
  email?: string;
  username?: string;
  companyId?: string | number;
}): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.username,
  });

  if (user.companyId) {
    Sentry.setTag('company_id', String(user.companyId));
  }
}

/**
 * Clear user context (logout)
 */
export function clearUserContext(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Wrapped function cu error tracking automat
 */
export function withSentry<T extends (...args: any[]) => any>(
  fn: T,
  context: {
    module: string;
    operation: string;
  }
): T {
  return ((...args: any[]) => {
    try {
      addBreadcrumb(
        `${context.operation} started`,
        context.module,
        { args: args.length },
        'info'
      );

      const result = fn(...args);

      // Dacă e Promise, track și async errors
      if (result instanceof Promise) {
        return result.catch((error) => {
          captureException(error, context);
          throw error;
        });
      }

      return result;
    } catch (error) {
      captureException(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Decorator pentru metode de clasă (folosit în servicii)
 */
export function SentryTrack(module: string, operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const op = operation || propertyKey;

    descriptor.value = function (...args: any[]) {
      return withSentry(originalMethod.bind(this), { module, operation: op })(...args);
    };

    return descriptor;
  };
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
        extra,
      });
    },

    captureMessage: (message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') => {
      captureMessage(message, level, { module: moduleName });
    },

    addBreadcrumb: (message: string, data?: Record<string, any>) => {
      addBreadcrumb(message, moduleName, data);
    },

    withTracking: <T extends (...args: any[]) => any>(fn: T, operation: string): T => {
      return withSentry(fn, { module: moduleName, operation });
    },
  };
}

// Export all Sentry utilities
export { Sentry };

