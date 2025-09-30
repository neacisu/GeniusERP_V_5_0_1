# Authentication System Documentation

This document provides a comprehensive overview of the authentication and authorization system implemented in our Romanian Accounting ERP application.

## Architecture

The authentication system follows a modular approach with three main implementation patterns:

1. **Function-based Middleware**: Traditional Express.js middleware functions
2. **Class-based Guards**: Object-oriented approach similar to NestJS guards
3. **Service-based Authentication**: Business logic encapsulated in service classes

## Core Components

### Authentication Services

#### 1. AuthService

The `AuthService` handles user authentication, registration, and password management:

- **Password Hashing**: Uses Node.js crypto module with scrypt algorithm
- **User Registration**: Creates new users with hashed passwords
- **User Authentication**: Verifies credentials and issues JWT tokens
- **Token Verification**: Validates JWT tokens and retrieves user information

#### 2. JwtService

A utility service for JWT operations that follows the NestJS pattern:

- **Token Signing**: Creates new tokens with configurable expiration
- **Token Verification**: Validates tokens and extracts payload
- **Token Decoding**: Extracts payload without verification (for debugging)

### Authentication Guards

#### 1. AuthGuard

A class-based implementation that provides various authentication strategies:

- **Required Authentication**: Ensures the request has a valid token
- **Optional Authentication**: Populates user info if token exists, but doesn't block access
- **Role-based Guards**: Verifies user has required role(s)
- **Admin Guard**: Special case of role guard for admin-only routes

### Integration with Express

The authentication system integrates with Express in multiple ways:

1. **Request Extension**: Adds `user` property to Express.Request object
2. **Middleware Registration**: Authentication middleware is registered on routes
3. **Route Protection**: Guards are applied to specific routes or route groups

## JWT Implementation

### Token Format

```typescript
interface JwtPayload {
  id: string;         // User ID
  username: string;   // Username for display/logs
  role: string;       // Primary role (for backwards compatibility)
  roles: string[];    // Array of all user roles (for RBAC)
  iat?: number;       // Issued at timestamp (added by JWT library)
  exp?: number;       // Expiration timestamp (added by JWT library)
}
```

### Security Settings

- **Secret Key**: Stored in `JWT_SECRET` environment variable
- **Token Expiration**: Configurable via `JWT_EXPIRES_IN` (default: 24h)
- **Token Extraction**: From Authorization header with Bearer scheme

## Role-Based Access Control (RBAC)

### Database Schema

- **Users Table**: Contains basic user information, including primary role
- **Roles Table**: Defines available roles in the system
- **Permissions Table**: Lists granular permissions for resources/actions
- **UserRoles Table**: Many-to-many relationship between users and roles
- **RolePermissions Table**: Many-to-many relationship between roles and permissions

### Permission Checking

The system supports multiple levels of permission checks:

1. **Simple Role Check**: Verify user has a specific role
2. **Multiple Role Check**: Verify user has any of the specified roles
3. **Permission-based Check**: Verify user has specific permission through their roles

## Usage Examples

### Authentication Routes

```typescript
// Registration
POST /api/auth/register
{
  "username": "user",
  "password": "password",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}

// Login
POST /api/auth/login
{
  "username": "user",
  "password": "password"
}

// Response (both endpoints)
{
  "id": "user-id",
  "username": "user",
  "token": "jwt-token",
  // other user data...
}
```

### Protecting API Routes

```typescript
// Using class-based guard
router.get('/protected-resource',
  authGuardInstance.canActivate(),
  authGuardInstance.roleGuard(['admin', 'accountant']),
  (req, res) => {
    // Access req.user safely here
    res.json({ data: 'Protected data', user: req.user });
  }
);

// Using functional middleware (legacy approach)
router.get('/protected-legacy',
  authGuard,
  roleGuard(['admin']),
  (req, res) => {
    res.json({ data: 'Admin only data' });
  }
);
```

## Testing Authentication

For testing and development, the system provides endpoints to generate test tokens:

```bash
# Get a token with admin role
curl -s http://localhost:5000/api/examples/get-token

# Test protected endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/examples/protected

# Test admin-only endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/examples/admin

# Test role-based endpoint
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/examples/finance
```

## Security Best Practices

1. **HTTPS Only**: JWT tokens should only be transmitted over HTTPS
2. **Short Expiration**: Tokens expire after 24 hours by default
3. **Secure Password Storage**: Passwords stored with scrypt + unique salt
4. **Token Validation**: Comprehensive token validation checks
5. **Rate Limiting**: API endpoints should have rate limiting (to be implemented)
6. **CSRF Protection**: For cookie-based sessions
7. **Error Obscurity**: Generic error messages that don't leak information

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token flow for longer sessions
2. **OAuth Integration**: Add social login providers
3. **Multi-factor Authentication**: Add support for 2FA
4. **Session Management**: Allow viewing/revoking active sessions
5. **Permission-based Authorization**: More granular access control