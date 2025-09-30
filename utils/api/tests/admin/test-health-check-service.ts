/**
 * Test script for Health Check Service
 * 
 * This script tests the Health Check Service functionality including
 * health status retrieval, registering custom health checks, and API endpoints.
 */

import { getDrizzle } from './server/db';
import { HealthCheckService } from './server/modules/admin/services/health-check.service';
import { ConfigService } from './server/modules/admin/services/config.service';

// Simple mocked Express app for testing routes
const mockExpressApp = {
  use: (path: string, router: any) => {
    console.log(`Registered routes at path: ${path}`);
  }
};

// Function to test health check service features
async function testHealthCheckService() {
  try {
    console.log('Testing Health Check Service...');
    
    // Connect to the database
    const db = getDrizzle();
    
    // Initialize services
    const healthCheckService = new HealthCheckService(db);
    const configService = new ConfigService(db);
    healthCheckService.setConfigService(configService);
    
    // Test running health checks
    console.log('Running health checks...');
    const healthResult = await healthCheckService.runHealthChecks();
    console.log('Health check result:', JSON.stringify(healthResult, null, 2));
    
    // Test registering a custom health check
    console.log('Registering custom health check...');
    healthCheckService.registerHealthCheck({
      name: 'custom-service',
      type: 'EXTERNAL_API' as any,
      status: 'HEALTHY' as any,
      details: { version: '1.0.0' },
      lastChecked: new Date()
    });
    
    // Test running a specific health check
    console.log('Running specific health check...');
    const specificCheck = await healthCheckService.runHealthCheck('custom-service');
    console.log('Specific health check result:', JSON.stringify(specificCheck, null, 2));
    
    // Test registering routes
    console.log('Testing route registration...');
    healthCheckService.registerRoutes(mockExpressApp as any);
    
    console.log('Health Check Service tests completed successfully');
  } catch (error) {
    console.error('Error testing Health Check Service:', error);
  }
}

// Execute the test
testHealthCheckService();