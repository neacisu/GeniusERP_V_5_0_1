/**
 * Sentry integration pentru raportarea erorilor din teste
 */

import * as Sentry from '@sentry/node';
import { TestResult, TestError, TestType, TestFramework } from './test-types';

const SENTRY_DSN = process.env.SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

let sentryInitialized = false;

/**
 * Inițializează Sentry pentru testare
 */
export function initializeSentryForTests() {
  if (sentryInitialized) {
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN nu este configurat - raportarea erorilor este dezactivată');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      
      integrations: [
        Sentry.httpIntegration(),
      ],

      beforeSend(event, hint) {
        // Adaugă tag pentru identificare teste
        event.tags = {
          ...event.tags,
          source: 'test-suite',
        };
        return event;
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry inițializat pentru raportarea erorilor de testare');
  } catch (error) {
    console.error('❌ Eroare la inițializarea Sentry:', error);
  }
}

/**
 * Clasa pentru raportarea erorilor în Sentry
 */
export class SentryReporter {
  private module: string;
  private testType: TestType;
  private framework: TestFramework;

  constructor(module: string, testType: TestType, framework: TestFramework) {
    this.module = module;
    this.testType = testType;
    this.framework = framework;
  }

  /**
   * Setează contextul pentru erori
   */
  private setContext(testId: string, testName: string, additionalContext?: Record<string, any>) {
    if (!sentryInitialized) return;

    Sentry.setTags({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
      test_id: testId,
    });

    Sentry.setContext('test', {
      id: testId,
      name: testName,
      module: this.module,
      type: this.testType,
      framework: this.framework,
      ...additionalContext,
    });
  }

  /**
   * Raportează eșuarea unui test
   */
  reportTestFailure(testResult: TestResult) {
    if (!sentryInitialized || !testResult.error) return;

    this.setContext(testResult.id, testResult.name, {
      duration: testResult.duration,
      status: testResult.status,
    });

    const error = new Error(testResult.error.message);
    error.stack = testResult.error.stack;

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        test_status: testResult.status,
      },
      extra: {
        testResult: {
          id: testResult.id,
          name: testResult.name,
          duration: testResult.duration,
          error: testResult.error,
          metadata: testResult.metadata,
        },
      },
    });
  }

  /**
   * Raportează timeout test
   */
  reportTimeout(testId: string, testName: string, timeoutMs: number) {
    if (!sentryInitialized) return;

    this.setContext(testId, testName, {
      timeout: timeoutMs,
    });

    Sentry.captureMessage(`Test timeout: ${testName}`, {
      level: 'warning',
      tags: {
        test_status: 'timeout',
      },
      extra: {
        testId,
        testName,
        timeoutMs,
      },
    });
  }

  /**
   * Raportează erori neașteptate în timpul execuției
   */
  reportUnexpectedError(error: Error, context?: Record<string, any>) {
    if (!sentryInitialized) return;

    Sentry.setContext('error_context', {
      module: this.module,
      testType: this.testType,
      framework: this.framework,
      ...context,
    });

    Sentry.captureException(error, {
      level: 'error',
      tags: {
        error_type: 'unexpected',
      },
    });
  }

  /**
   * Raportează erori critice în orchestrator
   */
  reportCriticalError(error: Error, context: Record<string, any>) {
    if (!sentryInitialized) return;

    Sentry.setContext('critical_error', {
      module: this.module,
      ...context,
    });

    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        error_type: 'critical',
        critical: 'true',
      },
    });
  }

  /**
   * Adaugă breadcrumb pentru tracking
   */
  addBreadcrumb(message: string, data?: Record<string, any>) {
    if (!sentryInitialized) return;

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: {
        module: this.module,
        testType: this.testType,
        framework: this.framework,
        ...data,
      },
    });
  }

  /**
   * Raportează sumar la finalul testelor
   */
  reportSummary(summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }) {
    if (!sentryInitialized) return;

    const failureRate = summary.total > 0 ? (summary.failed / summary.total) * 100 : 0;

    // Raportează doar dacă failure rate > 5%
    if (failureRate > 5) {
      Sentry.captureMessage(
        `Test suite failure rate ridicat: ${failureRate.toFixed(2)}% pentru ${this.module}`,
        {
          level: failureRate > 20 ? 'error' : 'warning',
          tags: {
            alert_type: 'high_failure_rate',
          },
          extra: {
            module: this.module,
            testType: this.testType,
            framework: this.framework,
            summary,
            failureRate,
          },
        }
      );
    }
  }

  /**
   * Flush toate evenimentele către Sentry
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!sentryInitialized) return true;

    try {
      await Sentry.flush(timeout);
      return true;
    } catch (error) {
      console.error('❌ Eroare la flush Sentry:', error);
      return false;
    }
  }
}

/**
 * Factory function pentru crearea de Sentry reporter
 */
export function createSentryReporter(
  module: string,
  testType: TestType,
  framework: TestFramework
): SentryReporter {
  return new SentryReporter(module, testType, framework);
}

/**
 * Capturează o excepție globală
 */
export function captureTestException(error: Error, tags?: Record<string, string>) {
  if (!sentryInitialized) return;

  Sentry.captureException(error, {
    tags: {
      ...tags,
      source: 'test-suite',
    },
  });
}

/**
 * Capturează un mesaj
 */
export function captureTestMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!sentryInitialized) return;

  Sentry.captureMessage(message, {
    level,
    tags: {
      source: 'test-suite',
    },
  });
}

