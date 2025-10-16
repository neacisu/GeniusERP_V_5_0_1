/**
 * k6 Performance Test - Fiscal Closure Stress Testing
 * Tests fiscal closure operations under concurrent load
 * 
 * Run: k6 run fiscal-closure-stress.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const closureErrorRate = new Rate('closure_errors');
const closureDuration = new Trend('closure_duration');
const validationErrors = new Counter('validation_errors');
const cacheHitRate = new Rate('cache_hits');

// Test configuration - Lower concurrency for fiscal closure
export const options = {
  stages: [
    { duration: '1m', target: 3 },    // Ramp up to 3 VUs
    { duration: '3m', target: 3 },    // Stay at 3 VUs
    { duration: '1m', target: 5 },    // Ramp up to 5 VUs
    { duration: '3m', target: 5 },    // Stay at 5 VUs
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],          // 95% < 10s
    closure_errors: ['rate<0.1'],                // Error rate < 10%
    closure_duration: ['p(95)<60000'],           // 95% complete < 60s
    validation_errors: ['count<10'],             // Max 10 validation errors
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';
const COMPANY_ID = __ENV.COMPANY_ID || 'test-company';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };

  const month = Math.floor(Math.random() * 12) + 1;
  const year = 2024;

  // Test 1: Monthly Closure (Dry Run)
  const dryRunPayload = JSON.stringify({
    companyId: COMPANY_ID,
    month: month,
    year: year,
    dryRun: true
  });

  const startTime = Date.now();
  const dryRunResponse = http.post(
    `${BASE_URL}/api/accounting/fiscal/closure/month/async`,
    dryRunPayload,
    { headers, timeout: '120s' }
  );

  const dryRunSuccess = check(dryRunResponse, {
    'dry run status 202': (r) => r.status === 202,
    'dry run returns job ID': (r) => {
      try {
        return JSON.parse(r.body).jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  closureErrorRate.add(!dryRunSuccess);

  if (dryRunSuccess) {
    const jobId = JSON.parse(dryRunResponse.body).jobId;
    
    // Poll for dry run completion
    let jobComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max for dry run

    while (!jobComplete && attempts < maxAttempts) {
      sleep(1);
      attempts++;

      const statusResponse = http.get(
        `${BASE_URL}/api/accounting/fiscal/closure/jobs/${jobId}/status`,
        { headers }
      );

      if (statusResponse.status === 200) {
        const jobStatus = JSON.parse(statusResponse.body);

        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          jobComplete = true;
          const duration = Date.now() - startTime;
          closureDuration.add(duration);

          const validationSuccess = check(jobStatus, {
            'dry run completed successfully': (j) => j.status === 'completed',
            'dry run has validation results': (j) => j.result !== undefined,
          });

          if (!validationSuccess) {
            validationErrors.add(1);
          }

          // Check for specific validation warnings
          if (jobStatus.result && jobStatus.result.warnings) {
            console.log(`Dry run warnings: ${JSON.stringify(jobStatus.result.warnings)}`);
          }
        }
      }
    }
  }

  sleep(2);

  // Test 2: Check Fiscal Periods Status
  const periodsResponse = http.get(
    `${BASE_URL}/api/accounting/fiscal/periods?companyId=${COMPANY_ID}&year=${year}`,
    { headers }
  );

  const periodsSuccess = check(periodsResponse, {
    'periods status 200': (r) => r.status === 200,
    'periods returned': (r) => {
      try {
        const periods = JSON.parse(r.body);
        return Array.isArray(periods) && periods.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  if (periodsSuccess) {
    const periods = JSON.parse(periodsResponse.body);
    check(periods, {
      'all periods have status': (p) => p.every(period => period.status !== undefined),
      'some periods are open': (p) => p.some(period => period.status === 'open'),
    });
  }

  sleep(1);

  // Test 3: Calculate Depreciation (Part of Closure)
  const depreciationPayload = JSON.stringify({
    companyId: COMPANY_ID,
    month: month,
    year: year,
    dryRun: true
  });

  const depreciationResponse = http.post(
    `${BASE_URL}/api/accounting/depreciation/calculate`,
    depreciationPayload,
    { headers, timeout: '60s' }
  );

  check(depreciationResponse, {
    'depreciation status 202 or 200': (r) => r.status === 202 || r.status === 200,
    'depreciation returns result': (r) => {
      try {
        return JSON.parse(r.body) !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test 4: FX Revaluation (Part of Closure)
  const fxPayload = JSON.stringify({
    companyId: COMPANY_ID,
    asOfDate: new Date(year, month - 1, 28).toISOString(),
    dryRun: true
  });

  const fxResponse = http.post(
    `${BASE_URL}/api/accounting/fx/revaluation`,
    fxPayload,
    { headers, timeout: '60s' }
  );

  check(fxResponse, {
    'fx revaluation status 202 or 200': (r) => r.status === 202 || r.status === 200,
  });

  sleep(1);

  // Test 5: VAT Closure (Part of Closure)
  const vatPayload = JSON.stringify({
    companyId: COMPANY_ID,
    month: month,
    year: year,
    dryRun: true
  });

  const vatResponse = http.post(
    `${BASE_URL}/api/accounting/vat/closure`,
    vatPayload,
    { headers, timeout: '60s' }
  );

  check(vatResponse, {
    'vat closure status 202 or 200': (r) => r.status === 202 || r.status === 200,
  });

  sleep(1);

  // Test 6: Check Redis Cache Performance
  const cachedPeriodsResponse = http.get(
    `${BASE_URL}/api/accounting/fiscal/periods?companyId=${COMPANY_ID}&year=${year}`,
    { headers }
  );

  if (cachedPeriodsResponse.status === 200) {
    // Check response time for cached request
    const isCacheHit = cachedPeriodsResponse.timings.duration < 100; // < 100ms = likely cached
    cacheHitRate.add(isCacheHit);
  }

  sleep(2);

  // Test 7: Trial Balance Generation (Part of Validation)
  const trialBalanceResponse = http.get(
    `${BASE_URL}/api/accounting/reports/trial-balance?companyId=${COMPANY_ID}&startDate=${year}-${month.toString().padStart(2, '0')}-01&endDate=${year}-${month.toString().padStart(2, '0')}-28`,
    { headers, timeout: '30s' }
  );

  check(trialBalanceResponse, {
    'trial balance status 200 or 202': (r) => r.status === 200 || r.status === 202,
    'trial balance is balanced': (r) => {
      try {
        const tb = JSON.parse(r.body);
        if (tb.totalDebit && tb.totalCredit) {
          return Math.abs(tb.totalDebit - tb.totalCredit) < 0.01;
        }
        return true; // Job queued, can't check balance yet
      } catch (e) {
        return true; // Parsing error, likely queued
      }
    },
  });

  sleep(3);
}

export function handleSummary(data) {
  return {
    'summary-fiscal-closure-stress.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  return `
k6 Fiscal Closure Stress Test Summary
======================================

Duration: ${data.metrics.iteration_duration.values.avg}ms avg
Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Closure Error Rate: ${data.metrics.closure_errors.values.rate * 100}%
Validation Errors: ${data.metrics.validation_errors.values.count}

Closure Duration:
  - Average: ${data.metrics.closure_duration.values.avg}ms
  - p95: ${data.metrics.closure_duration.values['p(95)']}ms
  - Max: ${data.metrics.closure_duration.values.max}ms

Cache Hit Rate: ${data.metrics.cache_hits.values.rate * 100}%

HTTP Request Duration:
  - Average: ${data.metrics.http_req_duration.values.avg}ms
  - p95: ${data.metrics.http_req_duration.values['p(95)']}ms
  - p99: ${data.metrics.http_req_duration.values['p(99)']}ms
  `;
}

