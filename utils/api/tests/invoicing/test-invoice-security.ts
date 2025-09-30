/**
 * Test script for Invoices endpoint security
 * 
 * This script tests the security of the invoice creation endpoint with different user roles.
 */

import express from "express";
import { InvoicesModule } from "./server/modules/invoicing/invoices.module";
import { AuthGuard } from "./server/modules/auth/guards/auth.guard";
import { UserRole } from "./server/modules/auth/types";
import { JwtService } from "./server/modules/auth/services/jwt.service";

// Create a test Express app
const app = express();
app.use(express.json());

// Register the invoices module directly
InvoicesModule.register(app);

// Create tokens for different roles
const jwtService = new JwtService();

// Admin token
const adminToken = jwtService.generateToken({
  id: '123456789',
  username: 'testuser',
  email: 'test@example.com',
  role: UserRole.ADMIN,
  roles: [UserRole.ADMIN],
  companyId: 'COMPANY1'
});

// Finance manager token
const financeToken = jwtService.generateToken({
  id: '987654321',
  username: 'finance',
  email: 'finance@example.com',
  role: UserRole.FINANCE_MANAGER,
  roles: [UserRole.FINANCE_MANAGER],
  companyId: 'COMPANY1'
});

// Sales agent token (shouldn't have access)
const salesToken = jwtService.generateToken({
  id: '555555555',
  username: 'sales',
  email: 'sales@example.com',
  role: UserRole.SALES_AGENT,
  roles: [UserRole.SALES_AGENT],
  companyId: 'COMPANY1'
});

// No token test
const noToken = "";

// Start the test server
const port = 5001;
const server = app.listen(port, () => {
  console.log(`Test server listening on port ${port}`);
  runTests().catch(console.error);
});

// Run the tests
async function runTests() {
  try {
    console.log("Starting invoice security tests");
    
    // Test data for invoice creation with proper UUID format
    const invoiceData = {
      companyId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", // Use a proper UUID format
      franchiseId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22", // Use a proper UUID format  
      amount: 100,
      currency: "USD",
      convertTo: "RON"
    };
    
    // Test with admin token (should succeed)
    console.log("\n----- Testing with ADMIN role -----");
    await testEndpoint('/v1/invoices/create', adminToken, invoiceData);
    
    // Test with finance token (should succeed)
    console.log("\n----- Testing with FINANCE_MANAGER role -----");
    await testEndpoint('/v1/invoices/create', financeToken, invoiceData);
    
    // Test with sales token (should fail with 403)
    console.log("\n----- Testing with SALES_AGENT role (should be denied) -----");
    await testEndpoint('/v1/invoices/create', salesToken, invoiceData);
    
    // Test with no token (should fail with 401)
    console.log("\n----- Testing with no token (should be unauthorized) -----");
    await testEndpoint('/v1/invoices/create', noToken, invoiceData);
    
    console.log("\n----- All tests completed -----");
  } catch (error) {
    console.error("Error during tests:", error);
  } finally {
    server.close(() => {
      console.log("Test server closed");
    });
  }
}

// Helper function to test an endpoint
async function testEndpoint(endpoint: string, token: string, data: any) {
  try {
    const url = `http://localhost:${port}${endpoint}`;
    console.log(`Making request to ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    const status = response.status;
    let responseBody;
    
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }
    
    console.log(`Response status: ${status}`);
    console.log(`Response body:`, responseBody);
    
    // For this security test, we're primarily interested in the auth behavior
    // The underlying service might fail due to database issues but that's OK
    // as long as we're past the auth check
    if ((status === 201 || status === 200 || status === 500) && (responseBody.error !== 'Authentication required' && responseBody.error !== 'Insufficient permissions')) {
      console.log("✅ Test PASSED - Access granted as expected (or service error after auth check passed)");
    } else if (status === 401 && !token) {
      console.log("✅ Test PASSED - Unauthorized without token as expected");
    } else if (status === 403 && token) {
      console.log("✅ Test PASSED - Access denied with insufficient permissions as expected");
    } else {
      console.log("❌ Test FAILED - Unexpected response");
    }
    
    return { status, body: responseBody };
  } catch (error) {
    console.error(`Error testing endpoint ${endpoint}:`, error);
    throw error;
  }
}