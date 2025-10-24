
/**
 * Company Routes
 * 
 * Route definitions for the company module
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { UserRole, AuthenticatedRequest } from '@geniuserp/auth';
import { CompanyController } from '../controllers/company.controller';

export class CompanyRouter {
  private router: Router;
  
  constructor(private readonly companyController: CompanyController) {
    this.router = Router();
    this.setupRoutes();
  }
  
  /**
   * Configure all company routes
   */
  private setupRoutes(): void {
    // Get all companies
    this.router.get(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req: AuthenticatedRequest, res: Response) => this.companyController.getAllCompanies(req, res)
    );
    
    // Search companies
    this.router.get(
      '/search',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req: AuthenticatedRequest, res: Response) => this.companyController.searchCompanies(req, res)
    );
    
    // Get company hierarchy
    this.router.get(
      '/hierarchy',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req: AuthenticatedRequest, res: Response) => this.companyController.getCompanyHierarchy(req, res)
    );
    
    // Get franchises - nu necesită autentificare pentru simplificare
    this.router.get(
      '/franchises',
      (req: Request, res: Response) => {
        // Convert to AuthenticatedRequest to maintain compatibility
        const authReq = req as AuthenticatedRequest;
        this.companyController.getFranchises(authReq, res);
      }
    );
    
    // Get company details - requires authentication
    this.router.get(
      '/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.companyGuard('id'),
      (req: AuthenticatedRequest, res: Response) => this.companyController.getCompanyById(req, res)
    );
    
    // Create company - admin only
    this.router.post(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      (req: AuthenticatedRequest, res: Response) => this.companyController.createCompany(req, res)
    );
    
    // Update company - company admin or admin
    this.router.put(
      '/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
      AuthGuard.companyGuard('id'),
      (req: AuthenticatedRequest, res: Response) => this.companyController.updateCompany(req, res)
    );
    
    // Delete company - admin only
    this.router.delete(
      '/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      AuthGuard.roleGuard([UserRole.ADMIN]),
      (req: AuthenticatedRequest, res: Response) => this.companyController.deleteCompany(req, res)
    );
  }
  
  /**
   * Get the configured router
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Initialize the company router with the company controller
 * 
 * @param companyController CompanyController instance
 * @returns Router instance for company routes
 */
export function createCompanyRouter(companyController: CompanyController): Router {
  return new CompanyRouter(companyController).getRouter();
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use CompanyRouter class or createCompanyRouter function instead
 */
export function setupCompanyRoutes() {
  const router = Router();

  // Get company details - requires authentication
  router.get(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard('id'),
    async (_req: AuthenticatedRequest, res: Response) => {
      // Company controller logic here
      res.status(501).json({ message: 'Not implemented - use new API endpoints' });
    }
  );

  // Create company - admin only
  router.post(
    '/companies',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (_req: AuthenticatedRequest, res: Response) => {
      // Create company logic here
      res.status(501).json({ message: 'Not implemented - use new API endpoints' });
    }
  );

  // Update company - company admin or admin
  router.put(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
    AuthGuard.companyGuard('id'),
    async (_req: AuthenticatedRequest, res: Response) => {
      // Update company logic here
      res.status(501).json({ message: 'Not implemented - use new API endpoints' });
    }
  );

  // Delete company - admin only
  router.delete(
    '/companies/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (_req: AuthenticatedRequest, res: Response) => {
      // Delete company logic here
      res.status(501).json({ message: 'Not implemented - use new API endpoints' });
    }
  );

  return router;
}
