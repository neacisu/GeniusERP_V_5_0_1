/**
 * Helper functions și utilități pentru teste
 */

import { TestResult, TestSuite, TestSummary, TestType, TestFramework, TestStatus } from './test-types';
import * as crypto from 'crypto';

/**
 * Generează un ID unic pentru test
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generează un ID unic pentru suite
 */
export function generateSuiteId(): string {
  return `suite-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Calculează summary pentru o listă de teste
 */
export function calculateSummary(tests: TestResult[]): TestSummary {
  const total = tests.length;
  const passed = tests.filter((t) => t.status === 'passed').length;
  const failed = tests.filter((t) => t.status === 'failed').length;
  const skipped = tests.filter((t) => t.status === 'skipped').length;
  const timeout = tests.filter((t) => t.status === 'timeout').length;
  const successRate = total > 0 ? (passed / total) * 100 : 0;

  return {
    total,
    passed,
    failed,
    skipped,
    timeout,
    successRate,
  };
}

/**
 * Calculează durata totală pentru o listă de teste
 */
export function calculateTotalDuration(tests: TestResult[]): number {
  return tests.reduce((acc, test) => acc + test.duration, 0);
}

/**
 * Formatează durata în format human-readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

/**
 * Formatează timestamp în format human-readable
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Creează un progress bar text
 */
export function createProgressBar(current: number, total: number, width: number = 40): string {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const filled = Math.floor((width * current) / total);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${current}/${total} (${percentage.toFixed(1)}%)`;
}

/**
 * Calculează ETA (Estimated Time of Arrival)
 */
export function calculateETA(
  completed: number,
  total: number,
  elapsedMs: number
): { eta: number; etaFormatted: string } {
  if (completed === 0 || completed >= total) {
    return { eta: 0, etaFormatted: '0s' };
  }
  
  const avgTimePerTest = elapsedMs / completed;
  const remaining = total - completed;
  const eta = avgTimePerTest * remaining;
  
  return {
    eta,
    etaFormatted: formatDuration(eta),
  };
}

/**
 * Sortează teste după status (failed first, then passed, then skipped)
 */
export function sortTestsByStatus(tests: TestResult[]): TestResult[] {
  const statusOrder: Record<TestStatus, number> = {
    failed: 1,
    timeout: 2,
    passed: 3,
    skipped: 4,
    running: 5,
    pending: 6,
  };
  
  return [...tests].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

/**
 * Filtrează teste după criteriu
 */
export function filterTests(
  tests: TestResult[],
  filter: {
    status?: TestStatus[];
    module?: string[];
    type?: TestType[];
    framework?: TestFramework[];
  }
): TestResult[] {
  return tests.filter((test) => {
    if (filter.status && !filter.status.includes(test.status)) return false;
    if (filter.module && !filter.module.includes(test.module)) return false;
    if (filter.type && !filter.type.includes(test.type)) return false;
    if (filter.framework && !filter.framework.includes(test.framework)) return false;
    return true;
  });
}

/**
 * Grupează teste după modul
 */
export function groupTestsByModule(tests: TestResult[]): Map<string, TestResult[]> {
  const grouped = new Map<string, TestResult[]>();
  
  for (const test of tests) {
    if (!grouped.has(test.module)) {
      grouped.set(test.module, []);
    }
    grouped.get(test.module)!.push(test);
  }
  
  return grouped;
}

/**
 * Grupează teste după tip
 */
export function groupTestsByType(tests: TestResult[]): Map<TestType, TestResult[]> {
  const grouped = new Map<TestType, TestResult[]>();
  
  for (const test of tests) {
    if (!grouped.has(test.type)) {
      grouped.set(test.type, []);
    }
    grouped.get(test.type)!.push(test);
  }
  
  return grouped;
}

/**
 * Exportă rezultate în format JSON
 */
export function exportToJSON(suites: TestSuite[]): string {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      suites,
      summary: calculateSummary(suites.flatMap((s) => s.tests)),
    },
    null,
    2
  );
}

/**
 * Exportă rezultate în format HTML
 */
export function exportToHTML(suites: TestSuite[]): string {
  const allTests = suites.flatMap((s) => s.tests);
  const summary = calculateSummary(allTests);
  
  const statusColor = (status: TestStatus) => {
    switch (status) {
      case 'passed': return '#4caf50';
      case 'failed': return '#f44336';
      case 'skipped': return '#ff9800';
      case 'timeout': return '#9c27b0';
      default: return '#757575';
    }
  };
  
  let html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GeniusERP - Test Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; background: #fafafa; }
    .stat { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .suites { padding: 30px; }
    .suite { margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .suite-header { background: #f5f5f5; padding: 15px 20px; font-weight: bold; font-size: 18px; border-bottom: 1px solid #e0e0e0; }
    .test { padding: 15px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
    .test:last-child { border-bottom: none; }
    .test-name { flex: 1; }
    .test-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; color: white; }
    .test-duration { margin-left: 15px; color: #666; font-size: 14px; }
    .test-error { margin-top: 10px; padding: 10px; background: #ffebee; border-left: 3px solid #f44336; font-size: 13px; font-family: monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 GeniusERP Test Results</h1>
      <p>Generat la: ${formatTimestamp(new Date())}</p>
    </div>
    
    <div class="summary">
      <div class="stat">
        <div class="stat-value">${summary.total}</div>
        <div class="stat-label">Total Teste</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #4caf50">${summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #f44336">${summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #ff9800">${summary.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #9c27b0">${summary.timeout}</div>
        <div class="stat-label">Timeout</div>
      </div>
      <div class="stat">
        <div class="stat-value">${summary.successRate.toFixed(1)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
    </div>
    
    <div class="suites">`;
  
  for (const suite of suites) {
    html += `
      <div class="suite">
        <div class="suite-header">
          ${suite.module} - ${suite.type} (${suite.framework})
        </div>`;
    
    for (const test of suite.tests) {
      html += `
        <div class="test">
          <div class="test-name">
            ${test.name}
            ${test.error ? `<div class="test-error">${test.error.message}</div>` : ''}
          </div>
          <span class="test-status" style="background: ${statusColor(test.status)}">
            ${test.status}
          </span>
          <span class="test-duration">${formatDuration(test.duration)}</span>
        </div>`;
    }
    
    html += `
      </div>`;
  }
  
  html += `
    </div>
  </div>
</body>
</html>`;
  
  return html;
}

/**
 * Exportă rezultate în format XML (JUnit compatible)
 */
export function exportToXML(suites: TestSuite[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<testsuites>\n';
  
  for (const suite of suites) {
    const summary = calculateSummary(suite.tests);
    xml += `  <testsuite name="${suite.module}-${suite.type}" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${(suite.duration / 1000).toFixed(3)}">\n`;
    
    for (const test of suite.tests) {
      xml += `    <testcase name="${test.name}" classname="${test.module}.${test.type}" time="${(test.duration / 1000).toFixed(3)}">\n`;
      
      if (test.status === 'failed' && test.error) {
        xml += `      <failure message="${escapeXml(test.error.message)}">\n`;
        xml += `        ${escapeXml(test.error.stack || '')}\n`;
        xml += `      </failure>\n`;
      } else if (test.status === 'skipped') {
        xml += `      <skipped />\n`;
      }
      
      xml += `    </testcase>\n`;
    }
    
    xml += `  </testsuite>\n`;
  }
  
  xml += '</testsuites>';
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Retry mechanism pentru teste instabile
 */
export async function retryTest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await sleep(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper pentru teste
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

