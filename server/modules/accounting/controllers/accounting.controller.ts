import { Request, Response } from 'express';
import { AccountingService } from '../services/accounting.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * AccountingController
 * 
 * Handles all main accounting operations
 * Serves as the interface between routes and the accounting service
 */
export class AccountingController extends BaseController {
  /**
   * Constructor
   */
  constructor(private accountingService: AccountingService) {
    super();
  }
  
  /**
   * Get all account classes
   */
  async getAccountClasses(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getAccountClasses();
    });
  }
  
  /**
   * Get all account groups
   */
  async getAccountGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getAccountGroups();
    });
  }
  
  /**
   * Get account groups by class ID
   */
  async getAccountGroupsByClass(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const classId = req.params.classId;
      
      // Verificăm dacă classId este un UUID valid sau un cod de clasă
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(classId);
      
      if (isUuid) {
        // Dacă este UUID, folosim direct
        return await this.accountingService.getAccountGroupsByClass(classId);
      } else {
        // Dacă este cod, căutăm UUID-ul
        const classes = await this.accountingService.getAccountClasses();
        const foundClass = classes.find(c => c.code === classId);
        
        if (!foundClass) {
          throw { statusCode: 404, message: 'Account class not found' };
        }
        
        return await this.accountingService.getAccountGroupsByClass(foundClass.id);
      }
    });
  }
  
  /**
   * Get all synthetic accounts
   */
  async getSyntheticAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getSyntheticAccounts();
    });
  }
  
  /**
   * Get synthetic accounts by group ID
   */
  async getSyntheticAccountsByGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const groupId = req.params.groupId;
      
      // Verificăm dacă groupId este un UUID valid sau un cod de grupă
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(groupId);
      
      if (isUuid) {
        // Dacă este UUID, folosim direct
        return await this.accountingService.getSyntheticAccountsByGroup(groupId);
      } else {
        // Dacă este cod, căutăm UUID-ul
        const groups = await this.accountingService.getAccountGroups();
        const foundGroup = groups.find(g => g.code === groupId);
        
        if (!foundGroup) {
          throw { statusCode: 404, message: 'Account group not found' };
        }
        
        return await this.accountingService.getSyntheticAccountsByGroup(foundGroup.id);
      }
    });
  }
  
  /**
   * Get synthetic accounts by grade
   */
  async getSyntheticAccountsByGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const grade = parseInt(req.params.grade);
      return await this.accountingService.getSyntheticAccountsByGrade(grade);
    });
  }
  
  /**
   * Get all analytic accounts
   */
  async getAnalyticAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getAnalyticAccounts();
    });
  }
  
  /**
   * Get analytic accounts by synthetic ID
   */
  async getAnalyticAccountsBySynthetic(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const syntheticId = req.params.syntheticId;
      
      // Verificăm dacă syntheticId este un UUID valid sau un cod de cont
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(syntheticId);
      
      if (isUuid) {
        // Dacă este UUID, folosim direct
        return await this.accountingService.getAnalyticAccountsBySynthetic(syntheticId);
      } else {
        // Dacă este cod, căutăm UUID-ul
        const syntheticAccounts = await this.accountingService.getSyntheticAccounts();
        const foundAccount = syntheticAccounts.find(sa => sa.code === syntheticId);
        
        if (!foundAccount) {
          throw { statusCode: 404, message: 'Synthetic account not found' };
        }
        
        return await this.accountingService.getAnalyticAccountsBySynthetic(foundAccount.id);
      }
    });
  }
  
  /**
   * Get all accounts (from the legacy accounts table)
   * Used for dropdowns and selects in forms
   */
  async getAllAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getAllAccounts();
    });
  }
  
  /**
   * Get all journal entries
   */
  async getJournalEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      return await this.accountingService.getJournalEntries();
    });
  }
  
  /**
   * Get journal entry by ID
   */
  async getJournalEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const id = req.params.id;
      return await this.accountingService.getJournalEntry(id);
    });
  }
  
  /**
   * Create a new journal entry
   */
  async createJournalEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { entry, lines } = req.body;
      return await this.accountingService.createJournalEntry(entry, lines);
    });
  }
  
  /**
   * Get account chart (plan de conturi)
   */
  async getAccountChart(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Get account chart with optional filtering
      const includeInactive = req.query.includeInactive === 'true';
      const type = req.query.type as string;
      
      return await this.accountingService.getAccountChart(companyId, includeInactive, type);
    });
  }
  
  /**
   * Get account by ID
   */
  async getAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      const account = await this.accountingService.getAccount(accountId, companyId);
      
      if (!account) {
        throw { statusCode: 404, message: 'Account not found' };
      }
      
      return account;
    });
  }
  
  /**
   * Create a new account
   */
  async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const accountData = { ...req.body, companyId, createdBy: userId };
      
      const accountId = await this.accountingService.createAccount(accountData);
      const account = await this.accountingService.getAccount(accountId, companyId);
      
      if (!account) {
        throw { 
          statusCode: 500, 
          message: 'Account was created but could not be retrieved' 
        };
      }
      
      return account;
    });
  }
  
  /**
   * Update an account
   */
  async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.accountingService.getAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Account not found' };
      }
      
      const accountData = { 
        ...req.body, 
        id: accountId,
        companyId 
      };
      
      await this.accountingService.updateAccount(accountData);
      const updatedAccount = await this.accountingService.getAccount(accountId, companyId);
      
      return updatedAccount;
    });
  }
  
  /**
   * Delete an account
   */
  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.accountingService.getAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Account not found' };
      }
      
      // Check if the account can be deleted
      const canDelete = await this.accountingService.canDeleteAccount(accountId, companyId);
      if (!canDelete.canDelete) {
        throw { 
          statusCode: 400, 
          message: `Cannot delete account. ${canDelete.reason}` 
        };
      }
      
      await this.accountingService.deleteAccount(accountId, companyId);
      
      return { success: true, message: 'Account deleted successfully' };
    });
  }
  
  /**
   * Get general ledger
   */
  async getGeneralLedger(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      const accountId = req.query.accountId as string;
      
      return await this.accountingService.getGeneralLedger(
        companyId,
        page,
        limit,
        startDate,
        endDate,
        accountId
      );
    });
  }
  
  /**
   * Get ledger entry by ID
   */
  async getLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const entryId = req.params.id;
      
      const entry = await this.accountingService.getLedgerEntry(entryId, companyId);
      
      if (!entry) {
        throw { statusCode: 404, message: 'Ledger entry not found' };
      }
      
      return entry;
    });
  }
  
  /**
   * Generate financial statements (trial balance)
   */
  async getTrialBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const asOfDate = this.parseDate(req.query.asOfDate as string) || new Date();
      
      return await this.accountingService.generateTrialBalance(
        companyId,
        asOfDate
      );
    });
  }
  
  /**
   * Generate balance sheet
   */
  async getBalanceSheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const asOfDate = this.parseDate(req.query.asOfDate as string) || new Date();
      const compareToDate = this.parseDate(req.query.compareToDate as string);
      
      return await this.accountingService.generateBalanceSheet(
        companyId,
        asOfDate,
        compareToDate
      );
    });
  }
  
  /**
   * Generate income statement
   */
  async getIncomeStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      const compareStartDate = this.parseDate(req.query.compareStartDate as string);
      const compareEndDate = this.parseDate(req.query.compareEndDate as string);
      
      return await this.accountingService.generateIncomeStatement(
        companyId,
        startDate,
        endDate,
        compareStartDate,
        compareEndDate
      );
    });
  }
  
  /**
   * Get company fiscal settings
   */
  async getFiscalSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      return await this.accountingService.getFiscalSettings(companyId);
    });
  }
  
  /**
   * Update company fiscal settings
   */
  async updateFiscalSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      const settingsData = { ...req.body, companyId };
      
      await this.accountingService.updateFiscalSettings(settingsData);
      return await this.accountingService.getFiscalSettings(companyId);
    });
  }
  
  /**
   * Create an analytic account
   */
  async createAnalyticAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      // Remapăm parentId la syntheticId care este cerut de schema bazei de date
      const { parentId, ...restData } = req.body;
      const accountData = { 
        ...restData, 
        syntheticId: parentId, // Remapăm parentId la syntheticId
        companyId, 
        createdBy: userId 
      };
      
      // Use the storage directly for analytic accounts
      const analyticAccount = await this.accountingService.createAnalyticAccount(accountData);
      
      return analyticAccount;
    });
  }
}