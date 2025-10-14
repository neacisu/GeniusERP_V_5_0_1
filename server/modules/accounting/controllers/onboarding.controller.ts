/**
 * Onboarding Controller
 * 
 * API controller for onboarding companies with accounting history
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';
import { OnboardingService } from '../services/onboarding.service';

export class OnboardingController extends BaseController {
  constructor(private onboardingService: OnboardingService) {
    super();
  }

  /**
   * POST /api/accounting/onboarding/start
   * Start onboarding process
   */
  async startOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { companyId, startDate, fiscalYear } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        throw { statusCode: 401, message: 'User not authenticated' };
      }
      
      if (!companyId || !startDate || !fiscalYear) {
        throw { statusCode: 400, message: 'companyId, startDate, and fiscalYear are required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const settings = await this.onboardingService.startOnboarding(
        companyId,
        new Date(startDate),
        parseInt(fiscalYear, 10),
        userId
      );
      
      return settings;
    });
  }

  /**
   * POST /api/accounting/onboarding/import-chart
   * Import chart of accounts
   */
  async importChartOfAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { companyId, accounts, csvData } = req.body;
      
      if (!companyId) {
        throw { statusCode: 400, message: 'companyId is required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      let accountsData = accounts;
      
      // Parse CSV if provided
      if (csvData && !accounts) {
        accountsData = this.onboardingService.parseChartOfAccountsCSV(csvData);
      }
      
      if (!accountsData || !Array.isArray(accountsData) || accountsData.length === 0) {
        throw { statusCode: 400, message: 'accounts array or csvData is required' };
      }
      
      await this.onboardingService.importChartOfAccounts(companyId, accountsData);
      
      return { 
        message: 'Chart of accounts imported successfully',
        count: accountsData.length 
      };
    });
  }

  /**
   * POST /api/accounting/onboarding/import-balances
   * Import opening balances
   */
  async importOpeningBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { companyId, balances, fiscalYear, importSource, csvData } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        throw { statusCode: 401, message: 'User not authenticated' };
      }
      
      if (!companyId || !fiscalYear) {
        throw { statusCode: 400, message: 'companyId and fiscalYear are required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      let balancesData = balances;
      
      // Parse CSV if provided
      if (csvData && !balances) {
        balancesData = this.onboardingService.parseOpeningBalancesCSV(csvData);
      }
      
      if (!balancesData || !Array.isArray(balancesData) || balancesData.length === 0) {
        throw { statusCode: 400, message: 'balances array or csvData is required' };
      }
      
      const imported = await this.onboardingService.importOpeningBalances(
        companyId,
        balancesData,
        parseInt(fiscalYear, 10),
        importSource || 'MANUAL',
        userId
      );
      
      return { 
        message: 'Opening balances imported successfully',
        count: imported.length,
        balances: imported
      };
    });
  }

  /**
   * POST /api/accounting/onboarding/validate
   * Validate opening balances
   */
  async validateOpeningBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { companyId, fiscalYear } = req.body;
      
      if (!companyId || !fiscalYear) {
        throw { statusCode: 400, message: 'companyId and fiscalYear are required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const validation = await this.onboardingService.validateOpeningBalances(
        companyId,
        parseInt(fiscalYear, 10)
      );
      
      return validation;
    });
  }

  /**
   * POST /api/accounting/onboarding/finalize
   * Finalize onboarding
   */
  async finalizeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { companyId, fiscalYear } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        throw { statusCode: 401, message: 'User not authenticated' };
      }
      
      if (!companyId || !fiscalYear) {
        throw { statusCode: 400, message: 'companyId and fiscalYear are required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const settings = await this.onboardingService.finalizeOnboarding(
        companyId,
        parseInt(fiscalYear, 10),
        userId
      );
      
      return {
        message: 'Onboarding finalized successfully',
        settings
      };
    });
  }

  /**
   * GET /api/accounting/onboarding/status/:companyId
   * Get onboarding status
   */
  async getOnboardingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string, 10);
      
      if (!fiscalYear) {
        throw { statusCode: 400, message: 'fiscalYear query parameter is required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const status = await this.onboardingService.getOnboardingStatus(companyId, fiscalYear);
      return status;
    });
  }

  /**
   * Helper: Verify user has access to company
   */
  private verifyCompanyAccess(req: AuthenticatedRequest, companyId: string): void {
    // Check if user has access to this company
    if (req.user?.companyId && req.user.companyId !== companyId) {
      throw { statusCode: 403, message: 'Access denied to this company' };
    }
    
    // Admin and accountant roles are allowed
    const allowedRoles = ['admin', 'accountant'];
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      throw { statusCode: 403, message: 'Insufficient permissions. Admin or accountant role required' };
    }
  }
}

