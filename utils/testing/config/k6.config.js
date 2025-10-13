/**
 * Configurație k6 pentru stress testing GeniusERP
 * Rulare: k6 run k6.config.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Configuration
export const options = {
  // Stages pentru stress testing
  stages: [
    { duration: '1m', target: 10 },    // Warm-up: 10 utilizatori
    { duration: '2m', target: 50 },    // Ramp-up la 50 utilizatori
    { duration: '5m', target: 100 },   // Ramp-up la 100 utilizatori
    { duration: '5m', target: 200 },   // Ramp-up la 200 utilizatori (stress)
    { duration: '3m', target: 500 },   // Spike la 500 utilizatori
    { duration: '2m', target: 100 },   // Recovery la 100 utilizatori
    { duration: '2m', target: 0 },     // Cool-down
  ],
  
  // Thresholds
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% sub 500ms, 99% sub 1000ms
    'http_req_failed': ['rate<0.05'],                  // Error rate < 5%
    'errors': ['rate<0.05'],                           // Custom error rate < 5%
  },
  
  // Opțiuni
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_PREFIX = '/api';

// Setup function - rulează o dată per VU la început
export function setup() {
  console.log('🚀 K6 Test Setup');
  return {
    startTime: Date.now(),
  };
}

// Main test function
export default function(data) {
  // Health check
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'health check status 200': (r) => r.status === 200,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test authentication
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  });
  
  response = http.post(`${BASE_URL}${API_PREFIX}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(response, {
    'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!loginSuccess) {
    errorRate.add(1);
    failedRequests.add(1);
  } else {
    successfulRequests.add(1);
  }
  
  responseTime.add(response.timings.duration);
  
  sleep(1);
  
  // Test admin endpoints
  response = http.get(`${BASE_URL}${API_PREFIX}/admin/users`);
  check(response, {
    'admin users status valid': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test inventory endpoints
  response = http.get(`${BASE_URL}${API_PREFIX}/inventory/products`);
  check(response, {
    'inventory products status valid': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test accounting endpoints
  response = http.get(`${BASE_URL}${API_PREFIX}/accounting/journal`);
  check(response, {
    'accounting journal status valid': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);
  
  sleep(Math.random() * 3 + 1); // Random sleep între 1-4 secunde
}

// Teardown function - rulează o dată la sfârșit
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ K6 Test Complete - Duration: ${duration}s`);
}

