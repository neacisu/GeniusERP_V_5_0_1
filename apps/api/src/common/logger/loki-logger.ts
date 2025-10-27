/**
 * GeniusERP Central Logger with Loki Integration
 * 
 * Features:
 * - Winston logger with Loki transport
 * - Console output for development
 * - Structured logging with context
 * - Automatic error tracking
 * - Module-based logging
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';

// Determine environment
const isDevelopment = process.env['NODE_ENV'] === 'development';
const LOG_LEVEL = process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info');

// Loki configuration - all from .env, no hardcoded fallbacks
const LOKI_HOST = process.env['LOKI_HOST']!;
const APP_NAME = 'geniuserp-app';
const HOSTNAME = process.env['HOSTNAME'] || require('os').hostname();

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, module, ...metadata }) => {
    const moduleStr = module ? `[${module}]` : '';
    const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `${timestamp} ${level} ${moduleStr} ${message} ${metaStr}`;
  })
);

// Custom format for Loki (JSON structured)
const lokiFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: LOG_LEVEL,
  })
);

// Loki transport (only if Loki is available)
try {
  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      labels: {
        job: APP_NAME,
        hostname: HOSTNAME,
        environment: process.env['NODE_ENV'] || 'development',
      },
      json: true,
      format: lokiFormat,
      replaceTimestamp: true,
      timeout: 30000, // 30 seconds timeout
      batching: true,
      interval: 5, // Send every 5 seconds
      onConnectionError: (err: unknown) => {
        // Silent fail if Loki is not available
        if (isDevelopment) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error('Loki connection error (will continue without Loki):', errorMessage || 'Unknown error', err);
        }
      },
    })
  );
} catch (error) {
  if (isDevelopment) {
    console.warn('Loki transport not available, logging only to console');
  }
}

// Create the logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  exitOnError: false,
});

// Helper type for context
export interface LogContext {
  module?: string;
  userId?: string | number;
  companyId?: string | number;
  requestId?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Create a module-specific logger
 */
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, context?: LogContext) => {
      logger.debug(message, { module: moduleName, ...context });
    },
    
    info: (message: string, context?: LogContext) => {
      logger.info(message, { module: moduleName, ...context });
    },
    
    warn: (message: string, context?: LogContext) => {
      logger.warn(message, { module: moduleName, ...context });
    },
    
    error: (message: string, error?: Error | any, context?: LogContext) => {
      logger.error(message, {
        module: moduleName,
        error: error?.message,
        stack: error?.stack,
        ...context,
      });
      
      // Send to Sentry with module context
      if (error) {
        try {
          const { captureException, isSentryEnabled } = require('../sentry');
          if (isSentryEnabled()) {
            captureException(error, {
              module: moduleName,
              extra: context,
            });
          }
        } catch (e) {
          // Sentry integration failed, continue without it
        }
      }
    },
    
    http: (message: string, context?: LogContext) => {
      logger.http(message, { module: moduleName, ...context });
    },
  };
}

/**
 * Main logger export (for backward compatibility)
 */
export const log = {
  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  },
  
  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },
  
  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },
  
  error: (message: string, error?: Error | any, context?: LogContext) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...context,
    });
    
    // Send critical errors to Sentry also
    if (error) {
      try {
        // Dynamic import pentru a evita circular dependency
        const { captureException, isSentryEnabled } = require('../sentry');
        if (isSentryEnabled()) {
          captureException(error, {
            module: context?.module,
            extra: context,
          });
        }
      } catch (e) {
        // Sentry nu e disponibil sau are probleme, continuăm fără
      }
    }
  },
  
  http: (message: string, context?: LogContext) => {
    logger.http(message, context);
  },
};

// Export the raw winston logger for advanced usage
export default logger;

// Export a function to log operations (for tracking business events)
export function logOperation(
  operation: string,
  status: 'start' | 'success' | 'error',
  context?: LogContext
) {
  const message = `${operation} - ${status}`;
  
  switch (status) {
    case 'start':
      logger.info(message, { operation, status, ...context });
      break;
    case 'success':
      logger.info(message, { operation, status, ...context });
      break;
    case 'error':
      logger.error(message, { operation, status, ...context });
      break;
  }
}

// Export helper for HTTP request logging
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) {
  logger.http(`${method} ${url} ${statusCode} - ${duration}ms`, {
    method,
    url,
    statusCode,
    duration,
    ...context,
  });
}

