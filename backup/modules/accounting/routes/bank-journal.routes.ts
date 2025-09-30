import { Router } from "express";
import { BankJournalService } from "../services";
import { authGuard, roleGuard } from "../../auth/middleware/auth.middleware";
import { bankJournalService } from "..";

/**
 * Setup routes for the Romanian Bank Journal
 * Routes for managing bank transactions and reconciliations
 */
export function setupBankJournalRoutes() {
  const router = Router();
  
  // Apply authentication middleware to all bank journal routes
  router.use(authGuard);
  
  /**
   * Get all bank accounts
   */
  router.get("/accounts", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const accounts = await bankJournalService.getBankAccounts(companyId);
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get bank account by ID
   */
  router.get("/accounts/:id", async (req, res, next) => {
    try {
      const account = await bankJournalService.getBankAccount(req.params.id, req.user.companyId);
      
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      res.json(account);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create new bank account
   * Requires accountant or admin role
   */
  router.post("/accounts", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const accountData = req.body;
      
      // Add company ID
      accountData.companyId = req.user.companyId;
      
      const accountId = await bankJournalService.createBankAccount(accountData);
      const account = await bankJournalService.getBankAccount(accountId, req.user.companyId);
      
      res.status(201).json(account);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Update bank account
   * Requires accountant or admin role
   */
  router.put("/accounts/:id", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const accountId = req.params.id;
      const companyId = req.user.companyId;
      const accountData = req.body;
      
      // Check if account exists and belongs to company
      const existingAccount = await bankJournalService.getBankAccount(accountId, companyId);
      if (!existingAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      await bankJournalService.updateBankAccount(accountId, accountData, companyId);
      const updatedAccount = await bankJournalService.getBankAccount(accountId, companyId);
      
      res.json(updatedAccount);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Get bank transactions with pagination and filtering
   */
  router.get("/transactions", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const bankAccountId = req.query.bankAccountId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Optional date filters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const transactions = await bankJournalService.getBankTransactions(
        companyId,
        bankAccountId,
        page,
        limit,
        startDate,
        endDate
      );
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get bank transaction by ID
   */
  router.get("/transactions/:id", async (req, res, next) => {
    try {
      const transaction = await bankJournalService.getBankTransaction(
        req.params.id,
        req.user.companyId
      );
      
      if (!transaction) {
        return res.status(404).json({ message: "Bank transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create bank deposit transaction
   * Requires accountant or admin role
   */
  router.post("/transactions/deposits", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        depositData,
        payerInfo,
        referenceDocuments,
        notes
      } = req.body;
      
      // Add company and user information
      depositData.companyId = req.user.companyId;
      depositData.userId = req.user.id;
      
      const transactionId = await bankJournalService.createDeposit(
        depositData,
        payerInfo,
        referenceDocuments,
        notes
      );
      
      const transaction = await bankJournalService.getBankTransaction(
        transactionId,
        req.user.companyId
      );
      
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create bank payment transaction
   * Requires accountant or admin role
   */
  router.post("/transactions/payments", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        paymentData,
        beneficiaryInfo,
        referenceDocuments,
        notes
      } = req.body;
      
      // Add company and user information
      paymentData.companyId = req.user.companyId;
      paymentData.userId = req.user.id;
      
      const transactionId = await bankJournalService.createPayment(
        paymentData,
        beneficiaryInfo,
        referenceDocuments,
        notes
      );
      
      const transaction = await bankJournalService.getBankTransaction(
        transactionId,
        req.user.companyId
      );
      
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create bank transfer between own accounts
   * Requires accountant or admin role
   */
  router.post("/transactions/transfers", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        sourceBankAccountId,
        targetBankAccountId,
        date,
        amount,
        description,
        notes
      } = req.body;
      
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const transactionId = await bankJournalService.createBankTransfer(
        companyId,
        sourceBankAccountId,
        targetBankAccountId,
        date,
        amount,
        description,
        userId,
        notes
      );
      
      const transaction = await bankJournalService.getBankTransaction(
        transactionId,
        companyId
      );
      
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("not found")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Bank account statement import
   * Requires accountant or admin role
   */
  router.post("/statements/import/:bankAccountId", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const bankAccountId = req.params.bankAccountId;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const { statementData, statementFormat, statementDate } = req.body;
      
      // Check if account exists and belongs to company
      const existingAccount = await bankJournalService.getBankAccount(bankAccountId, companyId);
      if (!existingAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const result = await bankJournalService.importBankStatement(
        bankAccountId,
        companyId,
        statementData,
        statementFormat,
        new Date(statementDate),
        userId
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("format")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Bank reconciliation
   * Requires accountant or admin role
   */
  router.post("/reconciliations/:bankAccountId", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const bankAccountId = req.params.bankAccountId;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const { 
        reconciliationDate,
        bankBalance,
        transactionIds,
        notes
      } = req.body;
      
      const result = await bankJournalService.createReconciliation(
        bankAccountId,
        companyId,
        new Date(reconciliationDate),
        bankBalance,
        transactionIds,
        userId,
        notes
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("not found")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Get bank account balance as of specific date
   */
  router.get("/accounts/:id/balance", async (req, res, next) => {
    try {
      const bankAccountId = req.params.id;
      const companyId = req.user.companyId;
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
      
      const balance = await bankJournalService.getBankAccountBalanceAsOf(
        bankAccountId,
        companyId,
        asOfDate
      );
      
      res.json({ balance });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get bank account statement for a period
   */
  router.get("/accounts/:id/statement", async (req, res, next) => {
    try {
      const bankAccountId = req.params.id;
      const companyId = req.user.companyId;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      const statement = await bankJournalService.generateBankStatement(
        bankAccountId,
        companyId,
        startDate,
        endDate
      );
      
      res.json(statement);
    } catch (error: any) {
      if (error.message.includes("date")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  return router;
}