/**
 * Romanian ERP - AuthGuard Implementation Test
 * 
 * This script tests the AuthGuard implementation to ensure it correctly
 * protects routes with JWT authentication and role-based access control.
 * It uses mock Express request, response, and next function objects
 * to simulate HTTP requests.
 * 
 * Features tested:
 * - Required authentication mode
 * - Optional authentication mode
 * - Role-based access control
 * - Company-based access control
 * - Error handling for missing or invalid tokens
 */

import { AuthGuard } from './server/modules/auth/guards/auth.guard';
import jwtService from './server/modules/auth/services/jwt.service';
import { JwtAuthMode, UserRole, JwtUserData } from './server/modules/auth/types';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock Express objects
interface MockResponse {
  statusCode?: number;
  jsonData?: any;
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
}

/**
 * Create a mock Express request object
 */
function createMockRequest(token?: string, params: Record<string, string> = {}): Request {
  const headers: Record<string, string> = {};
  
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  
  return {
    headers,
    params
  } as Request;
}

/**
 * Create a mock Express response object
 */
function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    jsonData: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.jsonData = data;
      return this;
    }
  };
  
  return res;
}

/**
 * Create a mock Express next function
 */
function createMockNext(): NextFunction & { called: boolean } {
  const next = () => {
    next.called = true;
  };
  next.called = false;
  
  return next as NextFunction & { called: boolean };
}

/**
 * Main test function for the AuthGuard
 */
async function testAuthGuard() {
  console.log('Romanian ERP - AuthGuard Implementation Test');
  console.log('===========================================');
  console.log('Testing AuthGuard implementation with JWT authentication...');
  
  try {
    // Create AuthGuard instance
    const authGuard = new AuthGuard(jwtService);
    
    // Generate test user data and token
    const testUserId = uuidv4();
    const testCompanyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Use actual company ID
    const testFranchiseId = uuidv4();
    
    const adminUserData: JwtUserData = {
      id: testUserId,
      username: 'admin.user',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      companyId: testCompanyId,
      franchiseId: testFranchiseId
    };
    
    const regularUserData: JwtUserData = {
      id: uuidv4(),
      username: 'regular.user',
      role: UserRole.USER,
      roles: [UserRole.USER],
      companyId: testCompanyId,
      franchiseId: testFranchiseId
    };
    
    const adminToken = jwtService.generateToken(adminUserData);
    const regularToken = jwtService.generateToken(regularUserData);
    const invalidToken = adminToken.slice(0, -5) + 'XXXXX'; // Corrupt the token
    
    console.log(`  ✓ Generated admin token: ${adminToken.slice(0, 25)}...`);
    console.log(`  ✓ Generated regular user token: ${regularToken.slice(0, 25)}...`);
    
    // Test 1: Required authentication - with valid token
    console.log('\n✓ Testing required authentication with valid token...');
    {
      const req = createMockRequest(adminToken);
      const res = createMockResponse();
      const next = createMockNext();
      
      // Execute middleware
      authGuard.protect(JwtAuthMode.REQUIRED)(req, res as unknown as Response, next);
      
      if (!next.called) {
        throw new Error('Next function should be called with valid token');
      }
      
      console.log('  ✓ Required authentication passed with valid token');
      console.log(`  ✓ User data attached to request: ${(req as any).user?.username}`);
    }
    
    // Test 2: Required authentication - without token
    console.log('\n✓ Testing required authentication without token...');
    {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      // Execute middleware
      authGuard.protect(JwtAuthMode.REQUIRED)(req, res as unknown as Response, next);
      
      if (next.called) {
        throw new Error('Next function should not be called without token');
      }
      
      if (res.statusCode !== 401) {
        throw new Error(`Expected status code 401, got ${res.statusCode}`);
      }
      
      console.log('  ✓ Authentication required error returned (401)');
      console.log(`  ✓ Error message: ${res.jsonData?.message}`);
    }
    
    // Test 3: Required authentication - with invalid token
    console.log('\n✓ Testing required authentication with invalid token...');
    {
      const req = createMockRequest(invalidToken);
      const res = createMockResponse();
      const next = createMockNext();
      
      // Execute middleware
      authGuard.protect(JwtAuthMode.REQUIRED)(req, res as unknown as Response, next);
      
      if (next.called) {
        throw new Error('Next function should not be called with invalid token');
      }
      
      if (res.statusCode !== 401) {
        throw new Error(`Expected status code 401, got ${res.statusCode}`);
      }
      
      console.log('  ✓ Invalid token error returned (401)');
      console.log(`  ✓ Error message: ${res.jsonData?.message}`);
    }
    
    // Test 4: Optional authentication - with valid token
    console.log('\n✓ Testing optional authentication with valid token...');
    {
      const req = createMockRequest(adminToken);
      const res = createMockResponse();
      const next = createMockNext();
      
      // Execute middleware
      authGuard.protect(JwtAuthMode.OPTIONAL)(req, res as unknown as Response, next);
      
      if (!next.called) {
        throw new Error('Next function should be called with valid token in optional mode');
      }
      
      console.log('  ✓ Optional authentication passed with valid token');
      console.log(`  ✓ User data attached to request: ${(req as any).user?.username}`);
    }
    
    // Test 5: Optional authentication - without token
    console.log('\n✓ Testing optional authentication without token...');
    {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      // Execute middleware
      authGuard.protect(JwtAuthMode.OPTIONAL)(req, res as unknown as Response, next);
      
      if (!next.called) {
        throw new Error('Next function should be called without token in optional mode');
      }
      
      console.log('  ✓ Optional authentication passed without token');
    }
    
    // Test 6: Role guard - with admin role
    console.log('\n✓ Testing role guard with admin role...');
    {
      const req = createMockRequest(adminToken);
      const res = createMockResponse();
      const next = createMockNext();
      
      // First apply protect middleware to attach user
      authGuard.protect()(req, res as unknown as Response, () => {
        // Then apply role guard
        authGuard.roleGuard([UserRole.ADMIN])(req, res as unknown as Response, next);
      });
      
      if (!next.called) {
        throw new Error('Next function should be called for admin role');
      }
      
      console.log('  ✓ Role guard passed with admin role');
    }
    
    // Test 7: Role guard - with insufficient permissions
    console.log('\n✓ Testing role guard with insufficient permissions...');
    {
      const req = createMockRequest(regularToken);
      const res = createMockResponse();
      const next = createMockNext();
      
      // First apply protect middleware to attach user
      authGuard.protect()(req, res as unknown as Response, () => {
        // Then apply role guard requiring admin
        authGuard.roleGuard([UserRole.ADMIN])(req, res as unknown as Response, next);
      });
      
      if (next.called) {
        throw new Error('Next function should not be called with insufficient permissions');
      }
      
      if (res.statusCode !== 403) {
        throw new Error(`Expected status code 403, got ${res.statusCode}`);
      }
      
      console.log('  ✓ Insufficient permissions error returned (403)');
      console.log(`  ✓ Error message: ${res.jsonData?.message}`);
    }
    
    // Test 8: Company guard - with matching company
    console.log('\n✓ Testing company guard with matching company...');
    {
      const req = createMockRequest(regularToken, { companyId: testCompanyId });
      const res = createMockResponse();
      const next = createMockNext();
      
      // First apply protect middleware to attach user
      authGuard.protect()(req, res as unknown as Response, () => {
        // Then apply company guard
        authGuard.companyGuard()(req, res as unknown as Response, next);
      });
      
      if (!next.called) {
        throw new Error('Next function should be called with matching company');
      }
      
      console.log('  ✓ Company guard passed with matching company');
    }
    
    // Test 9: Company guard - with non-matching company
    console.log('\n✓ Testing company guard with non-matching company...');
    {
      const otherCompanyId = uuidv4();
      const req = createMockRequest(regularToken, { companyId: otherCompanyId });
      const res = createMockResponse();
      const next = createMockNext();
      
      // First apply protect middleware to attach user
      authGuard.protect()(req, res as unknown as Response, () => {
        // Then apply company guard
        authGuard.companyGuard()(req, res as unknown as Response, next);
      });
      
      if (next.called) {
        throw new Error('Next function should not be called with non-matching company');
      }
      
      if (res.statusCode !== 403) {
        throw new Error(`Expected status code 403, got ${res.statusCode}`);
      }
      
      console.log('  ✓ Company access error returned (403)');
      console.log(`  ✓ Error message: ${res.jsonData?.message}`);
    }
    
    // Test 10: Admin can access any company
    console.log('\n✓ Testing company guard with admin accessing any company...');
    {
      const otherCompanyId = uuidv4();
      const req = createMockRequest(adminToken, { companyId: otherCompanyId });
      const res = createMockResponse();
      const next = createMockNext();
      
      // First apply protect middleware to attach user
      authGuard.protect()(req, res as unknown as Response, () => {
        // Then apply company guard
        authGuard.companyGuard()(req, res as unknown as Response, next);
      });
      
      if (!next.called) {
        throw new Error('Next function should be called for admin accessing any company');
      }
      
      console.log('  ✓ Company guard passed with admin accessing any company');
    }
    
    console.log('\n✓ AuthGuard test completed successfully');
    console.log('===========================================');
  } catch (error) {
    console.error('\n❌ Test failed:', (error as Error).message);
    throw error;
  }
}

// Run the test
testAuthGuard()
  .then(() => console.log('Test execution completed.'))
  .catch(error => console.error('Test execution failed:', error))
  .finally(() => process.exit());