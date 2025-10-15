/**
 * Accounting Settings Controller
 * 
 * API controller for managing accounting settings
 */

import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';
import { AccountingSettingsService } from '../services/accounting-settings.service';
import { 
  updateAccountingSettingsSchema,
  updateVatSettingsSchema,
  insertAccountRelationshipsSchema,
  updateAccountRelationshipsSchema,
} from '@shared/schema';

export class AccountingSettingsController extends BaseController {
  constructor(private settingsService: AccountingSettingsService) {
    super();
  }

  /**
   * GET /api/accounting/settings/:companyId
   * Get all accounting settings
   */
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const settings = await this.settingsService.getSettings(companyId);
      return settings;
    });
  }

  /**
   * PUT /api/accounting/settings/:companyId/general
   * Update general accounting settings
   */
  async updateGeneralSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const userId = req.user?.id;
      
      if (!userId) {
        throw { statusCode: 401, message: 'User not authenticated' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      // Validate input
      const validatedData = updateAccountingSettingsSchema.parse(req.body);
      
      const settings = await this.settingsService.updateGeneralSettings(
        companyId,
        validatedData,
        userId
      );
      
      return settings;
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/vat
   * Get VAT settings
   */
  async getVatSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const settings = await this.settingsService.getVatSettings(companyId);
      return settings;
    });
  }

  /**
   * PUT /api/accounting/settings/:companyId/vat
   * Update VAT settings
   */
  async updateVatSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      // Validate input
      const validatedData = updateVatSettingsSchema.parse(req.body);
      
      const settings = await this.settingsService.updateVatSettings(companyId, validatedData);
      return settings;
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/account-mappings
   * Get account mappings
   */
  async getAccountMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const mappings = await this.settingsService.getAccountMappings(companyId);
      return mappings;
    });
  }

  /**
   * PUT /api/accounting/settings/:companyId/account-mappings/:type
   * Update account mapping
   */
  async updateAccountMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const mappingType = req.params.type;
      const { accountCode } = req.body;
      
      if (!accountCode) {
        throw { statusCode: 400, message: 'accountCode is required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const mapping = await this.settingsService.updateAccountMapping(
        companyId,
        mappingType,
        accountCode
      );
      
      return mapping;
    });
  }

  /**
   * POST /api/accounting/settings/:companyId/account-mappings/reset
   * Reset account mappings to default
   */
  async resetAccountMappings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      await this.settingsService.resetAccountMappingsToDefault(companyId);
      
      return { message: 'Account mappings reset to default successfully' };
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/relationships
   * Get account relationships
   */
  async getAccountRelationships(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const relationships = await this.settingsService.getAccountRelationships(companyId);
      return relationships;
    });
  }

  /**
   * POST /api/accounting/settings/:companyId/relationships
   * Create account relationship
   */
  async createAccountRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      // Validate input
      const validatedData = insertAccountRelationshipsSchema.omit({ companyId: true }).parse(req.body);
      
      const relationship = await this.settingsService.createAccountRelationship(
        companyId,
        validatedData
      );
      
      return relationship;
    });
  }

  /**
   * PUT /api/accounting/settings/:companyId/relationships/:id
   * Update account relationship
   */
  async updateAccountRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const relationshipId = req.params.id;
      
      // Validate input
      const validatedData = updateAccountRelationshipsSchema.parse(req.body);
      
      const relationship = await this.settingsService.updateAccountRelationship(
        relationshipId,
        validatedData
      );
      
      return relationship;
    });
  }

  /**
   * DELETE /api/accounting/settings/:companyId/relationships/:id
   * Delete account relationship
   */
  async deleteAccountRelationship(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const relationshipId = req.params.id;
      
      await this.settingsService.deleteAccountRelationship(relationshipId);
      
      return { message: 'Account relationship deleted successfully' };
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/document-counters
   * Get document counters
   */
  async getDocumentCounters(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const counters = await this.settingsService.getDocumentCounters(companyId);
      return counters;
    });
  }

  /**
   * PUT /api/accounting/settings/:companyId/document-counters/:type
   * Update document counter series
   */
  async updateDocumentCounterSeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const counterType = req.params.type;
      const { series, year } = req.body;
      
      if (!series || !year) {
        throw { statusCode: 400, message: 'series and year are required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const counter = await this.settingsService.updateDocumentCounterSeries(
        companyId,
        counterType,
        series,
        parseInt(year, 10)
      );
      
      return counter;
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/fiscal-periods
   * Get fiscal periods
   */
  async getFiscalPeriods(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const periods = await this.settingsService.getFiscalPeriods(companyId);
      return periods;
    });
  }

  /**
   * GET /api/accounting/settings/:companyId/opening-balances
   * Get opening balances
   */
  async getOpeningBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string, 10);
      
      if (!fiscalYear) {
        throw { statusCode: 400, message: 'fiscalYear query parameter is required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const balances = await this.settingsService.getOpeningBalances(companyId, fiscalYear);
      return balances;
    });
  }

  /**
   * POST /api/accounting/settings/:companyId/opening-balances/import
   * Import opening balances
   */
  async importOpeningBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = req.params.companyId;
      const userId = req.user?.id;
      const { balances, fiscalYear, importSource } = req.body;
      
      if (!userId) {
        throw { statusCode: 401, message: 'User not authenticated' };
      }
      
      if (!balances || !Array.isArray(balances)) {
        throw { statusCode: 400, message: 'balances array is required' };
      }
      
      if (!fiscalYear) {
        throw { statusCode: 400, message: 'fiscalYear is required' };
      }
      
      // Verify user has access to this company
      this.verifyCompanyAccess(req, companyId);
      
      const imported = await this.settingsService.importOpeningBalances(
        companyId,
        balances,
        parseInt(fiscalYear, 10),
        importSource || 'MANUAL',
        userId
      );
      
      return imported;
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

