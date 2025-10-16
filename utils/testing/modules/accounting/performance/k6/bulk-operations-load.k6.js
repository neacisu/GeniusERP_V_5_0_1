/**
 * k6 Performance Test - Bulk Operations Load Testing
 * Tests bulk invoice creation and payment processing under load
 * 
 * Run: k6 run bulk-operations-load.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const bulkInvoiceErrorRate = new Rate('bulk_invoice_errors');
const bulkPaymentErrorRate = new Rate('bulk_payment_errors');
const jobCompletionTime = new Trend('job_completion_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 VUs over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 VUs for 5 minutes
    { duration: '2m', target: 20 },   // Ramp up to 20 VUs
    { duration: '5m', target: 20 },   // Stay at 20 VUs for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],           // 95% of requests < 5s
    bulk_invoice_errors: ['rate<0.05'],          // Error rate < 5%
    bulk_payment_errors: ['rate<0.05'],          // Error rate < 5%
    job_completion_time: ['p(95)<30000'],        // 95% complete < 30s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';
const COMPANY_ID = __ENV.COMPANY_ID || 'test-company';

function generateBulkInvoices(count) {
  const invoices = [];
  for (let i = 0; i < count; i++) {
    invoices.push({
      invoiceNumber: `LOAD-${Date.now()}-${i}`,
      customerId: `customer-${i % 10}`,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          description: `Product ${i}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: Math.floor(Math.random() * 1000) + 100,
          vatRate: 19
        }
      ]
    });
  }
  return invoices;
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };

  // Test 1: Bulk Invoice Creation (10 invoices)
  const bulkInvoices = generateBulkInvoices(10);
  const bulkInvoicePayload = JSON.stringify({
    companyId: COMPANY_ID,
    invoices: bulkInvoices
  });

  const bulkInvoiceResponse = http.post(
    `${BASE_URL}/api/accounting/bulk/invoices`,
    bulkInvoicePayload,
    { headers }
  );

  const bulkInvoiceSuccess = check(bulkInvoiceResponse, {
    'bulk invoice creation status 202': (r) => r.status === 202,
    'bulk invoice returns job ID': (r) => JSON.parse(r.body).jobId !== undefined,
  });

  bulkInvoiceErrorRate.add(!bulkInvoiceSuccess);

  if (bulkInvoiceSuccess) {
    const jobId = JSON.parse(bulkInvoiceResponse.body).jobId;
    
    // Poll for job completion
    let jobComplete = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    const startTime = Date.now();

    while (!jobComplete && attempts < maxAttempts) {
      sleep(1);
      attempts++;

      const statusResponse = http.get(
        `${BASE_URL}/api/accounting/bulk/jobs/${jobId}/status`,
        { headers }
      );

      if (statusResponse.status === 200) {
        const jobStatus = JSON.parse(statusResponse.body);
        
        check(jobStatus, {
          'job has progress': (j) => j.progress !== undefined,
          'job has status': (j) => j.status !== undefined,
        });

        if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
          jobComplete = true;
          const completionTime = Date.now() - startTime;
          jobCompletionTime.add(completionTime);

          check(jobStatus, {
            'job completed successfully': (j) => j.status === 'completed',
            'all invoices created': (j) => j.successCount === bulkInvoices.length,
          });
        }
      }
    }

    check(jobComplete, {
      'job completed within timeout': (complete) => complete === true,
    });
  }

  sleep(2);

  // Test 2: Bulk Payment Recording (5 payments)
  const bulkPayments = [];
  for (let i = 0; i < 5; i++) {
    bulkPayments.push({
      invoiceId: `invoice-${i}`,
      paymentAmount: Math.floor(Math.random() * 1000) + 100,
      paymentDate: new Date().toISOString(),
      paymentMethod: 'bank_transfer',
      bankAccountId: 'bank-1'
    });
  }

  const bulkPaymentPayload = JSON.stringify({
    companyId: COMPANY_ID,
    payments: bulkPayments
  });

  const bulkPaymentResponse = http.post(
    `${BASE_URL}/api/accounting/bulk/payments`,
    bulkPaymentPayload,
    { headers }
  );

  const bulkPaymentSuccess = check(bulkPaymentResponse, {
    'bulk payment recording status 202': (r) => r.status === 202,
    'bulk payment returns job ID': (r) => JSON.parse(r.body).jobId !== undefined,
  });

  bulkPaymentErrorRate.add(!bulkPaymentSuccess);

  sleep(2);

  // Test 3: Check Queue Metrics
  const metricsResponse = http.get(
    `${BASE_URL}/api/accounting/queue/metrics`,
    { headers }
  );

  check(metricsResponse, {
    'queue metrics status 200': (r) => r.status === 200,
    'queue has active jobs': (r) => {
      try {
        const metrics = JSON.parse(r.body);
        return metrics.active !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(3);
}

export function handleSummary(data) {
  return {
    'summary-bulk-operations.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  return `
k6 Bulk Operations Load Test Summary
=====================================

Duration: ${data.metrics.iteration_duration.values.avg}ms avg
Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

Bulk Invoice Error Rate: ${data.metrics.bulk_invoice_errors.values.rate * 100}%
Bulk Payment Error Rate: ${data.metrics.bulk_payment_errors.values.rate * 100}%

Job Completion Time:
  - Average: ${data.metrics.job_completion_time.values.avg}ms
  - p95: ${data.metrics.job_completion_time.values['p(95)']}ms
  - p99: ${data.metrics.job_completion_time.values['p(99)']}ms

HTTP Request Duration:
  - Average: ${data.metrics.http_req_duration.values.avg}ms
  - p95: ${data.metrics.http_req_duration.values['p(95)']}ms
  - p99: ${data.metrics.http_req_duration.values['p(99)']}ms
  `;
}

