import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

// Test configuration for 1000 requests in 1 second
export const options = {
  // Use constant arrival rate to send exactly 1000 requests in 1 second
  scenarios: {
    constant_arrival_rate: {
      executor: 'constant-arrival-rate',
      rate: 1000,                    // 1000 requests per second
      timeUnit: '1s',                // per 1 second
      duration: '1s',                // Run for exactly 1 second
      preAllocatedVUs: 1000,        // Pre-allocate 1000 VUs
      maxVUs: 2000,                  // Allow up to 2000 VUs if needed
    },
  },
  
  thresholds: {
    // 95% of login requests must complete below 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    
    // Error rate must be less than 1%
    http_req_failed: ['rate<0.01'],
    
    // Custom metrics
    errors: ['rate<0.01'],
    request_duration: ['p(95)<500'],
    
    // Exactly 1000 login requests in 1 second
    http_reqs: ['count>=1000'],
  },
  
  // Connection settings
  noConnectionReuse: false,
  userAgent: 'k6-load-test/1.0',
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const USER_EMAIL = __ENV.USER_EMAIL || 'user@stablecoin.com';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'User@123';

// Main test function - only authentication/login
export default function () {
  // Login request
  const loginPayload = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });
  
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'response has token': (r) => {
      try {
        const body = r.json();
        return body && body.token !== undefined;
      } catch {
        return false;
      }
    },
    'response has user data': (r) => {
      try {
        const body = r.json();
        return body && body.user !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!loginSuccess);
  requestDuration.add(loginRes.timings.duration);
}

// Setup function (runs once before all VUs)
export function setup() {
  console.log('🚀 Starting load test: 1000 login requests in 1 second');
  console.log(`📍 User Service URL: ${BASE_URL}`);
  console.log(`⏱️  Duration: 1 second`);
  console.log(`🎯 Target: 1000 login requests to /auth/login endpoint`);
  console.log(`🔐 Credentials: ${USER_EMAIL}`);
}

// Teardown function
export function teardown(data) {
  console.log('✅ Load test completed');
  console.log('📊 Check the summary above for results');
  console.log('🎯 Expected: 1000 login requests in 1 second');
}
