/**
 * Metrics collector pentru Prometheus - sistemul de testare GeniusERP
 */

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { TestMetrics, TestType, TestFramework } from './test-types';

// Creăm un registry separat pentru teste
export const testRegistry = new Registry();

// Colectăm metrics default (CPU, memory, etc.)
collectDefaultMetrics({ register: testRegistry, prefix: 'geniuserp_test_' });

/**
 * Counter pentru numărul total de teste
 */
export const testsTotal = new Counter({
  name: 'geniuserp_tests_total',
  help: 'Numărul total de teste executate',
  labelNames: ['module', 'test_type', 'framework', 'status'],
  registers: [testRegistry],
});

/**
 * Counter pentru teste passed
 */
export const testsPassed = new Counter({
  name: 'geniuserp_tests_passed_total',
  help: 'Numărul total de teste passed',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Counter pentru teste failed
 */
export const testsFailed = new Counter({
  name: 'geniuserp_tests_failed_total',
  help: 'Numărul total de teste failed',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Counter pentru teste skipped
 */
export const testsSkipped = new Counter({
  name: 'geniuserp_tests_skipped_total',
  help: 'Numărul total de teste skipped',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Counter pentru teste timeout
 */
export const testsTimeout = new Counter({
  name: 'geniuserp_tests_timeout_total',
  help: 'Numărul total de teste cu timeout',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Gauge pentru numărul de teste active
 */
export const activeTests = new Gauge({
  name: 'geniuserp_tests_active',
  help: 'Numărul de teste care rulează în momentul actual',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Histogram pentru durata testelor
 */
export const testDuration = new Histogram({
  name: 'geniuserp_test_duration_seconds',
  help: 'Durata execuției testelor în secunde',
  labelNames: ['module', 'test_type', 'framework', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300], // secunde
  registers: [testRegistry],
});

/**
 * Histogram pentru durata suite-urilor de teste
 */
export const suiteDuration = new Histogram({
  name: 'geniuserp_test_suite_duration_seconds',
  help: 'Durata execuției suite-urilor de teste în secunde',
  labelNames: ['module', 'test_type', 'framework'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600], // secunde
  registers: [testRegistry],
});

/**
 * Gauge pentru success rate
 */
export const successRate = new Gauge({
  name: 'geniuserp_tests_success_rate',
  help: 'Rata de succes a testelor (0-1)',
  labelNames: ['module', 'test_type', 'framework'],
  registers: [testRegistry],
});

/**
 * Gauge pentru utilizarea memoriei în timpul testelor
 */
export const memoryUsage = new Gauge({
  name: 'geniuserp_test_memory_usage_bytes',
  help: 'Utilizarea memoriei în timpul testelor',
  labelNames: ['module', 'test_type'],
  registers: [testRegistry],
});

/**
 * Counter pentru erori în timpul testelor
 */
export const testErrors = new Counter({
  name: 'geniuserp_test_errors_total',
  help: 'Numărul total de erori în timpul testelor',
  labelNames: ['module', 'test_type', 'framework', 'error_type'],
  registers: [testRegistry],
});

/**
 * Clasa pentru colectarea și raportarea metrics
 */
export class MetricsCollector {
  private module: string;
  private testType: TestType;
  private framework: TestFramework;

  constructor(module: string, testType: TestType, framework: TestFramework) {
    this.module = module;
    this.testType = testType;
    this.framework = framework;
  }

  /**
   * Înregistrează începerea unui test
   */
  testStart() {
    activeTests.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testsTotal.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
      status: 'running',
    });
  }

  /**
   * Înregistrează finalizarea cu succes a unui test
   */
  testPass(durationSeconds: number) {
    activeTests.dec({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testsPassed.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testDuration.observe(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
        status: 'passed',
      },
      durationSeconds
    );
  }

  /**
   * Înregistrează eșuarea unui test
   */
  testFail(durationSeconds: number, errorType?: string) {
    activeTests.dec({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testsFailed.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testDuration.observe(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
        status: 'failed',
      },
      durationSeconds
    );

    if (errorType) {
      testErrors.inc({
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
        error_type: errorType,
      });
    }
  }

  /**
   * Înregistrează skip test
   */
  testSkip() {
    testsSkipped.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });
  }

  /**
   * Înregistrează timeout test
   */
  testTimeout(durationSeconds: number) {
    activeTests.dec({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testsTimeout.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
    });

    testDuration.observe(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
        status: 'timeout',
      },
      durationSeconds
    );
  }

  /**
   * Înregistrează finalizarea unei suite
   */
  suiteEnd(durationSeconds: number, passedCount: number, totalCount: number) {
    suiteDuration.observe(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
      },
      durationSeconds
    );

    const rate = totalCount > 0 ? passedCount / totalCount : 0;
    successRate.set(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
      },
      rate
    );
  }

  /**
   * Înregistrează utilizarea memoriei
   */
  recordMemoryUsage() {
    const usage = process.memoryUsage();
    memoryUsage.set(
      {
        module: this.module,
        test_type: this.testType,
      },
      usage.heapUsed
    );
  }

  /**
   * Incrementează un counter generic
   */
  incrementCounter(name: string, value: number = 1) {
    testsTotal.inc({
      module: this.module,
      test_type: this.testType,
      framework: this.framework,
      status: name,
    }, value);
  }

  /**
   * Înregistrează o metrică generică
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    testDuration.observe(
      {
        module: this.module,
        test_type: this.testType,
        framework: this.framework,
        status: name,
        ...labels,
      },
      value
    );
  }

  /**
   * Raportează metrics-urile finale
   */
  async reportFinalMetrics(verbose: boolean = false) {
    this.recordMemoryUsage();
    // Returnează toate metrics-urile în format Prometheus
    const metrics = await getMetrics();
    if (verbose) {
      console.log('📊 Final Metrics:', metrics);
    }
    return metrics;
  }

  /**
   * Obține metrics-urile curente
   */
  async getMetrics(): Promise<string> {
    return await getMetrics();
  }
}

/**
 * Obține toate metrics-urile în format Prometheus
 */
export async function getMetrics(): Promise<string> {
  return testRegistry.metrics();
}

/**
 * Resetează toate metrics-urile
 */
export function resetMetrics() {
  testRegistry.resetMetrics();
}

/**
 * Creează un collector de metrics pentru un modul specific
 */
export function createMetricsCollector(
  module: string,
  testType: TestType,
  framework: TestFramework
): MetricsCollector {
  return new MetricsCollector(module, testType, framework);
}

/**
 * Instanță globală de metrics collector pentru utilizare în teste
 */
export const testMetrics = new MetricsCollector('test', 'unit', 'vitest');

