/**
 * API Routes Test
 * 
 * This script queries the server to check what routes are available and
 * provides information about middleware configuration.
 * 
 * It helps diagnose issues with API routing and middleware.
 */

import axios from 'axios';
import express from 'express';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  port: process.env.PORT || 5000,
  host: process.env.HOST || 'localhost',
};

/**
 * Send a request to test the API route
 */
async function testApiRoute(path) {
  const url = `http://${config.host}:${config.port}${path}`;
  console.log(`Testing route: ${url}`);
  
  try {
    const response = await axios.get(url, {
      validateStatus: () => true, // Accept any status code
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000,
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // Check if the response is HTML or JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('html')) {
      console.log('Response appears to be HTML (likely intercepted by Vite middleware)');
      console.log('First 100 chars of response:', response.data.substring(0, 100).replace(/\n/g, '\\n'));
    } else if (contentType.includes('json')) {
      console.log('Response is JSON (API working correctly)');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('Response has unknown content type');
      console.log('First 100 chars of response:', response.data.substring(0, 100).replace(/\n/g, '\\n'));
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    }
  }
  
  console.log('-'.repeat(50));
}

/**
 * Create a temporary express app to check route registration
 */
function checkExpressRouteRegistration() {
  console.log('\nSimulating Express route registration:');
  
  const app = express();
  
  // Register some test routes
  app.get('/api/test', (req, res) => res.json({ message: 'Test API' }));
  app.get('/api/admin/test', (req, res) => res.json({ message: 'Admin Test API' }));
  
  // Register a wildcard route at the end (like Vite middleware)
  app.use('*', (req, res) => res.send('Wildcard route (like Vite middleware)'));
  
  // Extract and print routes
  const routes = [];
  app._router.stack.forEach(middleware => {
    if(middleware.route){
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase(),
        type: 'Direct route'
      });
    } else if(middleware.name === 'router'){
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if(handler.route){
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods).join(', ').toUpperCase(),
            type: 'Router route'
          });
        }
      });
    } else {
      // Other middleware
      routes.push({
        path: middleware.regexp ? middleware.regexp.toString() : 'unknown',
        methods: 'MIDDLEWARE',
        type: middleware.name || 'Unknown middleware'
      });
    }
  });
  
  // Print routes in order of registration
  console.log('Routes registered (in order):');
  routes.forEach((route, i) => {
    console.log(`${i+1}. [${route.type}] ${route.methods} ${route.path}`);
  });
  
  console.log('\nNote: In Express, route order matters!');
  console.log('If a wildcard middleware (*) is registered before API routes,');
  console.log('or if API routes are not excluded from wildcard routes,');
  console.log('the API responses may be intercepted by the wildcard handler.');
  
  console.log('\nSolution:');
  console.log('1. Register API routes before any wildcard/catch-all middleware');
  console.log('2. Or modify the wildcard middleware to skip API routes:');
  console.log('   app.use("*", (req, res, next) => {');
  console.log('     if (req.path.startsWith("/api/")) return next();');
  console.log('     // Vite middleware code here');
  console.log('   });');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== API Routes Test ===');
  console.log(`Server: ${config.host}:${config.port}`);
  
  // Test some basic routes
  await testApiRoute('/');
  await testApiRoute('/api');
  await testApiRoute('/api/health');
  await testApiRoute('/api/admin/setup/steps/test-company');
  
  // Check express route registration
  checkExpressRouteRegistration();
  
  console.log('\n=== API Routes Test Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});