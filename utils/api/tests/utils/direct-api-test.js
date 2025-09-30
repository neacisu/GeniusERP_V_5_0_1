/**
 * Simple direct API test - ESM Version
 * Tests if the API endpoints are accessible
 */

// Import axios for making HTTP requests
import axios from 'axios';

// Create a simple test function to check if an endpoint is reachable
async function testEndpointAccessibility(url) {
  try {
    console.log(`Testing accessibility of: ${url}`);
    const response = await axios.get(url);
    console.log(`Success! Status code: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`Error accessing ${url}: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  // Test the local server on port 5000
  await testEndpointAccessibility('http://localhost:5000');
  
  // Try reaching a basic API endpoint (which should return 401 Unauthorized, but at least confirms the API is running)
  await testEndpointAccessibility('http://localhost:5000/api/auth/ping');
  
  // Test HR module endpoints (without token - should get 401)
  await testEndpointAccessibility('http://localhost:5000/api/hr/employees');
  await testEndpointAccessibility('http://localhost:5000/api/hr/departments');
}

// Run the tests
runTests();