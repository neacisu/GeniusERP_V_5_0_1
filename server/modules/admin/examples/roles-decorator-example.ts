/**
 * Example of @Roles() Decorator Usage in Controller
 * 
 * This file provides an example of how to use the @Roles() decorator in a controller
 * to implement role-based access control on endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { RolesGuard } from '../../../common/guards';
import { Roles } from '../../../common/decorators';
import { Reflector } from '../../../common/reflector/reflector';

// Create a router for this example
const exampleRouter = Router();

// Create an instance of the RolesGuard with a reflector
const reflector = new Reflector();
const rolesGuard = new RolesGuard(reflector);

// Create a middleware function that combines AuthGuard and RolesGuard
const protectWithRoles = (roles: string[]) => {
  // This middleware combines authentication and role checking
  return [
    // First authenticate the user
    AuthGuard.AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    // Then check roles (assuming metadata is properly set)
    (req: Request, res: Response, next: NextFunction) => {
      // Manually set the required roles for this route
      reflector.get = function<T>(): T {
        return roles as unknown as T;
      };
      
      // Apply the roles guard
      rolesGuard.canActivate(req, res, next);
    }
  ];
};

/**
 * Example user management routes with role-based access control
 */

// List users - available to admins and managers
exampleRouter.get('/users', 
  ...protectWithRoles(['admin', 'manager']), 
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: 'List of users', 
      // In a real app, you would fetch users from the database here
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ] 
    });
  }
);

// Create user - admin only
exampleRouter.post('/users', 
  ...protectWithRoles(['admin']), 
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: 'User created successfully' 
    });
  }
);

// Update user - admins and managers
exampleRouter.put('/users/:id', 
  ...protectWithRoles(['admin', 'manager']), 
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: `User ${req.params.id} updated successfully` 
    });
  }
);

// Delete user - admin only
exampleRouter.delete('/users/:id', 
  ...protectWithRoles(['admin']), 
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: `User ${req.params.id} deleted successfully` 
    });
  }
);

// Get user profile - available to the user themselves or admins
exampleRouter.get('/users/:id/profile', 
  AuthGuard.AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response, next: NextFunction) => {
    // Custom middleware to check if user is accessing their own profile or is an admin
    const userId = req.params.id;
    const currentUser = req.user as any;
    
    if (currentUser.id === userId || (currentUser.roles && currentUser.roles.includes('admin'))) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied - you can only view your own profile unless you are an admin' 
    });
  },
  (req: Request, res: Response) => {
    res.json({ 
      success: true, 
      message: `Profile for user ${req.params.id}`,
      profile: {
        id: req.params.id,
        name: 'Example User',
        email: 'user@example.com'
      }
    });
  }
);

export default exampleRouter;