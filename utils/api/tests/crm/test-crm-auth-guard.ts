/**
 * Test CRM Module Auth Guard Implementation
 * 
 * This script verifies the standardized AuthGuard implementation in the CRM module
 * by checking the route structure and authentication middleware.
 */

import { Express } from 'express';
import { initCrmModule } from './server/modules/crm/init';
import { AuthGuard } from './server/modules/auth/guards/auth.guard';
import { JwtAuthMode } from './server/modules/auth/models/auth.enum';
import { UserRole } from './server/modules/auth/types';

// Mock Express app
const mockExpress = {
  _routes: [] as any[],
  get(path: string, ...handlers: any[]) {
    this._routes.push({ method: 'GET', path, handlers });
  },
  post(path: string, ...handlers: any[]) {
    this._routes.push({ method: 'POST', path, handlers });
  },
  put(path: string, ...handlers: any[]) {
    this._routes.push({ method: 'PUT', path, handlers });
  },
  delete(path: string, ...handlers: any[]) {
    this._routes.push({ method: 'DELETE', path, handlers });
  }
};

/**
 * Test function for the CRM auth guard implementation
 */
function testCrmAuthGuard() {
  console.log('🧪 Testing CRM AuthGuard Implementation');
  
  // Initialize the CRM module with our mock Express app
  initCrmModule(mockExpress as unknown as Express);
  
  console.log(`Found ${mockExpress._routes.length} registered routes.`);
  
  let authGuardProtectCount = 0;
  let authGuardRoleGuardCount = 0;
  
  // Check each route for authentication middleware
  mockExpress._routes.forEach(route => {
    const handlerNames = route.handlers.map((h: Function) => h.name).filter(Boolean);
    console.log(`${route.method} ${route.path}`);
    
      console.log(`  Total handlers: ${route.handlers.length}`);
    
    // Count protection middleware
    route.handlers.forEach((handler: Function) => {
      const str = handler.toString();
      
      if (str.includes('protect') || str.includes('JwtAuthMode')) {
        authGuardProtectCount++;
        console.log('    ✓ Using AuthGuard.protect');
      }
      
      if (str.includes('roleGuard') || str.includes('UserRole')) {
        authGuardRoleGuardCount++;
        console.log('    ✓ Using AuthGuard.roleGuard');
      }
    });
  });
  
  console.log(`\nAuthentication middleware usage:`);
  console.log(`- AuthGuard.protect: ${authGuardProtectCount} routes`);
  console.log(`- AuthGuard.roleGuard: ${authGuardRoleGuardCount} routes`);
  
  console.log('\n✅ CRM AuthGuard test completed');
}

// Run the test
testCrmAuthGuard();