/**
 * Tipuri și interfețe comune pentru sistemul de testare GeniusERP
 */

export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'playwright' | 'cypress' | 'artillery' | 'k6' | 'jmeter';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'timeout';

export interface TestConfig {
  modules?: string[];
  types?: TestType[];
  frameworks?: TestFramework[];
  parallel?: number;
  verbose?: boolean;
  dashboard?: boolean;
  report?: ('json' | 'html' | 'xml')[];
  failFast?: boolean;
  retry?: number;
  timeout?: number;
}

export interface TestResult {
  id: string;
  module: string;
  type: TestType;
  framework: TestFramework;
  name: string;
  status: TestStatus;
  duration: number;
  startTime: Date;
  endTime?: Date;
  error?: TestError;
  metadata?: Record<string, unknown>;
}

export interface TestError {
  message: string;
  stack?: string;
  code?: string;
  details?: unknown;
}

export interface TestSuite {
  id: string;
  module: string;
  type: TestType;
  framework: TestFramework;
  tests: TestResult[];
  status: TestStatus;
  duration: number;
  startTime: Date;
  endTime?: Date;
  summary: TestSummary;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  timeout: number;
  successRate: number;
}

export interface ModuleTestStatus {
  module: string;
  suites: TestSuite[];
  summary: TestSummary;
  status: TestStatus;
  duration: number;
}

export interface OrchestratorStatus {
  startTime: Date;
  endTime?: Date;
  duration: number;
  modules: ModuleTestStatus[];
  overallSummary: TestSummary;
  config: TestConfig;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface TestMetrics {
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  testsTimeout: number;
  testDurationSeconds: number;
  activeTests: number;
  timestamp: Date;
  labels: {
    module: string;
    testType: TestType;
    framework: TestFramework;
  };
}

export interface LogContext {
  correlationId: string;
  module: string;
  testType: TestType;
  framework?: TestFramework;
  testId?: string;
  timestamp: Date;
  severity: 'debug' | 'info' | 'warn' | 'error';
  metadata?: Record<string, unknown>;
}

