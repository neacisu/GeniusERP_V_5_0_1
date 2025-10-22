# Invoice Security Implementation

## Overview

This document explains the security implementation for the invoice endpoints in the GeniusERP v.2 system. The invoice module follows a strict role-based access control (RBAC) model to ensure that only authorized users can perform sensitive operations related to invoices.

## Security Architecture

The invoice endpoints are secured using a multi-layer security approach:

1. **Authentication Layer**: JWT-based authentication via `AuthGuard.protect()`
2. **Authorization Layer**: Role-based access control via `AuthGuard.roleGuard()`
3. **Audit Logging**: All invoice operations are logged in the audit trail

## Role Configuration

The following roles have access to invoice operations:

- `ADMIN`: Full access to all invoice operations
- `FINANCE_MANAGER`: Full access to invoice creation and management
- `ACCOUNTANT`: Access to invoice creation and viewing

Other roles such as `SALES_AGENT` do not have access to invoice operations.

## Implementation Details

### Route Security

Invoice routes are secured in the route definition:

```typescript
// Example of securing the invoice creation endpoint
router.post('/v1/invoices/create', 
  AuthGuard.protect(), 
  AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]), 
  async (req, res) => {
    // Route handler implementation
  }
);
```

This configuration ensures that:
1. The user must be authenticated with a valid JWT token
2. The user must have one of the allowed roles to access the endpoint

### Authentication Guard

The `AuthGuard.protect()` middleware:
- Verifies the presence of a JWT token in the Authorization header
- Validates the token signature and expiration
- Attaches the decoded user data to the request for use in subsequent middleware

### Role Guard

The `AuthGuard.roleGuard()` middleware:
- Receives an array of allowed roles
- Verifies that the authenticated user has at least one of the required roles
- Returns a 403 Forbidden response if the user doesn't have sufficient permissions

## Security Testing

The security implementation is tested using the `test-invoice-security.ts` script, which:
1. Tests access with different user roles
2. Verifies that unauthorized roles are rejected
3. Ensures proper error responses for authentication and authorization failures

## Common Issues and Fixes

### Issue: Using `requireRoles` instead of `roleGuard`

The `AuthGuard` class has an instance method `requireRoles()` but the static method is called `roleGuard()`. Using the wrong method name can cause authorization checks to fail silently.

**Wrong:**
```typescript
AuthGuard.requireRoles([UserRole.ADMIN]) // This doesn't work because the static method is named roleGuard
```

**Correct:**
```typescript
AuthGuard.roleGuard([UserRole.ADMIN]) // This is the correct static method name
```

### Issue: Forgotten Module Registration

Remember to register the Invoices module in the main application initialization:

```typescript
// In server/modules/index.ts
console.log('Initializing Invoices module...');
InvoicesModule.register(app);
console.log('Invoices module initialized');
```

## Best Practices

1. Always use both authentication and authorization guards on sensitive endpoints
2. Include specific roles rather than broad categories
3. Follow the principle of least privilege by restricting access to the minimum necessary roles
4. Test all security implementations with both positive and negative test cases

## Conclusion

The invoice security implementation ensures that only authenticated users with appropriate roles can access and modify invoice data. This protection is critical for maintaining the financial integrity of the system and compliance with audit requirements.
