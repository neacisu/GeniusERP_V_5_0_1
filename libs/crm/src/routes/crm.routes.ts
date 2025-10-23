
import { Router } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/types';
import { UserRole } from '../../../auth/src/types';
import { CustomerController } from '../controllers/customer.controller';
import { DealController } from '../controllers/deal.controller';
import { anafController } from '../controllers/anaf.controller';

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

  // ANAF API proxy routes
  router.post(
    '/anaf-proxy',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    anafController.proxyAnafRequest
  );

  router.get(
    '/company/:cui',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    anafController.getCompanyData
  );
  
  // Ruta batch pentru interogarea datelor mai multor companii
  router.post(
    '/companies/batch',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    anafController.batchGetCompanies
  );

  return router;
}
