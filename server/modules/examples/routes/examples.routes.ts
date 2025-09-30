
import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ExamplesController } from '../controllers/examples.controller';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';
import notificationExamplesRouter from './notification-example.routes';
import publicNotificationRouter from './notification-public.routes';

const router = Router();

// Mount notification examples routes
router.use('/notifications', notificationExamplesRouter);

// Mount public notification test routes
router.use('/public-notifications', publicNotificationRouter);

// Public route - no auth needed
router.get('/public', ExamplesController.publicTest);

// Protected route - auth required
router.get('/protected', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  ExamplesController.protectedTest
);

// Optional auth route
router.get('/optional-auth', 
  AuthGuard.protect(JwtAuthMode.OPTIONAL),
  ExamplesController.optionalAuthTest
);

// Admin only route
router.get('/admin-only',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN]),
  ExamplesController.adminTest
);

// Company specific route  
router.get('/company/:companyId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.companyGuard('companyId'),
  ExamplesController.companyTest
);

// Multiple roles route
router.get('/manager-route',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  ExamplesController.managerTest
);

// Token info route - no auth needed
router.get('/token-info', ExamplesController.tokenInfo);

export default router;
