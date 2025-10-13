/**
 * Logger integrat cu Winston + Loki pentru sistemul de testare
 */

import winston from 'winston';
import LokiTransport from 'winston-loki';
import { LogContext } from './test-types';

const LOKI_URL = process.env.LOKI_URL || 'http://localhost:3100';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Configurare Winston cu multiple transports
const createTestLogger = () => {
  const transports: winston.transport[] = [
    // Console transport cu formatare colorată
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `[${timestamp}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transport pentru toate log-urile
    new winston.transports.File({
      filename: '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/utils/testing/logs/test-all.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    // File transport pentru erori
    new winston.transports.File({
      filename: '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/utils/testing/logs/test-errors.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ];

  // Adaugă Loki transport dacă este disponibil
  try {
    transports.push(
      new LokiTransport({
        host: LOKI_URL,
        labels: {
          app: 'geniuserp-tests',
          environment: ENVIRONMENT,
        },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => {
          console.error('Loki connection error:', err);
        },
      })
    );
  } catch (error) {
    console.warn('Loki transport nu este disponibil:', error);
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports,
  });
};

const logger = createTestLogger();

/**
 * Logger cu context pentru teste
 */
export class TestLogger {
  private context: Partial<LogContext>;

  constructor(context: Partial<LogContext>) {
    this.context = {
      ...context,
      timestamp: new Date(),
    };
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: Record<string, any>) {
    const logData = {
      ...this.context,
      severity: level,
      message,
      metadata,
      timestamp: new Date(),
    };

    logger.log(level, message, logData);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
  }

  /**
   * Log pentru începerea unui test
   */
  testStart(testId: string, testName: string) {
    this.info(`🚀 Test început: ${testName}`, { testId, testName, event: 'test_start' });
  }

  /**
   * Log pentru finalizarea cu succes a unui test
   */
  testPass(testId: string, testName: string, duration: number) {
    this.info(`✅ Test passed: ${testName} (${duration}ms)`, {
      testId,
      testName,
      duration,
      event: 'test_pass',
    });
  }

  /**
   * Log pentru eșuarea unui test
   */
  testFail(testId: string, testName: string, error: any, duration: number) {
    this.error(`❌ Test failed: ${testName} (${duration}ms)`, {
      testId,
      testName,
      duration,
      error: {
        message: error.message,
        stack: error.stack,
      },
      event: 'test_fail',
    });
  }

  /**
   * Log pentru skip test
   */
  testSkip(testId: string, testName: string, reason?: string) {
    this.warn(`⏩ Test skipped: ${testName}`, {
      testId,
      testName,
      reason,
      event: 'test_skip',
    });
  }

  /**
   * Log pentru timeout test
   */
  testTimeout(testId: string, testName: string, timeoutMs: number) {
    this.error(`⏱️ Test timeout: ${testName} (${timeoutMs}ms)`, {
      testId,
      testName,
      timeoutMs,
      event: 'test_timeout',
    });
  }

  /**
   * Log pentru începerea unei suite de teste
   */
  suiteStart(suiteId: string, suiteName: string, testCount: number) {
    this.info(`📦 Suite început: ${suiteName} (${testCount} teste)`, {
      suiteId,
      suiteName,
      testCount,
      event: 'suite_start',
    });
  }

  /**
   * Log pentru finalizarea unei suite de teste
   */
  suiteEnd(suiteId: string, suiteName: string, summary: any, duration: number) {
    this.info(`📦 Suite finalizat: ${suiteName} (${duration}ms)`, {
      suiteId,
      suiteName,
      summary,
      duration,
      event: 'suite_end',
    });
  }
}

/**
 * Factory function pentru crearea de logger-e cu context specific
 */
export function createModuleLogger(module: string, testType?: string) {
  return new TestLogger({
    module,
    testType: testType as any,
    correlationId: generateCorrelationId(),
  });
}

/**
 * Generare correlation ID unic
 */
function generateCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Instanță globală de test logger pentru utilizare în teste
 */
export const testLogger = new TestLogger({
  module: 'test',
  testType: 'unit' as any,
  framework: 'vitest' as any
});

export { logger };

