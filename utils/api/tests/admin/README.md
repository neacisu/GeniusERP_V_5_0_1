# Admin API Testing

This directory contains various test scripts for the Admin API functionality.

## Available Test Scripts

### 1. Direct Service Test
- **File**: `direct-service-test.js`
- **Description**: Tests the Admin Setup Service functionality directly, bypassing the HTTP layer.
- **Usage**: `node direct-service-test.js`
- **Features**: 
  - Tests the core service functions for recording setup steps, retrieving steps, checking completion, and calculating progress
  - Works independently of the HTTP server and middleware
  - Uses mock data for demonstration purposes

### 2. Direct HTTP Test
- **File**: `direct-http-test.js`
- **Description**: Tests the Admin API endpoints using Node.js built-in HTTP module.
- **Usage**: `node direct-http-test.js`
- **Features**:
  - Makes HTTP requests directly to the API endpoints
  - Shows complete HTTP response details including headers
  - Detects if responses are HTML or JSON
  - Note: Affected by Vite middleware (may return HTML instead of JSON)

### 3. API Routes Test
- **File**: `test-api-routes.js`
- **Description**: Tests API routes availability and analyzes route registration issues.
- **Usage**: `node test-api-routes.js`
- **Features**:
  - Tests multiple API routes to check their responses
  - Simulates Express route registration to explain middleware ordering
  - Provides diagnosis of Vite middleware interception issues
  - Suggests solutions for fixing API route interception problems

### 4. HTTP API Test
- **File**: `run-direct-test.js`
- **Description**: Tests the Admin API endpoints using direct HTTP requests.
- **Usage**: `node run-direct-test.js`
- **Features**:
  - Makes actual HTTP requests to the API endpoints
  - Uses the Node.js HTTP module for requests
  - Note: Currently affected by Vite middleware (returns HTML instead of JSON)

### 5. cURL Test
- **File**: `test-admin-curl.sh`
- **Description**: Tests the Admin API endpoints using curl commands.
- **Usage**: `./test-admin-curl.sh`
- **Features**:
  - Makes API requests using curl
  - Includes colored output for better readability
  - Note: Currently affected by Vite middleware (returns HTML instead of JSON)

## Testing Challenges

The HTTP-based tests (both direct-admin-test.js and test-admin-curl.sh) currently face an issue where the Vite middleware's catch-all route is intercepting the API responses and returning HTML instead of JSON.

This happens because:

1. The server registers API routes with proper paths (e.g., `/api/admin/setup/steps/:companyId`)
2. The request successfully reaches the server (status code 200)
3. However, the Vite middleware's catch-all route (`app.use("*", ...)` in server/vite.ts) intercepts the response and returns the client's index.html file

To work around this issue, we've created the direct service test that bypasses the HTTP layer entirely.

## Authentication

Some tests require an admin token for authentication. The token should be stored in a file named `admin-token.txt` in this directory.

## Sample Data

The tests use dynamically generated company and franchise IDs to avoid conflicts and ensure test isolation.