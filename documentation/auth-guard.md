# AuthGuard Implementation

This document describes the implementation of the JWT-based authentication system in our Romanian Accounting ERP application.

## Overview

The authentication system uses JSON Web Tokens (JWT) to secure API routes. It follows a modular, class-based approach that resembles NestJS's guard pattern but is adapted for Express.js.

## Components

### 1. JwtService

A service responsible for JWT operations:
- `sign(payload)`: Creates a new JWT token with the provided payload
- `verify(token)`: Verifies and decodes a JWT token
- `decode(token)`: Decodes a JWT token without verification (for debugging)

### 2. AuthService

Handles user authentication and security operations:
- Password hashing using secure scrypt algorithm
- User registration and authentication
- Token generation with proper role mapping
- Token verification and user retrieval

### 3. AuthGuard

A class-based guard for route protection:
- `canActivate()`: Main guard method to require authentication
- `optionalAuth()`: Populates user if token exists, but doesn't require it
- `adminGuard()`: Ensures the user has admin privileges
- `roleGuard(roles)`: Checks if user has any of the specified roles

## JWT Payload Format

```typescript
interface JwtPayload {
  id: string;
  username: string;
  role: string;
  roles: string[];
  iat?: number;  // Issued at timestamp
  exp?: number;  // Expiration timestamp
}
```

## Usage Examples

### Protecting a Route

```typescript
// Require authentication 
router.get('/protected', 
  authGuardInstance.canActivate(),
  (req, res) => {
    res.json({ 
      message: 'Protected endpoint',
      user: req.user
    });
  }
);
```

### Role-based Access Control

```typescript
// Require specific roles
router.get('/finance',
  authGuardInstance.canActivate(),
  authGuardInstance.roleGuard(['accountant', 'finance_manager', 'admin']),
  (req, res) => {
    res.json({ 
      message: 'Finance endpoint - finance roles required',
      user: req.user
    });
  }
);
```

### Optional Authentication

```typescript
// Works with or without authentication
router.get('/optional',
  authGuardInstance.optionalAuth(),
  (req, res) => {
    if (req.user) {
      res.json({
        message: 'User is authenticated',
        user: req.user,
        isAuthenticated: true
      });
    } else {
      res.json({
        message: 'User is not authenticated',
        isAuthenticated: false
      });
    }
  }
);
```

## Checking Token Validity

For testing and development, you can use the `/api/examples/get-token` endpoint to generate a valid token, and then use it in subsequent API calls:

```bash
# Get a token
curl -s http://localhost:5000/api/examples/get-token

# Use the token
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/examples/protected
```

## Security Considerations

1. Tokens are signed with a secret key (JWT_SECRET environment variable)
2. Tokens expire after a configurable time (JWT_EXPIRES_IN environment variable, default: 24h)
3. Password hashing uses scrypt with unique salt per user
4. AuthGuard provides detailed logging for debugging token issues