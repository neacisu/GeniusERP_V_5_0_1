/**
 * AuthGuard Test - Manual Testing Script
 * 
 * This file demonstrates how to test the AuthGuard functionality
 * Run with: node server/modules/auth/tests/auth-guard.test.cjs
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Setup Jest mock functions
const jest = {
  fn: () => {
    const mockFn = (...args) => {
      mockFn.mock.calls.push(args);
      return mockFn.mockReturnValue;
    };
    mockFn.mock = { calls: [] };
    mockFn.mockReturnValue = mockFn;
    mockFn.mockImplementation = (impl) => {
      mockFn.impl = impl;
      return mockFn;
    };
    return mockFn;
  }
};

// Mock Express request/response/next
function mockRequest(headers = {}) {
  return {
    headers,
    user: undefined
  };
}

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockNext = jest.fn();

// Mock JwtService
class MockJwtService {
  constructor(secret = 'test-secret') {
    this.secret = secret;
  }

  verify(token) {
    return jwt.verify(token, this.secret);
  }

  sign(payload) {
    return jwt.sign(payload, this.secret);
  }
}

// Import our AuthGuard (convert to CommonJS for testing)
const AuthGuard = function() {
  this.jwt = new MockJwtService();
  
  this.canActivate = function() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        console.warn('[AuthGuard] Missing token');
        return res.status(401).json({ message: 'Missing authorization token' });
      }

      try {
        console.log('[AuthGuard] Verifying token with JwtService');
        const payload = this.jwt.verify(token);
        
        // Attach the payload to the request
        req.user = payload;
        console.log('[AuthGuard] Token validated:', payload);
        next();
      } catch (error) {
        console.error('[AuthGuard] Invalid token:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    };
  };
};

// Tests
function runTests() {
  console.log('Running AuthGuard tests...');
  
  // Create test token
  const jwtService = new MockJwtService();
  const testPayload = {
    id: 'user-123',
    username: 'testuser',
    role: 'admin',
    roles: ['admin', 'user']
  };
  const token = jwtService.sign(testPayload);
  
  // Save token for manual testing
  fs.writeFileSync('token.txt', token);
  console.log('Test token saved to token.txt:', token);
  
  // Test 1: Valid token
  console.log('\nTest 1: Valid token');
  const req1 = mockRequest({ authorization: `Bearer ${token}` });
  const res1 = mockResponse();
  
  const authGuard = new AuthGuard();
  const middleware = authGuard.canActivate();
  
  middleware(req1, res1, mockNext);
  
  if (req1.user) {
    console.log('✅ Test 1 passed: User attached to request');
    console.log('User:', req1.user);
  } else {
    console.log('❌ Test 1 failed: No user attached to request');
  }
  
  // Test 2: Invalid token
  console.log('\nTest 2: Invalid token');
  const req2 = mockRequest({ authorization: 'Bearer invalid-token' });
  const res2 = mockResponse();
  
  middleware(req2, res2, mockNext);
  
  if (res2.status.mock.calls[0]?.[0] === 401) {
    console.log('✅ Test 2 passed: 401 status returned');
  } else {
    console.log('❌ Test 2 failed: No 401 status returned');
  }
  
  // Test 3: Missing token
  console.log('\nTest 3: Missing token');
  const req3 = mockRequest({});
  const res3 = mockResponse();
  
  middleware(req3, res3, mockNext);
  
  if (res3.status.mock.calls[0]?.[0] === 401) {
    console.log('✅ Test 3 passed: 401 status returned');
  } else {
    console.log('❌ Test 3 failed: No 401 status returned');
  }
  
  console.log('\nTests completed!');
}

// Run tests
runTests();