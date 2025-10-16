/**
 * k6 Performance Test - Journal Exports Performance Testing
 * Tests various journal export operations under load
 * 
 * Run: k6 run journal-exports-performance.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const exportErrorRate = new Rate('export_errors');
const pdfGenerationTime = new Trend('pdf_generation_time');
const excelGenerationTime = new Trend('excel_generation_time');
const saftGenerationTime = new Trend('saft_generation_time');
const cacheHitRate = new Rate('export_cache_hits');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 VUs
    { duration: '4m', target: 5 },    // Stay at 5 VUs
    { duration: '1m', target: 10 },   // Ramp up to 10 VUs
    { duration: '4m', target: 10 },   // Stay at 10 VUs
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'],           // 95% < 8s
    export_errors: ['rate<0.05'],                // Error rate < 5%
    pdf_generation_time: ['p(95)<5000'],         // 95% < 5s
    excel_generation_time: ['p(95)<6000'],       // 95% < 6s
    saft_generation_time: ['p(95)<15000'],       // 95% < 15s
    export_cache_hits: ['rate>0.3'],             // Cache hit rate > 30%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';
const COMPANY_ID = __ENV.COMPANY_ID || 'test-company';

const EXPORT_TYPES = ['sales', 'purchase', 'general', 'bank', 'cash'];
const FORMATS = ['pdf', 'excel'];

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Accept': 'application/json'
  };

  const month = Math.floor(Math.random() * 12) + 1;
  const year = 2024;
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-28`;

  // Test 1: Sales Journal Export (PDF)
  const startPdf = Date.now();
  const salesPdfResponse = http.post(
    `${BASE_URL}/api/accounting/sales-journal/export/pdf/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate
    }),
    { headers, timeout: '30s' }
  );

  const salesPdfSuccess = check(salesPdfResponse, {
    'sales PDF status 202': (r) => r.status === 202,
    'sales PDF returns job ID': (r) => {
      try {
        return JSON.parse(r.body).jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  exportErrorRate.add(!salesPdfSuccess);

  if (salesPdfSuccess) {
    const jobId = JSON.parse(salesPdfResponse.body).jobId;
    const pdfDuration = Date.now() - startPdf;
    pdfGenerationTime.add(pdfDuration);

    // Check for cached result
    const cachedResponse = http.post(
      `${BASE_URL}/api/accounting/sales-journal/export/pdf/async`,
      JSON.stringify({
        companyId: COMPANY_ID,
        startDate,
        endDate
      }),
      { headers, timeout: '30s' }
    );

    if (cachedResponse.status === 200) {
      // Immediate response = cache hit
      cacheHitRate.add(true);
    } else {
      cacheHitRate.add(false);
    }
  }

  sleep(1);

  // Test 2: Purchase Journal Export (Excel)
  const startExcel = Date.now();
  const purchaseExcelResponse = http.post(
    `${BASE_URL}/api/accounting/purchase-journal/export/excel/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate
    }),
    { headers, timeout: '30s' }
  );

  const purchaseExcelSuccess = check(purchaseExcelResponse, {
    'purchase Excel status 202': (r) => r.status === 202,
    'purchase Excel returns job ID': (r) => {
      try {
        return JSON.parse(r.body).jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  exportErrorRate.add(!purchaseExcelSuccess);

  if (purchaseExcelSuccess) {
    const excelDuration = Date.now() - startExcel;
    excelGenerationTime.add(excelDuration);
  }

  sleep(1);

  // Test 3: General Journal Export (PDF)
  const generalPdfResponse = http.post(
    `${BASE_URL}/api/accounting/general-journal/export/pdf/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate,
      includeUnposted: false
    }),
    { headers, timeout: '30s' }
  );

  check(generalPdfResponse, {
    'general PDF status 202': (r) => r.status === 202,
  });

  sleep(1);

  // Test 4: Bank Statement Export
  const bankAccountId = 'bank-1';
  const bankStatementResponse = http.get(
    `${BASE_URL}/api/accounting/bank-journal/bank-accounts/${bankAccountId}/statement/cached?startDate=${startDate}&endDate=${endDate}`,
    { headers, timeout: '30s' }
  );

  check(bankStatementResponse, {
    'bank statement status 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  sleep(1);

  // Test 5: Cash Register Report Export
  const registerId = 'register-1';
  const cashReportResponse = http.get(
    `${BASE_URL}/api/accounting/cash-register/reports/daily/cached?registerId=${registerId}&date=${endDate}`,
    { headers, timeout: '30s' }
  );

  check(cashReportResponse, {
    'cash report status 200 or 202': (r) => r.status === 200 || r.status === 202,
  });

  sleep(1);

  // Test 6: SAF-T (D406) Export
  const startSaft = Date.now();
  const saftResponse = http.post(
    `${BASE_URL}/api/accounting/exports/saft`,
    JSON.stringify({
      companyId: COMPANY_ID,
      fiscalYear: year
    }),
    { headers, timeout: '60s' }
  );

  const saftSuccess = check(saftResponse, {
    'SAFT status 202 or 200': (r) => r.status === 202 || r.status === 200,
  });

  if (saftSuccess) {
    const saftDuration = Date.now() - startSaft;
    saftGenerationTime.add(saftDuration);
  }

  sleep(1);

  // Test 7: VAT Declaration (D300) Export
  const vatResponse = http.get(
    `${BASE_URL}/api/accounting/vat/d300?companyId=${COMPANY_ID}&month=${month}&year=${year}`,
    { headers, timeout: '30s' }
  );

  check(vatResponse, {
    'VAT D300 status 200 or 202': (r) => r.status === 200 || r.status === 202,
    'VAT D300 has data': (r) => {
      try {
        const vat = JSON.parse(r.body);
        return vat.vatCollected !== undefined || vat.jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test 8: Financial Reports (Trial Balance)
  const trialBalanceResponse = http.post(
    `${BASE_URL}/api/accounting/reports/trial-balance/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate,
      format: 'pdf'
    }),
    { headers, timeout: '30s' }
  );

  check(trialBalanceResponse, {
    'trial balance status 202': (r) => r.status === 202,
  });

  sleep(1);

  // Test 9: Balance Sheet Export
  const balanceSheetResponse = http.post(
    `${BASE_URL}/api/accounting/reports/balance-sheet/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      asOfDate: endDate,
      format: 'excel'
    }),
    { headers, timeout: '30s' }
  );

  check(balanceSheetResponse, {
    'balance sheet status 202': (r) => r.status === 202,
  });

  sleep(1);

  // Test 10: Income Statement Export
  const incomeStatementResponse = http.post(
    `${BASE_URL}/api/accounting/reports/income-statement/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate,
      format: 'pdf'
    }),
    { headers, timeout: '30s' }
  });

  check(incomeStatementResponse, {
    'income statement status 202': (r) => r.status === 202,
  });

  sleep(2);

  // Test 11: Check Queue Status
  const queueMetricsResponse = http.get(
    `${BASE_URL}/api/accounting/queue/metrics`,
    { headers }
  );

  check(queueMetricsResponse, {
    'queue metrics status 200': (r) => r.status === 200,
    'queue is healthy': (r) => {
      try {
        const metrics = JSON.parse(r.body);
        return metrics.active !== undefined && metrics.waiting !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test 12: Random Export (Simulating Real Usage)
  const randomType = EXPORT_TYPES[Math.floor(Math.random() * EXPORT_TYPES.length)];
  const randomFormat = FORMATS[Math.floor(Math.random() * FORMATS.length)];

  const randomExportResponse = http.post(
    `${BASE_URL}/api/accounting/${randomType}-journal/export/${randomFormat}/async`,
    JSON.stringify({
      companyId: COMPANY_ID,
      startDate,
      endDate
    }),
    { headers, timeout: '30s' }
  );

  check(randomExportResponse, {
    'random export status 202 or 404': (r) => r.status === 202 || r.status === 404, // 404 if route doesn't exist
  });

  sleep(3);
}

export function handleSummary(data) {
  return {
    'summary-journal-exports.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  return `
k6 Journal Exports Performance Test Summary
============================================

Duration: ${data.metrics.iteration_duration.values.avg}ms avg
Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Export Error Rate: ${data.metrics.export_errors.values.rate * 100}%
Cache Hit Rate: ${data.metrics.export_cache_hits.values.rate * 100}%

Generation Times:
  PDF:
    - Average: ${data.metrics.pdf_generation_time.values.avg}ms
    - p95: ${data.metrics.pdf_generation_time.values['p(95)']}ms
  
  Excel:
    - Average: ${data.metrics.excel_generation_time.values.avg}ms
    - p95: ${data.metrics.excel_generation_time.values['p(95)']}ms
  
  SAF-T:
    - Average: ${data.metrics.saft_generation_time.values.avg}ms
    - p95: ${data.metrics.saft_generation_time.values['p(95)']}ms

HTTP Request Duration:
  - Average: ${data.metrics.http_req_duration.values.avg}ms
  - p95: ${data.metrics.http_req_duration.values['p(95)']}ms
  - p99: ${data.metrics.http_req_duration.values['p(99)']}ms
  `;
}

