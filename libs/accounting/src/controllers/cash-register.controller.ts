import { Response } from 'express';
import { BaseController } from './base.controller';
import { CashRegisterService } from '../services/cash-register.service';
import { AuthenticatedRequest } from "@common/middleware/auth-types";

/**
 * CashRegisterController
 * 
 * Handles cash register operations in the accounting system
 * Manages cash transactions, deposits, withdrawals, and reconciliations
 */
export class CashRegisterController extends BaseController {
  constructor(private readonly cashRegisterService: CashRegisterService) {
    super();
  }
  
  /**
   * Get all cash registers for a company
   * GET /api/accounting/cash-register/registers
   */
  async getCashRegisters(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      return await this.cashRegisterService.getCashRegisters(companyId);
    });
  }
  
  /**
   * Get cash register by ID
   * GET /api/accounting/cash-register/registers/:id
   */
  async getCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['id'];
      const companyId = this.getCompanyId(req);
      
      const register = await this.cashRegisterService.getCashRegister(registerId, companyId);
      
      if (!register) {
        throw {
          statusCode: 404,
          message: "Cash register not found"
        };
      }
      
      return register;
    });
  }
  
  /**
   * Create new cash register
   * POST /api/accounting/cash-register/registers
   */
  async createCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerData = req.body;
      
      // Add company ID
      registerData.companyId = this.getCompanyId(req);
      
      try {
        const registerId = await this.cashRegisterService.createCashRegister(registerData);
        const register = await this.cashRegisterService.getCashRegister(registerId, registerData.companyId);
        
        return {
          ...register,
          message: "Cash register created successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.includes("validation")) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Update cash register
   * PUT /api/accounting/cash-register/registers/:id
   */
  async updateCashRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['id'];
      const companyId = this.getCompanyId(req);
      const registerData = req.body;
      
      try {
        // Check if register exists and belongs to company
        const existingRegister = await this.cashRegisterService.getCashRegister(registerId, companyId);
        if (!existingRegister) {
          throw {
            statusCode: 404,
            message: "Cash register not found"
          };
        }
        
        await this.cashRegisterService.updateCashRegister(registerId, registerData, companyId);
        const updatedRegister = await this.cashRegisterService.getCashRegister(registerId, companyId);
        
        return {
          ...updatedRegister,
          message: "Cash register updated successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.includes("validation")) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Get all cash transactions (for all registers)
   * GET /api/accounting/cash/cash-transactions
   */
  async getAllCashTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      
      // Optional filters
      const registerId = req.query['registerId'] as string;
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
      
      return await this.cashRegisterService.getCashTransactions(
        companyId,
        registerId,
        page,
        limit,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get cash transactions for a specific register
   * GET /api/accounting/cash/cash-registers/:id/transactions
   */
  async getCashTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const registerId = req.params['id']; // From URL params
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      
      // Optional date filters
      const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
      const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
      
      return await this.cashRegisterService.getCashTransactions(
        companyId,
        registerId,
        page,
        limit,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get cash transaction by ID
   * GET /api/accounting/cash-register/transactions/:id
   */
  async getCashTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const transactionId = req.params['id'];
      const companyId = this.getCompanyId(req);
      
      const transaction = await this.cashRegisterService.getCashTransaction(
        transactionId,
        companyId
      );
      
      if (!transaction) {
        throw {
          statusCode: 404,
          message: "Cash transaction not found"
        };
      }
      
      return transaction;
    });
  }
  
  /**
   * Record cash receipt
   * POST /api/accounting/cash-register/transactions/receipts
   */
  async recordCashReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        receiptData,
        payerInfo,
        notes
      } = req.body;
      
      try {
        // Add company and user information
        const data = {
          ...receiptData,
          companyId: this.getCompanyId(req),
          userId: this.getUserId(req),
          personName: payerInfo?.name || 'Unknown',
          personIdNumber: payerInfo?.idNumber,
          description: notes || receiptData.description || 'Cash receipt'
        };
        
        const transactionId = await this.cashRegisterService.recordCashReceipt(data);
        
        const transaction = await this.cashRegisterService.getCashTransaction(
          transactionId,
          data.companyId
        );
        
        return {
          ...transaction,
          message: "Cash receipt recorded successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.includes("validation")) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Record cash payment
   * POST /api/accounting/cash-register/transactions/payments
   */
  async recordCashPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        paymentData,
        payeeInfo,
        notes
      } = req.body;
      
      try {
        // Add company and user information
        const data = {
          ...paymentData,
          companyId: this.getCompanyId(req),
          userId: this.getUserId(req),
          personName: payeeInfo?.name || 'Unknown',
          personIdNumber: payeeInfo?.idNumber,
          description: notes || paymentData.description || 'Cash payment'
        };
        
        const transactionId = await this.cashRegisterService.recordCashPayment(data);
        
        const transaction = await this.cashRegisterService.getCashTransaction(
          transactionId,
          data.companyId
        );
        
        return {
          ...transaction,
          message: "Cash payment recorded successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.includes("validation")) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Transfer money between cash registers
   * POST /api/accounting/cash-register/transactions/transfers
   */
  async transferCash(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        sourceRegisterId,
        targetRegisterId,
        amount,
        description
      } = req.body;
      
      try {
        const companyId = this.getCompanyId(req);
        const userId = this.getUserId(req);
        
        const data = {
          companyId,
          userId,
          fromRegisterId: sourceRegisterId,
          toRegisterId: targetRegisterId,
          amount,
          description: description || 'Cash transfer',
          personName: 'Internal Transfer'
        };
        
        const result = await this.cashRegisterService.transferCash(data);
        
        return {
          fromTransactionId: result.fromTransactionId,
          toTransactionId: result.toTransactionId,
          message: "Cash transfer recorded successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && (err.message.includes("validation") || err.message.includes("not found"))) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Record cash deposit from cash register to bank
   * POST /api/accounting/cash-register/transactions/bank-deposits
   */
  async recordCashDepositToBank(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        registerId,
        amount,
        description,
        referenceNumber
      } = req.body;
      
      try {
        const companyId = this.getCompanyId(req);
        const userId = this.getUserId(req);
        
        const data = {
          companyId,
          userId,
          cashRegisterId: registerId,
          amount,
          description: description || 'Depunere numerar la bancă',
          personName: referenceNumber || 'Bank Deposit'
        };
        
        const { cashTransactionId } = await this.cashRegisterService.recordCashDepositToBank(data);
        
        const deposit = await this.cashRegisterService.getCashTransaction(
          cashTransactionId,
          companyId
        );
        
        return {
          ...deposit,
          message: "Cash deposit to bank recorded successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && (err.message.includes("validation") || err.message.includes("not found"))) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Record cash withdrawal from bank to cash register
   * POST /api/accounting/cash-register/transactions/bank-withdrawals
   */
  async recordCashWithdrawalFromBank(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        registerId,
        amount,
        description,
        referenceNumber
      } = req.body;
      
      try {
        const companyId = this.getCompanyId(req);
        const userId = this.getUserId(req);
        
        const data = {
          companyId,
          userId,
          cashRegisterId: registerId,
          amount,
          description: description || 'Ridicare numerar de la bancă',
          personName: referenceNumber || 'Bank Withdrawal'
        };
        
        const { cashTransactionId } = await this.cashRegisterService.recordCashWithdrawalFromBank(data);
        
        const withdrawal = await this.cashRegisterService.getCashTransaction(
          cashTransactionId,
          companyId
        );
        
        return {
          ...withdrawal,
          message: "Cash withdrawal from bank recorded successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && (err.message.includes("validation") || err.message.includes("not found"))) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Cash register reconciliation
   * POST /api/accounting/cash-register/reconciliations/:registerId
   */
  async createReconciliation(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['registerId'];
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const { 
        physicalCount,
        notes
      } = req.body;
      
      try {
        const data = {
          companyId,
          userId,
          cashRegisterId: registerId,
          physicalCount,
          notes
        };
        
        const reconciliationId = await this.cashRegisterService.createReconciliation(data);
        
        return {
          reconciliationId,
          message: reconciliationId === 'no_adjustment_needed'
            ? "No adjustment needed - balance matches"
            : "Cash register reconciliation completed successfully"
        };
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && (err.message.includes("validation") || err.message.includes("not found"))) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Get cash register balance as of specific date
   * GET /api/accounting/cash-register/registers/:id/balance
   */
  async getCashRegisterBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['id'];
      const companyId = this.getCompanyId(req);
      const asOfDate = req.query['asOfDate'] ? new Date(req.query['asOfDate'] as string) : new Date();
      
      const balance = await this.cashRegisterService.getCashRegisterBalanceAsOf(
        registerId,
        companyId,
        asOfDate
      );
      
      return { balance };
    });
  }
  
  /**
   * Generate cash register report for a period
   * GET /api/accounting/cash-register/registers/:id/report
   */
  async generateCashRegisterReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['id'];
      const companyId = this.getCompanyId(req);
      
      try {
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);
        
        const report = await this.cashRegisterService.generateCashRegisterReport(
          registerId,
          companyId,
          startDate,
          endDate
        );
        
        return report;
      } catch (error: unknown) {
        const err = error as { message?: string };
        if (err.message && err.message.includes("date")) {
          throw {
            statusCode: 400,
            message: err.message
          };
        }
        
        throw error;
      }
    });
  }
  
  /**
   * Get daily closing report for a cash register
   * GET /api/accounting/cash-register/registers/:id/daily-closing
   */
  async getDailyClosingReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const registerId = req.params['id'];
      const companyId = this.getCompanyId(req);
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
      
      const report = await this.cashRegisterService.getDailyClosingReport(
        registerId,
        companyId,
        date
      );
      
      return report;
    });
  }
  
  /**
   * Get daily cash report with caching (ASYNC)
   */
  async getDailyCashReportCached(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { cashRegisterId, date } = req.query;
      
      if (!cashRegisterId) {
        throw new Error('Cash register ID is required');
      }
      
      const reportDate = date ? new Date(date as string) : new Date();
      
      return await this.cashRegisterService.getDailyCashReportCached(
        companyId,
        cashRegisterId as string,
        reportDate,
        true // use cache
      );
    });
  }
  
  /**
   * Queue cash reconciliation (ASYNC)
   */
  async reconcileCashRegisterAsync(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = req.user?.id || '';
      const { cashRegisterId, startDate, endDate } = req.body;
      
      if (!cashRegisterId || !startDate || !endDate) {
        throw new Error('Cash register ID, start date, and end date are required');
      }
      
      return await this.cashRegisterService.reconcileCashRegisterAsync(
        companyId,
        cashRegisterId,
        startDate,
        endDate,
        userId
      );
    });
  }
}