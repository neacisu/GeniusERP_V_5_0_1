/**
 * Example Protected Routes
 * 
 * These routes demonstrate how to use the AuthGuard for protecting routes.
 */

import { Router } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { JwtAuthMode, UserRole } from '../types';

/**
 * Set up example routes to demonstrate AuthGuard usage
 */
export function setupProtectedRoutes(): Router {
  const router = Router();
  
  // Route requiring authentication
  router.get('/protected', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res) => {
      res.json({
        success: true,
        message: 'You have accessed a protected route',
        user: req.user
      });
    }
  );
  
  // Route with optional authentication
  router.get('/optional',
    AuthGuard.protect(JwtAuthMode.OPTIONAL),
    (req, res) => {
      if (req.user) {
        res.json({
          success: true,
          message: 'You are logged in',
          user: req.user
        });
      } else {
        res.json({
          success: true,
          message: 'You are not logged in, but can still access this route'
        });
      }
    }
  );
  
  // Route requiring specific roles
  router.get('/admin-only',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    (req, res) => {
      res.json({
        success: true,
        message: 'You have access to admin route',
        user: req.user
      });
    }
  );
  
  // Route requiring company access
  router.get('/company/:companyId/data',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard('companyId'),
    (req, res) => {
      const { companyId } = req.params;
      res.json({
        success: true,
        message: `You have access to company ${companyId} data`,
        user: req.user,
        companyId
      });
    }
  );
  
  return router;
}