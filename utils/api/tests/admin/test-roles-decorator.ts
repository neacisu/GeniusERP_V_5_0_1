/**
 * Test Roles Decorator and RolesGuard
 * 
 * This script demonstrates how the @Roles decorator and RolesGuard work together
 * to protect endpoints with role-based access control.
 */

import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Reflector } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Roles } from './server/common/decorators';
import { RolesGuard } from './server/common/guards';
import { AuthGuard } from './server/common/middleware/auth-guard';
import { Logger } from './server/common/logger';

// Create a logger
const logger = new Logger('RolesDecoratorTest');

// Mock JWT secret
const JWT_SECRET = 'test_secret_key';

// Sample user roles
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  FINANCE = 'finance',
}

/**
 * Mock controller class to demonstrate the @Roles decorator
 */
class ExampleController {
  @Roles(UserRole.ADMIN)
  adminEndpoint() {
    return { message: 'Admin endpoint' };
  }

  @Roles(UserRole.MANAGER, UserRole.FINANCE)
  managerEndpoint() {
    return { message: 'Manager endpoint' };
  }

  @Roles(UserRole.USER, UserRole.MANAGER, UserRole.ADMIN)
  userEndpoint() {
    return { message: 'User endpoint' };
  }

  // No roles defined - should be accessible to all authenticated users
  publicEndpoint() {
    return { message: 'Public endpoint' };
  }
}

/**
 * Create JWT token for testing
 */
function createToken(username: string, roles: string[]): string {
  return jwt.sign(
    {
      id: '12345',
      username,
      email: `${username}@example.com`,
      role: roles[0], // Primary role
      roles: roles,   // All roles
      companyId: 'test-company'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create mock Express request
 */
function createMockRequest(token?: string): Request {
  const req: Partial<Request> = {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined
    },
    route: {
      path: '/test'
    }
  };
  return req as Request;
}

/**
 * Create mock Express response
 */
function createMockResponse(): any {
  const res: any = {
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
 * Create mock Next function
 */
function createMockNext(): any {
  const next = jest.fn();
  next.called = false;
  
  const mockNext = () => {
    mockNext.called = true;
  };
  mockNext.called = false;
  
  return mockNext;
}

/**
 * Test the Roles decorator and RolesGuard
 */
async function testRolesDecorator() {
  logger.info('Starting Roles Decorator and RolesGuard tests');
  
  // Set up our test objects
  const controller = new ExampleController();
  const reflector = new Reflector();
  const rolesGuard = new RolesGuard(reflector);
  
  // Store metadata on controller methods for testing
  const methodNames = Object.getOwnPropertyNames(ExampleController.prototype)
    .filter(name => name !== 'constructor');
  
  // Output the controller methods
  logger.info('Controller methods:');
  for (const methodName of methodNames) {
    const roles = Reflect.getMetadata('roles', controller[methodName]);
    logger.info(`  - ${methodName}: roles = ${roles ? JSON.stringify(roles) : 'none'}`);
  }
  
  // Test cases
  logger.info('\nRunning test cases...');
  
  // Test 1: Admin user accessing admin endpoint
  const adminToken = createToken('admin', [UserRole.ADMIN]);
  const adminReq = createMockRequest(adminToken);
  const adminRes = createMockResponse();
  const adminNext = createMockNext();
  
  // Apply auth guard first
  AuthGuard.requireAuth()(adminReq, adminRes, () => {
    // Then check the admin endpoint
    reflector.get = jest.fn().mockReturnValue([UserRole.ADMIN]);
    rolesGuard.canActivate(adminReq, adminRes, adminNext);
  });
  
  logger.info(`Test 1: Admin user accessing admin endpoint: ${adminNext.called ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Test 2: User accessing admin endpoint (should fail)
  const userToken = createToken('user', [UserRole.USER]);
  const userReq = createMockRequest(userToken);
  const userRes = createMockResponse();
  const userNext = createMockNext();
  
  // Apply auth guard first
  AuthGuard.requireAuth()(userReq, userRes, () => {
    // Then check the admin endpoint
    reflector.get = jest.fn().mockReturnValue([UserRole.ADMIN]);
    rolesGuard.canActivate(userReq, userRes, userNext);
  });
  
  logger.info(`Test 2: User accessing admin endpoint: ${!userNext.called && userRes.statusCode === 403 ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Test 3: Manager accessing manager endpoint
  const managerToken = createToken('manager', [UserRole.MANAGER]);
  const managerReq = createMockRequest(managerToken);
  const managerRes = createMockResponse();
  const managerNext = createMockNext();
  
  // Apply auth guard first
  AuthGuard.requireAuth()(managerReq, managerRes, () => {
    // Then check the manager endpoint
    reflector.get = jest.fn().mockReturnValue([UserRole.MANAGER, UserRole.FINANCE]);
    rolesGuard.canActivate(managerReq, managerRes, managerNext);
  });
  
  logger.info(`Test 3: Manager accessing manager endpoint: ${managerNext.called ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Test 4: User accessing endpoint with no roles (should pass)
  const publicReq = createMockRequest(userToken);
  const publicRes = createMockResponse();
  const publicNext = createMockNext();
  
  // Apply auth guard first
  AuthGuard.requireAuth()(publicReq, publicRes, () => {
    // Then check the endpoint with no roles
    reflector.get = jest.fn().mockReturnValue(undefined);
    rolesGuard.canActivate(publicReq, publicRes, publicNext);
  });
  
  logger.info(`Test 4: User accessing endpoint with no roles: ${publicNext.called ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Test 5: No token accessing protected endpoint (should fail)
  const noTokenReq = createMockRequest();
  const noTokenRes = createMockResponse();
  const noTokenNext = createMockNext();
  
  // Apply auth guard
  AuthGuard.requireAuth()(noTokenReq, noTokenRes, noTokenNext);
  
  logger.info(`Test 5: No token accessing protected endpoint: ${!noTokenNext.called && noTokenRes.statusCode === 401 ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  logger.info('\nRoles Decorator and RolesGuard tests completed');
}

// Run the tests
testRolesDecorator().catch(error => {
  logger.error('Error in tests:', error);
});