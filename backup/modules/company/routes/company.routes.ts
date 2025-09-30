
import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { UserRole } from '../../auth/models/auth.enum';

export function setupCompanyRoutes() {
  const router = Router();

  // Get company details - requires authentication
  router.get(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard('id'),
    async (req, res) => {
      // Company controller logic here
    }
  );

  // Create company - admin only
  router.post(
    '/companies',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (req, res) => {
      // Create company logic here
    }
  );

  // Update company - company admin or admin
  router.put(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
    AuthGuard.companyGuard('id'),
    async (req, res) => {
      // Update company logic here
    }
  );

  // Delete company - admin only
  router.delete(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (req, res) => {
      // Delete company logic here
    }
  );

  return router;
}
