import { Response } from 'express';
import { AccountingService } from '../services/accounting.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from "@common/middleware/auth-types";

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
      const classId = req.params['classId'];
      
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
      const groupId = req.params['groupId'];
      
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
      const grade = parseInt(req.params['grade']);
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
      const syntheticId = req.params['syntheticId'];
      
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
      const id = req.params['id'];
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
      // Get account chart with optional filtering
      // TODO: getAllAccounts() nu suportă filtre - trebuie implementat getAccountChart sau filtrat manual
      return await this.accountingService.getAllAccounts();
    });
  }
  
  /**
   * Get account by ID
   */
  async getAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const accountId = req.params['id'];
      
      // TODO: getAccount nu există - folosim getAnalyticAccount (pentru conturi analitice)
      const account = await this.accountingService.getAnalyticAccount(accountId);
      
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
      
      // Folosim createAnalyticAccount pentru a crea conturi analitice
      const account = await this.accountingService.createAnalyticAccount(accountData);
      
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
      const accountId = req.params['id'];
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.accountingService.getAnalyticAccount(accountId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Account not found' };
      }
      
      // TODO: updateAccount nu există în AccountingService - trebuie implementat
      throw { statusCode: 501, message: 'Update account not implemented yet' };
    });
  }
  
  /**
   * Delete an account
   */
  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: getAccount, canDeleteAccount, deleteAccount nu există în AccountingService
      throw { statusCode: 501, message: 'Delete account functionality not implemented yet' };
    });
  }
  
  /**
   * Get general ledger
   */
  async getGeneralLedger(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: getGeneralLedger nu există în AccountingService
      throw { statusCode: 501, message: 'General ledger functionality not implemented yet' };
    });
  }
  
  /**
   * Get ledger entry by ID
   */
  async getLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params['id'];
      
      // TODO: getLedgerEntry nu există - folosim getJournalEntry cu filtrare companyId necesară
      const entry = await this.accountingService.getJournalEntry(entryId);
      // TODO: Adăugați filtrare după companyId când AccountingService suportă
      
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
      // TODO: generateTrialBalance nu există în AccountingService
      throw { statusCode: 501, message: 'Trial balance generation not implemented yet' };
    });
  }
  
  /**
   * Generate balance sheet
   */
  async getBalanceSheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: generateBalanceSheet nu există în AccountingService
      throw { statusCode: 501, message: 'Balance sheet generation not implemented yet' };
    });
  }
  
  /**
   * Generate income statement
   */
  async getIncomeStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: generateIncomeStatement nu există în AccountingService
      throw { statusCode: 501, message: 'Income statement generation not implemented yet' };
    });
  }
  
  /**
   * Get company fiscal settings
   */
  async getFiscalSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: getFiscalSettings nu există în AccountingService
      throw { statusCode: 501, message: 'Fiscal settings not implemented yet' };
    });
  }
  
  /**
   * Update company fiscal settings
   */
  async updateFiscalSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // TODO: updateFiscalSettings și getFiscalSettings nu există în AccountingService
      throw { statusCode: 501, message: 'Fiscal settings update not implemented yet' };
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

  /**
   * Get all suppliers for the company
   */
  async getSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);

      // Get suppliers from CRM companies table where isSupplier is true
      const suppliers = await this.accountingService.getSuppliers(companyId);

      return suppliers;
    });
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const supplierId = req.params['id'];

      const supplier = await this.accountingService.getSupplier(supplierId, companyId);

      if (!supplier) {
        throw { statusCode: 404, message: 'Supplier not found' };
      }

      return supplier;
    });
  }
}