/**
 * k6 Performance Test - User Endpoints
 * 
 * Testează performanța endpoint-urilor de utilizatori:
 * - GET /api/admin/users (list)
 * - POST /api/admin/users (create)
 * - GET /api/admin/users/:id (get one)
 * - PATCH /api/admin/users/:id (update)
 * - DELETE /api/admin/users/:id (delete)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const getUserTrend = new Trend('get_user_duration');
const createUserTrend = new Trend('create_user_duration');
const listUsersTrend = new Trend('list_users_duration');
const successCounter = new Counter('success_requests');
const failureCounter = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp-up la 50 VUs
    { duration: '1m', target: 100 },   // Ramp-up la 100 VUs
    { duration: '2m', target: 100 },   // Menținem 100 VUs
    { duration: '1m', target: 200 },   // Spike la 200 VUs
    { duration: '30s', target: 0 },    // Ramp-down la 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% sub 500ms, 99% sub 1s
    'errors': ['rate<0.01'],  // Error rate sub 1%
    'get_user_duration': ['p(95)<300'],
    'create_user_duration': ['p(95)<800'],
    'list_users_duration': ['p(95)<600'],
  },
};

const BASE_URL = __ENV.TEST_API_URL || 'http://localhost:5000';
let adminToken = '';

// Setup: obține token admin
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: __ENV.TEST_ADMIN_EMAIL || 'admin@test.local',
    password: __ENV.TEST_ADMIN_PASSWORD || 'TestAdmin123!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('data.token') !== undefined,
  });

  return {
    token: loginRes.json('data.token'),
    companyId: loginRes.json('data.user.company_id')
  };
}

export default function (data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  // Test 1: List Users
  group('List Users', () => {
    const start = Date.now();
    
    const listRes = http.get(
      `${BASE_URL}/api/admin/users?page=1&limit=20`,
      params
    );

    const duration = Date.now() - start;
    listUsersTrend.add(duration);

    const success = check(listRes, {
      'status is 200': (r) => r.status === 200,
      'has users data': (r) => r.json('data') !== undefined,
      'has pagination': (r) => r.json('pagination') !== undefined,
      'response time < 600ms': (r) => r.timings.duration < 600,
    });

    if (success) {
      successCounter.add(1);
    } else {
      failureCounter.add(1);
      errorRate.add(1);
      console.error(`List users failed: ${listRes.status}`);
    }
  });

  sleep(0.5); // Pauză între request-uri

  // Test 2: Create User
  group('Create User', () => {
    const uniqueEmail = `user${__VU}_${Date.now()}@test.local`;
    const start = Date.now();
    
    const createRes = http.post(
      `${BASE_URL}/api/admin/users`,
      JSON.stringify({
        email: uniqueEmail,
        password: 'SecurePass123!',
        firstName: `User${__VU}`,
        lastName: 'Test',
        companyId: data.companyId
      }),
      params
    );

    const duration = Date.now() - start;
    createUserTrend.add(duration);

    const success = check(createRes, {
      'status is 201': (r) => r.status === 201,
      'user created': (r) => r.json('data.id') !== undefined,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });

    if (success) {
      successCounter.add(1);
      
      const userId = createRes.json('data.id');
      data.lastUserId = userId; // Salvăm pentru alte teste
    } else {
      failureCounter.add(1);
      errorRate.add(1);
      console.error(`Create user failed: ${createRes.status}`);
    }
  });

  sleep(0.3);

  // Test 3: Get User by ID
  if (data.lastUserId) {
    group('Get User by ID', () => {
      const start = Date.now();
      
      const getRes = http.get(
        `${BASE_URL}/api/admin/users/${data.lastUserId}`,
        params
      );

      const duration = Date.now() - start;
      getUserTrend.add(duration);

      const success = check(getRes, {
        'status is 200': (r) => r.status === 200,
        'user data exists': (r) => r.json('data.id') !== undefined,
        'response time < 300ms': (r) => r.timings.duration < 300,
      });

      if (success) {
        successCounter.add(1);
      } else {
        failureCounter.add(1);
        errorRate.add(1);
      }
    });
  }

  sleep(0.5);

  // Test 4: Update User
  if (data.lastUserId) {
    group('Update User', () => {
      const updateRes = http.patch(
        `${BASE_URL}/api/admin/users/${data.lastUserId}`,
        JSON.stringify({
          firstName: `UpdatedUser${__VU}`,
          lastName: 'Updated'
        }),
        params
      );

      const success = check(updateRes, {
        'status is 200': (r) => r.status === 200,
        'user updated': (r) => r.json('data') !== undefined,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });

      if (success) {
        successCounter.add(1);
      } else {
        failureCounter.add(1);
        errorRate.add(1);
      }
    });
  }

  sleep(0.3);

  // Test 5: Delete User (doar ocazional pentru a nu umple DB-ul)
  if (data.lastUserId && Math.random() < 0.3) {
    group('Delete User', () => {
      const deleteRes = http.del(
        `${BASE_URL}/api/admin/users/${data.lastUserId}`,
        null,
        params
      );

      const success = check(deleteRes, {
        'status is 200': (r) => r.status === 200,
        'response time < 400ms': (r) => r.timings.duration < 400,
      });

      if (success) {
        successCounter.add(1);
      } else {
        failureCounter.add(1);
        errorRate.add(1);
      }
    });
  }

  sleep(1); // Pauză între iterații
}

// Teardown: cleanup
export function teardown(data) {
  console.log('✅ k6 performance test completed');
  console.log(`Total successful requests: ${successCounter.value}`);
  console.log(`Total failed requests: ${failureCounter.value}`);
}

// Gestionare erori
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

function textSummary(data, options) {
  return `
📊 k6 Performance Test Summary - User Endpoints
==================================================

⏱️  Duration: ${data.metrics.checks.values.passes || 0} / ${data.metrics.checks.values.fails || 0} checks passed

📈 HTTP Request Metrics:
   - Total Requests: ${data.metrics.http_reqs.values.count}
   - Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s
   - Failed Requests: ${data.metrics.http_req_failed.values.passes || 0}

⚡ Response Time:
   - Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
   - P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
   - P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
   - Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

🎯 Custom Metrics:
   - Get User P95: ${(data.metrics.get_user_duration?.values['p(95)'] || 0).toFixed(2)}ms
   - Create User P95: ${(data.metrics.create_user_duration?.values['p(95)'] || 0).toFixed(2)}ms
   - List Users P95: ${(data.metrics.list_users_duration?.values['p(95)'] || 0).toFixed(2)}ms

✅ Success: ${data.metrics.success_requests?.values.count || 0}
❌ Failures: ${data.metrics.failed_requests?.values.count || 0}
📉 Error Rate: ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%
`;
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #7d64ff; }
    .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #7d64ff; }
    .metric-label { font-weight: bold; color: #333; }
    .metric-value { color: #7d64ff; font-size: 1.2em; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 k6 Performance Test Report</h1>
    <h2>User Endpoints</h2>
    
    <div class="metric">
      <span class="metric-label">Total Requests:</span>
      <span class="metric-value">${data.metrics.http_reqs.values.count}</span>
    </div>
    
    <div class="metric">
      <span class="metric-label">Request Rate:</span>
      <span class="metric-value">${data.metrics.http_reqs.values.rate.toFixed(2)} req/s</span>
    </div>
    
    <div class="metric">
      <span class="metric-label">Average Response Time:</span>
      <span class="metric-value ${data.metrics.http_req_duration.values.avg < 500 ? 'success' : 'warning'}">
        ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
      </span>
    </div>
    
    <div class="metric">
      <span class="metric-label">P95 Response Time:</span>
      <span class="metric-value ${data.metrics.http_req_duration.values['p(95)'] < 500 ? 'success' : 'error'}">
        ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
      </span>
    </div>
    
    <div class="metric">
      <span class="metric-label">Error Rate:</span>
      <span class="metric-value ${(data.metrics.errors?.values.rate || 0) < 0.01 ? 'success' : 'error'}">
        ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%
      </span>
    </div>
  </div>
</body>
</html>
`;
}

