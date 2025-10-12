import { Request, Response } from 'express';
import { BankJournalService } from '../services/bank-journal.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * BankJournalController
 * 
 * Handles all bank account operations including deposits, payments,
 * transfers, and reporting for the romanian accounting system
 */
export class BankJournalController extends BaseController {
  /**
   * Constructor
   */
  constructor(private bankJournalService: BankJournalService) {
    super();
  }
  
  /**
   * Get all bank accounts
   */
  async getBankAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      return await this.bankJournalService.getBankAccounts(companyId);
    });
  }
  
  /**
   * Get bank account by ID
   */
  async getBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      const account = await this.bankJournalService.getBankAccount(accountId, companyId);
      
      if (!account) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      return account;
    });
  }
  
  /**
   * Create bank account
   */
  async createBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const accountData = { ...req.body, companyId, userId };
      
      const accountId = await this.bankJournalService.createBankAccount(accountData);
      const account = await this.bankJournalService.getBankAccount(accountId, companyId);
      
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
   * Update bank account
   */
  async updateBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      // Update account data
      const accountData = { 
        ...req.body
      };
      
      await this.bankJournalService.updateBankAccount(accountId, companyId, accountData);
      const updatedAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      
      return updatedAccount;
    });
  }
  
  /**
   * Get bank transactions with pagination and filtering
   */
  async getBankTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const accountId = req.query.accountId as string;
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      const type = req.query.type as string;
      
      return await this.bankJournalService.getBankTransactions(
        companyId,
        page,
        limit,
        accountId,
        startDate,
        endDate,
        type
      );
    });
  }
  
  /**
   * Get bank transaction by ID
   */
  async getBankTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const transactionId = req.params.id;
      
      const transaction = await this.bankJournalService.getBankTransaction(transactionId, companyId);
      
      if (!transaction) {
        throw { statusCode: 404, message: 'Bank transaction not found' };
      }
      
      return transaction;
    });
  }
  
  /**
   * Create bank deposit
   */
  async createDeposit(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      const depositData = { 
        ...req.body, 
        companyId, 
        userId,
        accountId
      };
      
      const transactionId = await this.bankJournalService.createDeposit(depositData);
      const transaction = await this.bankJournalService.getBankTransaction(transactionId, companyId);
      
      if (!transaction) {
        throw { 
          statusCode: 500, 
          message: 'Deposit was recorded but could not be retrieved' 
        };
      }
      
      return transaction;
    });
  }
  
  /**
   * Create bank payment
   */
  async createPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      const paymentData = { 
        ...req.body, 
        companyId, 
        userId,
        accountId
      };
      
      const transactionId = await this.bankJournalService.createPayment(paymentData);
      const transaction = await this.bankJournalService.getBankTransaction(transactionId, companyId);
      
      if (!transaction) {
        throw { 
          statusCode: 500, 
          message: 'Payment was recorded but could not be retrieved' 
        };
      }
      
      return transaction;
    });
  }
  
  /**
   * Create bank transfer between accounts
   */
  async createBankTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const fromAccountId = req.params.id;
      const { toAccountId } = req.body;
      
      // Verify that both accounts exist and belong to the company
      const fromAccount = await this.bankJournalService.getBankAccount(fromAccountId, companyId);
      const toAccount = await this.bankJournalService.getBankAccount(toAccountId, companyId);
      
      if (!fromAccount) {
        throw { statusCode: 404, message: 'Source bank account not found' };
      }
      
      if (!toAccount) {
        throw { statusCode: 404, message: 'Destination bank account not found' };
      }
      
      const transferData = { 
        ...req.body, 
        companyId, 
        userId,
        fromAccountId,
        toAccountId
      };
      
      const { fromTxn, toTxn } = await this.bankJournalService.createBankTransfer(transferData);
      
      const sourceTransaction = await this.bankJournalService.getBankTransaction(fromTxn, companyId);
      const destinationTransaction = await this.bankJournalService.getBankTransaction(toTxn, companyId);
      
      if (!sourceTransaction || !destinationTransaction) {
        throw { 
          statusCode: 500, 
          message: 'Transfer was recorded but transactions could not be retrieved' 
        };
      }
      
      return {
        sourceTransaction,
        destinationTransaction
      };
    });
  }
  
  /**
   * Import bank statement
   */
  async importBankStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      // @ts-ignore - req.file comes from multer middleware
      if (!req.file) {
        throw { statusCode: 400, message: 'No file uploaded' };
      }
      
      // @ts-ignore - req.file comes from multer middleware
      const { path } = req.file;
      const { format, dateFormat, transactions } = req.body;
      
      const importResult = await this.bankJournalService.importBankStatement({
        bankAccountId: accountId,
        companyId,
        filePath: path,
        format,
        dateFormat,
        transactions
      });
      
      return importResult;
    });
  }
  
  /**
   * Create bank reconciliation
   */
  async createReconciliation(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      const reconciliationData = {
        ...req.body,
        companyId,
        userId,
        accountId
      };
      
      const result = await this.bankJournalService.createReconciliation(reconciliationData);
      
      return result;
    });
  }
  
  /**
   * Get bank account balance as of a specific date
   */
  async getBankAccountBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Parse the "as of" date parameter
      const asOfDate = this.parseDate(req.query.asOfDate as string) || new Date();
      
      return await this.bankJournalService.getBankAccountBalanceAsOf(
        accountId,
        companyId,
        asOfDate
      );
    });
  }
  
  /**
   * Generate bank statement for a date range
   */
  async generateBankStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const accountId = req.params.id;
      
      // Verify that the account exists and belongs to the company
      const existingAccount = await this.bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        throw { statusCode: 404, message: 'Bank account not found' };
      }
      
      // Parse date parameters
      const startDate = this.parseDate(req.query.startDate as string) || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      
      return await this.bankJournalService.generateBankStatement(
        accountId,
        companyId,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get all bank accounts with balances
   */
  async getBankAccountsWithBalances(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      return await this.bankJournalService.getBankAccountsWithBalances(companyId);
    });
  }
}