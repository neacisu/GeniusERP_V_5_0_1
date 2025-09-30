
import { Router } from 'express';
import authGuard from '../../auth/guards/auth.guard';
import { ExamplesController } from '../controllers/examples.controller';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';

const router = Router();

// Public route - no auth needed
router.get('/public', ExamplesController.publicTest);

// Protected route - auth required
router.get('/protected', 
  authGuard.requireAuth(),
  ExamplesController.protectedTest
);

// Optional auth route
router.get('/optional-auth', 
  authGuard.optionalAuth(),
  ExamplesController.optionalAuthTest
);

// Admin only route
router.get('/admin-only',
  authGuard.requireAuth(),
  authGuard.requireRoles([UserRole.ADMIN]),
  ExamplesController.adminTest
);

// Company specific route
router.get('/company/:companyId',
  authGuard.requireAuth(),
  authGuard.requireCompanyAccess('companyId'),
  ExamplesController.companyTest
);

// Multiple roles route
router.get('/manager-route',
  authGuard.requireAuth(),
  authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  ExamplesController.managerTest
);

// Token info route - no auth needed
router.get('/token-info', ExamplesController.tokenInfo);

export default router;
