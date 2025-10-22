# Canonical Authentication Implementation

## Introduction
This guide explains the unified authentication approach for the entire application. Following the principles of "Do One Thing Well," we have consolidated all authentication and role-based access control (RBAC) functionality into a single `AuthGuard` class.

## Core Implementation
The canonical implementation resides in:
- `server/modules/auth/guards/auth.guard.ts`

All other auth implementations have been archived in:
- `server/modules/auth/guards/backup/`

## Design Principles
1. **Single Source of Truth**: All auth functionality is implemented in one file
2. **Backward Compatibility**: Static methods are provided for existing code
3. **Forward Compatibility**: New instance methods are encouraged for new code
4. **Comprehensive Logging**: All auth decisions are properly logged
5. **Progressive Enhancement**: New features added without breaking existing code

## Usage Guide

### Basic Authentication

#### Static Methods (legacy code)
```typescript
// In your route definition
router.get('/protected-resource', 
  AuthGuard.protect(JwtAuthMode.REQUIRED), 
  (req, res) => { /* handler */ }
);

// Optional authentication
router.get('/semi-protected', 
  AuthGuard.protect(JwtAuthMode.OPTIONAL), 
  (req, res) => { /* handler */ }
);
```

#### Instance Methods (new code)
```typescript
// Import the default instance
import authGuard from '../auth/guards/auth.guard';

// In your route definition
router.get('/protected-resource', 
  authGuard.requireAuth(), 
  (req, res) => { /* handler */ }
);

// Optional authentication
router.get('/semi-protected', 
  authGuard.optionalAuth(), 
  (req, res) => { /* handler */ }
);
```

### Role-Based Access Control

#### Static Methods (legacy code)
```typescript
// Require specific roles
router.get('/admin-only', 
  AuthGuard.protect(),
  AuthGuard.roleGuard(['admin', 'super_admin']), 
  (req, res) => { /* handler */ }
);
```

#### Instance Methods (new code)
```typescript
// Import the default instance
import authGuard from '../auth/guards/auth.guard';

// Require specific roles
router.get('/admin-only', 
  authGuard.requireAuth(),
  authGuard.requireRoles(['admin', 'super_admin']), 
  (req, res) => { /* handler */ }
);

// You can also combine them into one call
router.get('/admin-only', 
  authGuard.requireRoles(['admin', 'super_admin']), 
  (req, res) => { /* handler */ }
);
```

### Company Access Control
```typescript
// Protect a company-specific resource
router.get('/companies/:companyId/reports', 
  authGuard.requireCompanyAccess('companyId'), 
  (req, res) => { /* handler */ }
);

// Using static method
router.get('/companies/:companyId/reports', 
  AuthGuard.companyGuard('companyId'), 
  (req, res) => { /* handler */ }
);
```

### Permission-Based Access Control
```typescript
// Require specific permissions
router.post('/invoices/approve', 
  authGuard.requirePermissions(['invoice:approve']), 
  (req, res) => { /* handler */ }
);

// Multiple permissions
router.delete('/users/:userId', 
  authGuard.requirePermissions(['user:delete', 'admin:access']), 
  (req, res) => { /* handler */ }
);

// Using static method
router.post('/invoices/approve', 
  AuthGuard.permissionGuard('invoice:approve'), 
  (req, res) => { /* handler */ }
);
```

## Common Problems and Solutions

### 401 Unauthorized Errors
- Always check that you're using the correct JWT_SECRET
- Ensure token is being passed in the Authorization header as "Bearer {token}"
- Verify token hasn't expired

### 403 Forbidden Errors
- Check that the user has the required role
- For company access, ensure the user belongs to the requested company
- For permissions, verify all required permissions are granted

### Debugging Authentication
The AuthGuard includes comprehensive logging. Look for log entries with:
- 'Admin role detected...' - Special access granted
- 'Role verification successful...' - Role match found
- 'Authorization failed...' - Missing required roles 
- 'Permission check failed...' - Missing required permissions

## Testing Authentication
Use the test token generator in `test/get-valid-token.ts` to create tokens for testing:
```
# Generate a test token with admin role
node test/get-valid-token.ts admin
```