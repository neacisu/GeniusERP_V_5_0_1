# AuthGuard Usage Examples

This document provides examples of how to use the new AuthGuard class in your Express route handlers. The AuthGuard follows a NestJS-style approach but is adapted for Express.

## Basic Setup

```typescript
import { Router } from 'express';
import { authGuardInstance, AuthGuard, JwtService } from '../modules/auth';

// Option 1: Use the pre-configured singleton instance
const router = Router();
router.get('/protected', authGuardInstance.canActivate(), (req, res) => {
  // req.user is available and typed as JwtPayload
  res.json({ message: 'Protected route', user: req.user });
});

// Option 2: Create a new instance for custom configuration
const jwtService = new JwtService('my-custom-secret', '1h');
const customAuthGuard = new AuthGuard(jwtService);

router.get('/custom-protected', customAuthGuard.canActivate(), (req, res) => {
  res.json({ message: 'Custom protected route', user: req.user });
});
```

## Role-Based Access Control

```typescript
// Admin-only route
router.get('/admin', 
  authGuardInstance.canActivate(),
  authGuardInstance.adminGuard(), 
  (req, res) => {
    res.json({ message: 'Admin route', user: req.user });
  }
);

// Role-specific route
router.get('/finance', 
  authGuardInstance.canActivate(),
  authGuardInstance.roleGuard(['accountant', 'finance_manager']), 
  (req, res) => {
    res.json({ message: 'Finance route', user: req.user });
  }
);
```

## Optional Authentication

```typescript
// Route that works with or without authentication
router.get('/public-with-user-data', 
  authGuardInstance.optionalAuth(), 
  (req, res) => {
    if (req.user) {
      res.json({ 
        message: 'Personalized content', 
        username: req.user.username, 
        isAuthenticated: true 
      });
    } else {
      res.json({ 
        message: 'Public content', 
        isAuthenticated: false 
      });
    }
  }
);
```

## Chaining with Other Middleware

```typescript
import { rateLimit } from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/sensitive-operation',
  apiLimiter,
  authGuardInstance.canActivate(),
  authGuardInstance.roleGuard(['admin', 'manager']),
  (req, res) => {
    // Your sensitive operation handler
  }
);
```

## Difference from Function-Based Middleware

The class-based AuthGuard provides the same functionality as the function-based middleware, but with a more object-oriented approach that facilitates:

1. Dependency injection
2. Better encapsulation
3. Extended testability
4. NestJS-style guard pattern

You can still use the function-based middleware if preferred:

```typescript
import { authGuard, roleGuard } from '../modules/auth';

router.get('/legacy-protected', authGuard, (req, res) => {
  res.json({ message: 'Legacy protected route' });
});
```