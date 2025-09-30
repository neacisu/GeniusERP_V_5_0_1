/**
 * Test Inventory Module Auth Guard Implementation
 * 
 * This script tests the route setup in the inventory module to check
 * that all routes are secured with the proper AuthGuard middleware
 */

import { Router } from 'express';
import { setupInventoryRoutes } from './server/modules/inventory/routes/inventory.routes';

/**
 * Test the inventory routes for AuthGuard usage
 */
function testInventoryAuthGuard() {
  console.log('🧪 Testing Inventory AuthGuard Implementation');

  try {
    // Get the router from the setup function
    const router = setupInventoryRoutes();
    
    // Print the router object
    console.log('Router object:', router);
    console.log('Router properties:', Object.keys(router));
    
    // Check the router middleware for global auth protection
    const middlewareCount = (router as any)._router?.stack?.length || 0;
    console.log(`Router has ${middlewareCount} middleware handlers`);
    
    // Search for auth middleware in the router stack
    let globalAuthCount = 0;
    let routeAuthCount = 0;
    let roleGuardCount = 0;
    
    const middlewareStack = (router as any)._router?.stack || [];
    
    // Check for global middleware (applies to all routes)
    middlewareStack.forEach((layer: any, index: number) => {
      if (!layer.route) {
        // This is middleware that applies to all routes
        const handlerStr = layer.handle.toString();
        if (handlerStr.includes('protect') || handlerStr.includes('JwtAuthMode')) {
          globalAuthCount++;
          console.log(`${index}: Global Auth middleware found: ${handlerStr.substring(0, 50)}...`);
        }
      } else {
        // This is a route-specific handler
        console.log(`\nRoute: ${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
        
        // Check each handler in the route
        layer.route.stack.forEach((handler: any) => {
          const handlerStr = handler.handle.toString();
          
          if (handlerStr.includes('protect') || handlerStr.includes('JwtAuthMode')) {
            routeAuthCount++;
            console.log(`  ✓ Using AuthGuard.protect`);
          }
          
          if (handlerStr.includes('roleGuard') || handlerStr.includes('UserRole')) {
            roleGuardCount++;
            console.log(`  ✓ Using AuthGuard.roleGuard`);
          }
        });
      }
    });
    
    console.log('\nSummary:');
    console.log(`- Global Auth middleware: ${globalAuthCount}`);
    console.log(`- Route-specific Auth middleware: ${routeAuthCount}`);
    console.log(`- Role Guard middleware: ${roleGuardCount}`);
    
    console.log('\n✅ Inventory AuthGuard test completed');
  } catch (error) {
    console.error('Error testing inventory auth guard:', error);
  }
}

// Run the test
testInventoryAuthGuard();