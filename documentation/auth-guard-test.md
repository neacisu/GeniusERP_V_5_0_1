# AuthGuard & JwtService Test Guide

This guide shows how to test the updated JWT service and AuthGuard middleware.

## Overview of Changes

1. Converted `AuthGuard` methods from static methods to instance methods:
   - `protect()` - Basic JWT authentication
   - `roleGuard()` - Role-based access control 
   - `companyGuard()` - Company-based access control

2. Updated the JWT service to use singleton pattern for consistent authentication handling

3. Created example protected routes to test the functionality

## Testing Steps

1. Generate a test JWT token:
   ```bash
   # Run the token generator script
   npx tsx test-jwt-instance.ts
   ```

2. Copy the generated token

3. Test the protected routes:
   ```bash
   # Test authentication required route
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/examples/protected
   
   # Test role-based protection
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/examples/admin-only
   
   # Test company guard
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/examples/company/company-123/data
   
   # Optional authentication route (with token)
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/examples/optional
   
   # Optional authentication route (without token)
   curl http://localhost:3000/api/examples/optional
   ```

4. Test with invalid token:
   ```bash
   # Should return 401 Unauthorized
   curl -H "Authorization: Bearer INVALID_TOKEN" http://localhost:3000/api/examples/protected
   ```

## Expected Results

- Protected routes should return user data when accessed with valid token
- Role-based routes should only allow users with appropriate roles
- Company routes should only allow users associated with that company
- Optional routes should work with or without authentication
- Invalid tokens should be rejected with 401 Unauthorized

## Implementation Details

The `AuthGuard` class uses the JWT service to verify tokens and apply various protection rules to routes. It follows a middleware pattern where each protection function returns an Express middleware function.

The singleton pattern for the JWT service ensures consistent JWT handling throughout the application by using a single instance with standardized configuration.