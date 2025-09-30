/**
 * Test script for Accounting Routes Structure
 * 
 * This script tests the route structure for the accounting module including
 * the specialized journal routes.
 */

import express from 'express';
import { setupAccountingRoutes } from './server/modules/accounting/routes/accounting.routes';
import { initializeServiceRegistry } from './server/common/services/registry.init';

/**
 * Function to verify the accounting routes structure
 */
function testAccountingRoutesStructure() {
  console.log('=== Testing Accounting Routes Structure ===');
  
  // Create a mock Express app
  const app = express();
  
  try {
    // Initialize the service registry
    initializeServiceRegistry();
    
    // Setup the accounting routes
    const accountingRouter = setupAccountingRoutes();
    
    // Count the routes
    const routes: string[] = [];
    function extractRoutes(router: any) {
      if (!router || !router.stack) return;
      
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          // This is a route
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods)
            .filter((method: string) => layer.route.methods[method])
            .join(', ');
          routes.push(`${methods.toUpperCase()} ${path}`);
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          // This is a sub-router
          const mountPath = layer.regexp.toString()
            .replace('\\/?(?=\\/|$)', '')
            .replace(/^\^\\\//, '/')
            .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
            .replace(/\\\//g, '/');
          
          const basePath = mountPath === '/' ? '' : mountPath.replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
          
          // Recurse into the sub-router
          extractRoutesFromSubRouter(layer.handle, basePath);
        }
      });
    }
    
    function extractRoutesFromSubRouter(router: any, basePath: string) {
      if (!router || !router.stack) return;
      
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = basePath + layer.route.path;
          const methods = Object.keys(layer.route.methods)
            .filter((method: string) => layer.route.methods[method])
            .join(', ');
          routes.push(`${methods.toUpperCase()} ${path}`);
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          // This is a nested sub-router
          let nestedMountPath = '';
          
          if (layer.regexp) {
            nestedMountPath = layer.regexp.toString()
              .replace('\\/?(?=\\/|$)', '')
              .replace(/^\^\\\//, '/')
              .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
              .replace(/\\\//g, '/');
            
            if (nestedMountPath !== '/') {
              nestedMountPath = nestedMountPath.replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
            } else {
              nestedMountPath = '';
            }
          }
          
          const newBasePath = basePath + nestedMountPath;
          extractRoutesFromSubRouter(layer.handle, newBasePath);
        }
      });
    }
    
    // Extract routes from the main router
    extractRoutes(accountingRouter);
    
    // Print the routes
    console.log('\n--- Accounting Routes Structure ---');
    console.log(`Found ${routes.length} routes:`);
    routes.forEach(route => console.log(`  ${route}`));
    
    // Group routes by their first path segment
    const routeGroups: { [key: string]: string[] } = {};
    routes.forEach(route => {
      const pathParts = route.split(' ')[1].split('/').filter(Boolean);
      const mainGroup = pathParts[0] || 'root';
      
      if (!routeGroups[mainGroup]) {
        routeGroups[mainGroup] = [];
      }
      
      routeGroups[mainGroup].push(route);
    });
    
    // Print routes by group
    console.log('\n--- Routes by Group ---');
    Object.keys(routeGroups).sort().forEach(group => {
      console.log(`\n${group} routes (${routeGroups[group].length}):`);
      routeGroups[group].forEach(route => console.log(`  ${route}`));
    });
    
    console.log('\n=== Accounting Routes Structure Testing Completed ===');
    
  } catch (error: any) {
    console.error('Test failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testAccountingRoutesStructure();