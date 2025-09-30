
import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';
import { CustomerController } from '../controllers/customer.controller';
import { DealController } from '../controllers/deal.controller';

export function setupCrmRoutes() {
  const router = Router();
  const customerController = new CustomerController();
  const dealController = new DealController();

  // Customer routes with auth
  router.post(
    '/customers',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    customerController.createCustomer
  );

  router.get(
    '/customers/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    customerController.getCustomer
  );

  router.put(
    '/customers/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    customerController.updateCustomer
  );

  router.delete(
    '/customers/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    customerController.deleteCustomer
  );

  // Deal routes with auth
  router.post(
    '/deals',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    dealController.createDeal
  );

  router.get(
    '/deals/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    dealController.getDeal
  );

  router.put(
    '/deals/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    dealController.updateDeal
  );

  router.delete(
    '/deals/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
    dealController.deleteDeal
  );

  return router;
}
