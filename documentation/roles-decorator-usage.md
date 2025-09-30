# Role-Based Access Control with @Roles() Decorator

This document explains how to use the `@Roles()` decorator with the `RolesGuard` to implement role-based access control in your Express API.

## Overview

The role-based access control system consists of two main components:

1. **@Roles() Decorator**: Attaches role metadata to controller methods
2. **RolesGuard**: Enforces role-based access control by checking the user's roles

## Installation & Setup

Both components are already installed in the common directory:

- `server/common/decorators/roles.decorator.ts`
- `server/common/guards/roles.guard.ts`

## Usage Examples

### Basic Example

Here's a typical usage pattern combining authentication and role checking:

```typescript
import { Router } from 'express';
import { AuthGuard } from '../common/middleware/auth-guard';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { Reflector } from '@nestjs/common';

const router = Router();
const reflector = new Reflector();
const rolesGuard = new RolesGuard(reflector);

// Middleware function that combines AuthGuard and RolesGuard
const protectWithRoles = (roles: string[]) => {
  return [
    // First authenticate the user
    AuthGuard.requireAuth(),
    
    // Then check roles
    (req, res, next) => {
      reflector.get = () => roles;
      rolesGuard.canActivate(req, res, next);
    }
  ];
};

// Admin-only route
router.post('/admin-resource', 
  ...protectWithRoles(['admin']), 
  (req, res) => {
    res.json({ message: 'Admin-only resource' });
  }
);

// Multi-role route
router.get('/manager-resource', 
  ...protectWithRoles(['admin', 'manager']), 
  (req, res) => {
    res.json({ message: 'Manager resource' });
  }
);
```

### Using in Controllers

When using in class-based controllers, you can apply the decorator directly to methods:

```typescript
import { Roles } from '../common/decorators';

class UserController {
  @Roles('admin')
  createUser(req, res) {
    // Create user logic
  }
  
  @Roles('admin', 'manager')
  listUsers(req, res) {
    // List users logic
  }
}

// Then in your routes
const controller = new UserController();
router.post('/users', 
  ...protectWithRoles(['admin']), 
  controller.createUser
);
```

## How It Works

1. The `@Roles()` decorator uses `SetMetadata()` to attach role information to methods
2. The `RolesGuard` uses a `Reflector` to read this metadata
3. The guard compares the required roles with the user's roles from the JWT token
4. Access is granted if the user has at least one of the required roles

## Integration with Existing Code

The `AuthGuard` and `RolesGuard` are designed to work together:

1. `AuthGuard.requireAuth()` verifies the JWT token and attaches user info to the request
2. `RolesGuard` checks if the authenticated user has the required roles

## Error Handling

The `RolesGuard` will:

- Return 401 if no user is found in the request
- Return 403 if the user doesn't have the required roles
- Call `next()` if the user has the required roles

## Testing

You can test the decorator and guard using the provided script:

```bash
npx tsx test-roles-decorator.ts
```

## Best Practices

1. Always use `AuthGuard` before `RolesGuard`
2. Group routes by role requirements for cleaner code
3. Consider using higher-order functions to combine middleware for common patterns
4. Use clear, consistent role names throughout your application