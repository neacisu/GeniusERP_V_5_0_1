/**
 * Cash Register Journal Service
 * 
 * Specialized journal service for cash register operations.
 * Handles creating and managing cash receipts and payments according to Romanian accounting standards.
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { getDrizzle } from '../../../common/drizzle';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { cashRegisters, cashTransactions, CashRegister, CashTransaction } from '../../../../shared/schema/cash-register.schema';
import { companies } from '../../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cash transaction type enum
 */
export enum CashTransactionType {
  CASH_RECEIPT = 'cash_receipt',
  CASH_PAYMENT = 'cash_payment',
  PETTY_CASH_ADVANCE = 'petty_cash_advance',
  PETTY_CASH_SETTLEMENT = 'petty_cash_settlement',
  CASH_COUNT_ADJUSTMENT = 'cash_count_adjustment',
  CASH_TRANSFER = 'cash_transfer'
}

/**
 * Cash transaction purpose enum
 */
export enum CashTransactionPurpose {
  CUSTOMER_PAYMENT = 'customer_payment',
  SUPPLIER_PAYMENT = 'supplier_payment',
  SALARY_PAYMENT = 'salary_payment',
  EXPENSE_PAYMENT = 'expense_payment',
  ADVANCE_TO_EMPLOYEE = 'advance_to_employee',
  ADVANCE_SETTLEMENT = 'advance_settlement',
  BANK_DEPOSIT = 'bank_deposit',
  CASH_WITHDRAWAL = 'cash_withdrawal',
  OTHER = 'other'
}

/**
 * Cash transaction data interface for entry creation
 */
export interface CashTransactionData {
  companyId: string;
  franchiseId?: string;
  cashRegisterId: string;
  transactionId: string;
  receiptNumber: string; // Chitanță/Dispoziție de încasare/plată
  transactionType: CashTransactionType;
  transactionPurpose: CashTransactionPurpose;
  amount: number;
  vatAmount?: number; // For fiscal receipts with VAT
  vatRate?: number; // For fiscal receipts with VAT
  currency: string;
  exchangeRate: number;
  transactionDate: Date;
  description: string;
  personId?: string; // Customer, supplier, employee ID
  personName: string; // Customer, supplier, employee name
  personIdNumber?: string; // CNP or ID card number (required for certain transactions)
  invoiceId?: string;
  invoiceNumber?: string;
  userId?: string;
  fiscalReceiptNumber?: string; // Bon fiscal number (for fiscal receipts)
  isFiscalReceipt: boolean; // Whether this is a fiscal receipt (bon fiscal)
  items?: CashTransactionItem[]; // Line items for fiscal receipts
  additionalData?: Record<string, any>; // For any additional data needed
}

/**
 * Cash transaction item for fiscal receipts
 */
export interface CashTransactionItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  grossAmount: number;
}

/**
 * Romanian accounts for cash transactions
 * These would typically come from a database, but are hardcoded for this example
 */
export const CASH_ACCOUNTS = {
  // Class 5 - Cash and Bank Accounts
  CASH_RON: '5311', // Cash in RON
  CASH_CURRENCY: '5314', // Cash in foreign currency
  PETTY_CASH: '5321', // Petty cash
  
  // Class 4 - Third Party Accounts
  CUSTOMERS: '4111', // Customer accounts
  SUPPLIERS: '401', // Supplier accounts
  EMPLOYEE_ADVANCES: '425', // Advances to employees
  EMPLOYEE_PAYROLL: '421', // Personnel - salaries payable
  VAT_COLLECTED: '4427', // VAT collected
  VAT_DEDUCTIBLE: '4426', // VAT deductible
  
  // Class 6 - Expense Accounts
  UTILITIES: '605', // Utilities expenses
  SUPPLIES: '6022', // Consumable supplies
  TRANSPORT: '624', // Transport of goods and personnel
  OTHER_SERVICES: '628', // Services performed by third parties
  
  // Class 7 - Income Accounts
  MERCHANDISE_SALES: '707', // Sale of merchandise
  SERVICE_REVENUE: '704', // Service provision
  
  // Cash transfers
  INTERNAL_TRANSFERS: '581', // Internal transfers
  
  // Cash shortages/overages accounts
  CASH_SHORTAGES: '6581', // Cash shortages
  CASH_OVERAGES: '7588', // Cash overages
  
  // Exchange Rate Accounts
  EXCHANGE_DIFF_INCOME: '765', // Foreign exchange gains
  EXCHANGE_DIFF_EXPENSE: '665', // Foreign exchange losses
};

/**
 * Cash register journal service for cash-related accounting operations
 */
export class CashRegisterService {
  private journalService: JournalService;
  
  /**
   * Constructor
   */
  constructor() {
    this.journalService = new JournalService();
  }
  
  /**
   * CRUD OPERATIONS FOR CASH REGISTERS
   */
  
  /**
   * Get all cash registers for a company
   */
  public async getCashRegisters(companyId: string): Promise<{ data: CashRegister[]; total: number }> {
    try {
      const db = getDrizzle();
      
      const result = await db
        .select()
        .from(cashRegisters)
        .where(and(
          eq(cashRegisters.companyId, companyId),
          eq(cashRegisters.isActive, true)
        ))
        .orderBy(desc(cashRegisters.createdAt));
      
      return {
        data: result,
        total: result.length
      };
    } catch (error) {
      console.error('Error getting cash registers:', error);
      throw new Error('Failed to retrieve cash registers');
    }
  }
  
  /**
   * Get a single cash register by ID
   */
  public async getCashRegister(id: string, companyId: string): Promise<CashRegister | null> {
    try {
      const db = getDrizzle();
      
      const result = await db
        .select()
        .from(cashRegisters)
        .where(and(
          eq(cashRegisters.id, id),
          eq(cashRegisters.companyId, companyId)
        ))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting cash register:', error);
      throw new Error('Failed to retrieve cash register');
    }
  }
  
  /**
   * Create a new cash register
   */
  public async createCashRegister(data: any): Promise<string> {
    try {
      const db = getDrizzle();
      const id = uuidv4();
      
      await db.insert(cashRegisters).values({
        id,
        companyId: data.companyId,
        franchiseId: data.franchiseId || null,
        name: data.name,
        code: data.code,
        type: data.type || 'main',
        location: data.location || null,
        currency: data.currency || 'RON',
        responsiblePersonId: data.responsiblePersonId || null,
        responsiblePersonName: data.responsiblePersonName || null,
        dailyLimit: data.dailyLimit ? data.dailyLimit.toString() : null,
        maxTransactionAmount: data.maxTransactionAmount ? data.maxTransactionAmount.toString() : null,
        currentBalance: '0',
        status: 'active',
        isActive: true,
        createdBy: data.userId,
      } as any);
      
      return id;
    } catch (error) {
      console.error('Error creating cash register:', error);
      throw new Error(`Failed to create cash register: ${(error as Error).message}`);
    }
  }
  
  /**
   * Update cash register
   */
  public async updateCashRegister(id: string, data: any, userId: string): Promise<void> {
    try {
      const db = getDrizzle();
      
      await db.update(cashRegisters)
        .set({
          name: data.name,
          location: data.location,
          responsiblePersonId: data.responsiblePersonId,
          responsiblePersonName: data.responsiblePersonName,
          dailyLimit: data.dailyLimit ? data.dailyLimit.toString() : undefined,
          maxTransactionAmount: data.maxTransactionAmount ? data.maxTransactionAmount.toString() : undefined,
          status: data.status,
          isActive: data.isActive,
          updatedBy: userId,
          updatedAt: new Date(),
        } as any)
        .where(and(
          eq(cashRegisters.id, id),
          eq(cashRegisters.companyId, data.companyId)
        ));
    } catch (error) {
      console.error('Error updating cash register:', error);
      throw new Error(`Failed to update cash register: ${(error as Error).message}`);
    }
  }
  
  /**
   * TRANSACTION OPERATIONS
   */
  
  /**
   * Get all cash transactions (for all registers or filtered)
   */
  public async getCashTransactions(
    companyId: string,
    registerId?: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ data: CashTransaction[]; total: number; page: number; limit: number }> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build conditions
      const conditions: any[] = [eq(cashTransactions.companyId, companyId)];
      
      if (registerId) {
        conditions.push(eq(cashTransactions.cashRegisterId, registerId));
      }
      if (startDate) {
        conditions.push(gte(cashTransactions.transactionDate, startDate));
      }
      if (endDate) {
        conditions.push(lte(cashTransactions.transactionDate, endDate));
      }
      
      const result = await db
        .select()
        .from(cashTransactions)
        .where(and(...conditions))
        .orderBy(desc(cashTransactions.transactionDate))
        .limit(limit)
        .offset(offset);
      
      const totalResult = await db
        .select()
        .from(cashTransactions)
        .where(and(...conditions));
      
      return {
        data: result,
        total: totalResult.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting cash transactions:', error);
      throw new Error('Failed to retrieve cash transactions');
    }
  }
  
  /**
   * Get cash transaction by ID
   */
  public async getCashTransaction(id: string, companyId: string): Promise<CashTransaction | null> {
    try {
      const db = getDrizzle();
      
      const result = await db
        .select()
        .from(cashTransactions)
        .where(and(
          eq(cashTransactions.id, id),
          eq(cashTransactions.companyId, companyId)
        ))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error getting cash transaction:', error);
      throw new Error('Failed to retrieve cash transaction');
    }
  }
  
  /**
   * Record cash receipt (Chitanță)
   */
  public async recordCashReceipt(data: any): Promise<string> {
    try {
      const db = getDrizzle();
      const transactionId = uuidv4();
      
      // Get current balance
      const register = await this.getCashRegister(data.cashRegisterId, data.companyId);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      const balanceBefore = Number(register.currentBalance);
      const balanceAfter = balanceBefore + Number(data.amount);
      
      // Generate document number
      const documentNumber = await this.generateReceiptNumber(data.companyId, data.cashRegisterId, false);
      
      // Insert transaction
      await db.insert(cashTransactions).values({
        id: transactionId,
        companyId: data.companyId,
        franchiseId: data.franchiseId || null,
        cashRegisterId: data.cashRegisterId,
        documentNumber,
        series: 'CH',
        number: documentNumber.split('-')[2],
        transactionType: 'cash_receipt',
        transactionPurpose: data.purpose || 'customer_payment',
        transactionDate: new Date(),
        amount: data.amount.toString(),
        vatAmount: (data.vatAmount || 0).toString(),
        vatRate: data.vatRate?.toString() || '19',
        netAmount: (data.netAmount || data.amount).toString(),
        currency: data.currency || 'RON',
        exchangeRate: (data.exchangeRate || 1).toString(),
        personName: data.personName,
        personIdNumber: data.personIdNumber || null,
        description: data.description,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        isPosted: false,
        isCanceled: false,
        createdBy: data.userId,
      } as any);
      
      // Update register balance
      await db.update(cashRegisters)
        .set({
          currentBalance: balanceAfter.toString(),
          updatedAt: new Date(),
        } as any)
        .where(eq(cashRegisters.id, data.cashRegisterId));
      
      return transactionId;
    } catch (error) {
      console.error('Error recording cash receipt:', error);
      throw new Error(`Failed to record cash receipt: ${(error as Error).message}`);
    }
  }
  
  /**
   * Record cash payment (Dispoziție de Plată)
   */
  public async recordCashPayment(data: any): Promise<string> {
    try {
      const db = getDrizzle();
      const transactionId = uuidv4();
      
      // Get current balance
      const register = await this.getCashRegister(data.cashRegisterId, data.companyId);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      const balanceBefore = Number(register.currentBalance);
      const balanceAfter = balanceBefore - Number(data.amount);
      
      if (balanceAfter < 0) {
        throw new Error('Insufficient cash balance');
      }
      
      // Generate document number
      const documentNumber = await this.generateReceiptNumber(data.companyId, data.cashRegisterId, true);
      
      // Insert transaction
      await db.insert(cashTransactions).values({
        id: transactionId,
        companyId: data.companyId,
        franchiseId: data.franchiseId || null,
        cashRegisterId: data.cashRegisterId,
        documentNumber,
        series: 'DP',
        number: documentNumber.split('-')[2],
        transactionType: 'cash_payment',
        transactionPurpose: data.purpose || 'expense_payment',
        transactionDate: new Date(),
        amount: data.amount.toString(),
        vatAmount: (data.vatAmount || 0).toString(),
        vatRate: data.vatRate?.toString() || '0',
        netAmount: (data.netAmount || data.amount).toString(),
        currency: data.currency || 'RON',
        exchangeRate: (data.exchangeRate || 1).toString(),
        personName: data.personName,
        personIdNumber: data.personIdNumber || null,
        description: data.description,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
        isPosted: false,
        isCanceled: false,
        createdBy: data.userId,
      } as any);
      
      // Update register balance
      await db.update(cashRegisters)
        .set({
          currentBalance: balanceAfter.toString(),
          updatedAt: new Date(),
        } as any)
        .where(eq(cashRegisters.id, data.cashRegisterId));
      
      return transactionId;
    } catch (error) {
      console.error('Error recording cash payment:', error);
      throw new Error(`Failed to record cash payment: ${(error as Error).message}`);
    }
  }
  
  /**
   * Transfer cash between registers
   */
  public async transferCash(data: any): Promise<{ fromTransactionId: string; toTransactionId: string }> {
    try {
      // Record payment from source register
      const fromTransactionId = await this.recordCashPayment({
        ...data,
        cashRegisterId: data.fromRegisterId,
        purpose: 'cash_withdrawal',
        description: `Transfer către ${data.toRegisterName || 'altă casă'}`,
      });
      
      // Record receipt to destination register
      const toTransactionId = await this.recordCashReceipt({
        ...data,
        cashRegisterId: data.toRegisterId,
        purpose: 'cash_withdrawal',
        description: `Transfer de la ${data.fromRegisterName || 'altă casă'}`,
      });
      
      return { fromTransactionId, toTransactionId };
    } catch (error) {
      console.error('Error transferring cash:', error);
      throw new Error(`Failed to transfer cash: ${(error as Error).message}`);
    }
  }
  
  /**
   * Record cash deposit to bank
   */
  public async recordCashDepositToBank(data: any): Promise<string> {
    try {
      return await this.recordCashPayment({
        ...data,
        purpose: 'bank_deposit',
        description: data.description || `Depunere numerar la bancă`,
      });
    } catch (error) {
      console.error('Error recording cash deposit:', error);
      throw new Error(`Failed to record cash deposit: ${(error as Error).message}`);
    }
  }
  
  /**
   * Record cash withdrawal from bank
   */
  public async recordCashWithdrawalFromBank(data: any): Promise<string> {
    try {
      return await this.recordCashReceipt({
        ...data,
        purpose: 'cash_withdrawal',
        description: data.description || `Ridicare numerar de la bancă`,
      });
    } catch (error) {
      console.error('Error recording cash withdrawal:', error);
      throw new Error(`Failed to record cash withdrawal: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get cash register balance as of date
   */
  public async getCashRegisterBalanceAsOf(cashRegisterId: string, companyId: string, asOfDate: Date): Promise<{ balance: number; currency: string }> {
    try {
      const db = getDrizzle();
      
      // Get register
      const register = await this.getCashRegister(cashRegisterId, companyId);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      // If asOfDate is today or future, return current balance
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (asOfDate >= today) {
        return {
          balance: Number(register.currentBalance),
          currency: register.currency
        };
      }
      
      // Calculate balance as of date by summing all transactions up to that date
      const transactions = await db
        .select()
        .from(cashTransactions)
        .where(and(
          eq(cashTransactions.cashRegisterId, cashRegisterId),
          lte(cashTransactions.transactionDate, asOfDate),
          eq(cashTransactions.isCanceled, false)
        ));
      
      let balance = 0;
      for (const txn of transactions) {
        if (txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal') {
          balance += Number(txn.amount);
        } else if (txn.transactionType === 'cash_payment' || txn.transactionType === 'bank_deposit') {
          balance -= Number(txn.amount);
        }
      }
      
      return {
        balance,
        currency: register.currency
      };
    } catch (error) {
      console.error('Error getting cash register balance:', error);
      throw new Error('Failed to get cash register balance');
    }
  }
  
  /**
   * Create cash register reconciliation (Închidere Casă Zilnică)
   */
  public async createReconciliation(data: any): Promise<string> {
    try {
      const db = getDrizzle();
      
      // Get register and current balance
      const register = await this.getCashRegister(data.cashRegisterId, data.companyId);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      const systemBalance = Number(register.currentBalance);
      const physicalCount = Number(data.physicalCount);
      const difference = physicalCount - systemBalance;
      
      // If there's a difference, create adjustment transaction
      if (Math.abs(difference) > 0.01) {
        const adjustmentId = uuidv4();
        
        await db.insert(cashTransactions).values({
          id: adjustmentId,
          companyId: data.companyId,
          cashRegisterId: data.cashRegisterId,
          documentNumber: `ADJ-${Date.now()}`,
          series: 'ADJ',
          number: Date.now().toString(),
          transactionType: 'cash_count_adjustment',
          transactionPurpose: 'other',
          transactionDate: new Date(),
          amount: Math.abs(difference).toString(),
          currency: register.currency,
          personName: data.userId,
          description: difference > 0 
            ? `Plus de casă: ${difference} ${register.currency}`
            : `Lipsă de casă: ${Math.abs(difference)} ${register.currency}`,
          balanceBefore: systemBalance.toString(),
          balanceAfter: physicalCount.toString(),
          notes: data.notes || null,
          createdBy: data.userId,
        } as any);
        
        // Update register balance to match physical count
        await db.update(cashRegisters)
          .set({
            currentBalance: physicalCount.toString(),
            updatedAt: new Date(),
          } as any)
          .where(eq(cashRegisters.id, data.cashRegisterId));
        
        return adjustmentId;
      }
      
      return 'no_adjustment_needed';
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      throw new Error(`Failed to create reconciliation: ${(error as Error).message}`);
    }
  }
  
  /**
   * Generate cash register report for a period
   */
  public async generateCashRegisterReport(
    companyId: string,
    cashRegisterId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const db = getDrizzle();
      
      const transactions = await db
        .select()
        .from(cashTransactions)
        .where(and(
          eq(cashTransactions.companyId, companyId),
          eq(cashTransactions.cashRegisterId, cashRegisterId),
          gte(cashTransactions.transactionDate, startDate),
          lte(cashTransactions.transactionDate, endDate),
          eq(cashTransactions.isCanceled, false)
        ))
        .orderBy(cashTransactions.transactionDate);
      
      let totalReceipts = 0;
      let totalPayments = 0;
      
      for (const txn of transactions) {
        if (txn.transactionType === 'cash_receipt' || txn.transactionType === 'bank_withdrawal') {
          totalReceipts += Number(txn.amount);
        } else if (txn.transactionType === 'cash_payment' || txn.transactionType === 'bank_deposit') {
          totalPayments += Number(txn.amount);
        }
      }
      
      return {
        cashRegisterId,
        period: { startDate, endDate },
        totalReceipts,
        totalPayments,
        netChange: totalReceipts - totalPayments,
        transactionCount: transactions.length,
        transactions
      };
    } catch (error) {
      console.error('Error generating cash register report:', error);
      throw new Error('Failed to generate cash register report');
    }
  }
  
  /**
   * Generate daily closing report (Raport de Închidere Zilnică)
   */
  public async getDailyClosingReport(
    companyId: string,
    cashRegisterId: string,
    date: Date
  ): Promise<any> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      return await this.generateCashRegisterReport(companyId, cashRegisterId, startOfDay, endOfDay);
    } catch (error) {
      console.error('Error generating daily closing report:', error);
      throw new Error('Failed to generate daily closing report');
    }
  }
  
  /**
   * Create a cash transaction entry
   * @param data Cash transaction data
   * @returns Created ledger entry
   */
  public async createCashTransactionEntry(data: CashTransactionData): Promise<LedgerEntryData> {
    const {
      companyId,
      franchiseId,
      cashRegisterId,
      transactionId,
      receiptNumber,
      transactionType,
      transactionPurpose,
      amount,
      vatAmount,
      vatRate,
      currency,
      exchangeRate,
      transactionDate,
      description,
      personId,
      personName,
      personIdNumber,
      invoiceId,
      invoiceNumber,
      userId,
      fiscalReceiptNumber,
      isFiscalReceipt,
      items
    } = data;
    
    // Create ledger lines based on transaction type and purpose
    const ledgerLines = [];
    let entryDescription = description || 'Cash transaction';
    
    // Helper to get the correct cash account based on currency
    const getCashAccount = () => currency === 'RON' ? CASH_ACCOUNTS.CASH_RON : CASH_ACCOUNTS.CASH_CURRENCY;
    
    switch (transactionType) {
      case CashTransactionType.CASH_RECEIPT:
        // Handle cash receipts (money coming into the cash register)
        switch (transactionPurpose) {
          case CashTransactionPurpose.CUSTOMER_PAYMENT:
            // Customer paying an invoice in cash
            
            // Debit cash account (Asset +)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: amount,
              creditAmount: 0,
              description: `Cash receipt: ${receiptNumber}`
            });
            
            // Credit customer account (Asset -)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.CUSTOMERS,
              debitAmount: 0,
              creditAmount: amount,
              description: `Payment from ${personName} for ${invoiceNumber || 'invoice'}`
            });
            
            entryDescription = `Cash receipt from ${personName} ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.CASH_WITHDRAWAL:
            // Cash withdrawal from bank
            
            // Debit cash account (Asset +)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: amount,
              creditAmount: 0,
              description: `Cash withdrawal: ${receiptNumber}`
            });
            
            // Credit transfer account (interim account)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.INTERNAL_TRANSFERS,
              debitAmount: 0,
              creditAmount: amount,
              description: `Bank withdrawal: ${description || 'Cash withdrawal'}`
            });
            
            entryDescription = `Cash withdrawal from bank ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.ADVANCE_SETTLEMENT:
            // Employee returning unused advance
            
            // Debit cash account (Asset +)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: amount,
              creditAmount: 0,
              description: `Advance return: ${receiptNumber}`
            });
            
            // Credit employee advances account
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.EMPLOYEE_ADVANCES,
              debitAmount: 0,
              creditAmount: amount,
              description: `Unused advance returned by ${personName}`
            });
            
            entryDescription = `Advance settlement from ${personName} ref: ${receiptNumber}`;
            break;
            
          default:
            // Other cash receipts, possibly direct cash sales
            if (isFiscalReceipt) {
              // This is a fiscal receipt with direct sales
              // Calculate totals from items
              const netTotal = items && items.length > 0 
                ? items.reduce((sum, item) => sum + item.netAmount, 0) 
                : (amount - (vatAmount || 0));
              
              const vatTotal = vatAmount || (items && items.length > 0 
                ? items.reduce((sum, item) => sum + item.vatAmount, 0) 
                : 0);
              
              // Debit cash account (Asset +)
              ledgerLines.push({
                accountId: getCashAccount(),
                debitAmount: amount,
                creditAmount: 0,
                description: `Cash sale: ${fiscalReceiptNumber || receiptNumber}`
              });
              
              // Credit merchandise/service revenue
              ledgerLines.push({
                accountId: CASH_ACCOUNTS.MERCHANDISE_SALES, // or SERVICE_REVENUE based on what was sold
                debitAmount: 0,
                creditAmount: netTotal,
                description: `Sales revenue: ${fiscalReceiptNumber || receiptNumber}`
              });
              
              // Credit VAT collected if applicable
              if (vatTotal > 0) {
                ledgerLines.push({
                  accountId: CASH_ACCOUNTS.VAT_COLLECTED,
                  debitAmount: 0,
                  creditAmount: vatTotal,
                  description: `VAT collected: ${fiscalReceiptNumber || receiptNumber}`
                });
              }
              
              entryDescription = `Cash sale: ${fiscalReceiptNumber || receiptNumber}`;
            } else {
              // Generic cash receipt without invoice
              // Debit cash account (Asset +)
              ledgerLines.push({
                accountId: getCashAccount(),
                debitAmount: amount,
                creditAmount: 0,
                description: `Cash receipt: ${receiptNumber}`
              });
              
              // Credit a suspense account that would need to be reclassified later
              ledgerLines.push({
                accountId: '473', // Settlements from operations in progress
                debitAmount: 0,
                creditAmount: amount,
                description: `Unclassified cash receipt: ${description || receiptNumber}`
              });
              
              entryDescription = `Unclassified cash receipt ref: ${receiptNumber}`;
            }
            break;
        }
        break;
        
      case CashTransactionType.CASH_PAYMENT:
        // Handle cash payments (money going out of the cash register)
        switch (transactionPurpose) {
          case CashTransactionPurpose.SUPPLIER_PAYMENT:
            // Paying a supplier in cash
            
            // Debit supplier account (Liability -)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.SUPPLIERS,
              debitAmount: amount,
              creditAmount: 0,
              description: `Payment to ${personName} for ${invoiceNumber || 'invoice'}`
            });
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash payment: ${receiptNumber}`
            });
            
            entryDescription = `Cash payment to ${personName} ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.SALARY_PAYMENT:
            // Paying salary in cash
            
            // Debit salary payable account (Liability -)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.EMPLOYEE_PAYROLL,
              debitAmount: amount,
              creditAmount: 0,
              description: `Salary payment to ${personName}`
            });
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash payment: ${receiptNumber}`
            });
            
            entryDescription = `Salary payment to ${personName} ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.EXPENSE_PAYMENT:
            // Paying for expenses directly in cash
            
            // Determine expense account
            let expenseAccount = CASH_ACCOUNTS.OTHER_SERVICES; // Default
            
            // Extract expense type from additional data if available
            const expenseType = data.additionalData?.expenseType;
            if (expenseType) {
              switch (expenseType) {
                case 'utilities':
                  expenseAccount = CASH_ACCOUNTS.UTILITIES;
                  break;
                case 'supplies':
                  expenseAccount = CASH_ACCOUNTS.SUPPLIES;
                  break;
                case 'transport':
                  expenseAccount = CASH_ACCOUNTS.TRANSPORT;
                  break;
                // Add other expense types as needed
              }
            }
            
            // Calculate net and VAT amounts
            const netAmount = vatAmount ? amount - vatAmount : amount;
            
            // Debit expense account (Expense +)
            ledgerLines.push({
              accountId: expenseAccount,
              debitAmount: netAmount,
              creditAmount: 0,
              description: `Expense: ${description || 'Cash expense'}`
            });
            
            // Debit VAT deductible if applicable
            if (vatAmount && vatAmount > 0) {
              ledgerLines.push({
                accountId: CASH_ACCOUNTS.VAT_DEDUCTIBLE,
                debitAmount: vatAmount,
                creditAmount: 0,
                description: `VAT ${vatRate}%: ${receiptNumber}`
              });
            }
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash payment: ${receiptNumber}`
            });
            
            entryDescription = `Cash expense payment ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.ADVANCE_TO_EMPLOYEE:
            // Giving cash advance to employee
            
            // Debit employee advances account (Asset +)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.EMPLOYEE_ADVANCES,
              debitAmount: amount,
              creditAmount: 0,
              description: `Advance to ${personName}`
            });
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash payment: ${receiptNumber}`
            });
            
            entryDescription = `Cash advance to ${personName} ref: ${receiptNumber}`;
            break;
            
          case CashTransactionPurpose.BANK_DEPOSIT:
            // Depositing cash to bank
            
            // Debit transfer account (interim account)
            ledgerLines.push({
              accountId: CASH_ACCOUNTS.INTERNAL_TRANSFERS,
              debitAmount: amount,
              creditAmount: 0,
              description: `Bank deposit: ${description || 'Cash deposit'}`
            });
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash deposit: ${receiptNumber}`
            });
            
            entryDescription = `Cash deposit to bank ref: ${receiptNumber}`;
            break;
            
          default:
            // Other cash payments
            // Debit a suspense account that would need to be reclassified later
            ledgerLines.push({
              accountId: '473', // Settlements from operations in progress
              debitAmount: amount,
              creditAmount: 0,
              description: `Unclassified cash payment: ${description || receiptNumber}`
            });
            
            // Credit cash account (Asset -)
            ledgerLines.push({
              accountId: getCashAccount(),
              debitAmount: 0,
              creditAmount: amount,
              description: `Cash payment: ${receiptNumber}`
            });
            
            entryDescription = `Unclassified cash payment ref: ${receiptNumber}`;
            break;
        }
        break;
        
      case CashTransactionType.PETTY_CASH_ADVANCE:
        // Handle petty cash advances
        
        // Debit petty cash account (Asset +)
        ledgerLines.push({
          accountId: CASH_ACCOUNTS.PETTY_CASH,
          debitAmount: amount,
          creditAmount: 0,
          description: `Petty cash advance: ${receiptNumber}`
        });
        
        // Credit main cash account (Asset -)
        ledgerLines.push({
          accountId: getCashAccount(),
          debitAmount: 0,
          creditAmount: amount,
          description: `Petty cash funding: ${receiptNumber}`
        });
        
        entryDescription = `Petty cash advance ref: ${receiptNumber}`;
        break;
        
      case CashTransactionType.PETTY_CASH_SETTLEMENT:
        // Handle petty cash settlements (returning unused petty cash)
        
        // Debit main cash account (Asset +)
        ledgerLines.push({
          accountId: getCashAccount(),
          debitAmount: amount,
          creditAmount: 0,
          description: `Petty cash return: ${receiptNumber}`
        });
        
        // Credit petty cash account (Asset -)
        ledgerLines.push({
          accountId: CASH_ACCOUNTS.PETTY_CASH,
          debitAmount: 0,
          creditAmount: amount,
          description: `Petty cash settlement: ${receiptNumber}`
        });
        
        entryDescription = `Petty cash settlement ref: ${receiptNumber}`;
        break;
        
      case CashTransactionType.CASH_COUNT_ADJUSTMENT:
        // Handle cash count adjustments (cash shortages or overages)
        if (amount > 0) {
          // Cash overage
          
          // Debit cash account (Asset +)
          ledgerLines.push({
            accountId: getCashAccount(),
            debitAmount: amount,
            creditAmount: 0,
            description: `Cash count adjustment: ${receiptNumber}`
          });
          
          // Credit cash overage account (Income +)
          ledgerLines.push({
            accountId: CASH_ACCOUNTS.CASH_OVERAGES,
            debitAmount: 0,
            creditAmount: amount,
            description: `Cash overage: ${description || 'Cash count adjustment'}`
          });
          
          entryDescription = `Cash count overage ref: ${receiptNumber}`;
        } else {
          // Cash shortage
          
          // Debit cash shortage account (Expense +)
          ledgerLines.push({
            accountId: CASH_ACCOUNTS.CASH_SHORTAGES,
            debitAmount: Math.abs(amount),
            creditAmount: 0,
            description: `Cash shortage: ${description || 'Cash count adjustment'}`
          });
          
          // Credit cash account (Asset -)
          ledgerLines.push({
            accountId: getCashAccount(),
            debitAmount: 0,
            creditAmount: Math.abs(amount),
            description: `Cash count adjustment: ${receiptNumber}`
          });
          
          entryDescription = `Cash count shortage ref: ${receiptNumber}`;
        }
        break;
        
      case CashTransactionType.CASH_TRANSFER:
        // Handle cash transfers between cash registers
        // This would require information about both cash registers
        // For simplicity, we're assuming just one side of the transfer
        
        if (amount > 0) {
          // Receiving cash register
          
          // Debit cash account (Asset +)
          ledgerLines.push({
            accountId: getCashAccount(),
            debitAmount: amount,
            creditAmount: 0,
            description: `Cash transfer in: ${receiptNumber}`
          });
          
          // Credit internal transfers account
          ledgerLines.push({
            accountId: CASH_ACCOUNTS.INTERNAL_TRANSFERS,
            debitAmount: 0,
            creditAmount: amount,
            description: `Transfer from other cash register: ${description || 'Cash transfer'}`
          });
          
          entryDescription = `Cash transfer in ref: ${receiptNumber}`;
        } else {
          // Sending cash register
          
          // Debit internal transfers account
          ledgerLines.push({
            accountId: CASH_ACCOUNTS.INTERNAL_TRANSFERS,
            debitAmount: Math.abs(amount),
            creditAmount: 0,
            description: `Transfer to other cash register: ${description || 'Cash transfer'}`
          });
          
          // Credit cash account (Asset -)
          ledgerLines.push({
            accountId: getCashAccount(),
            debitAmount: 0,
            creditAmount: Math.abs(amount),
            description: `Cash transfer out: ${receiptNumber}`
          });
          
          entryDescription = `Cash transfer out ref: ${receiptNumber}`;
        }
        break;
    }
    
    // If foreign currency, handle exchange rate differences
    if (currency !== 'RON' && exchangeRate !== 1) {
      // Currency conversion would be handled here
      // This would involve comparing the transaction's exchange rate
      // with the official BNR rate and recording the difference
    }
    
    // Create the ledger entry
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      franchiseId,
      type: LedgerEntryType.CASH,
      referenceNumber: receiptNumber,
      amount: Math.abs(amount),
      description: entryDescription,
      userId,
      lines: ledgerLines
    });
    
    return entry;
  }
  
  /**
   * Validate a cash transaction
   * @param transactionData Cash transaction data
   * @returns Validation result
   */
  public validateCashTransaction(transactionData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields according to Romanian standards
    if (!transactionData.transactionId) {
      errors.push('Transaction ID is required');
    }
    
    if (!transactionData.cashRegisterId) {
      errors.push('Cash register ID is required');
    }
    
    if (!transactionData.receiptNumber) {
      errors.push('Receipt number is required');
    }
    
    if (!transactionData.transactionDate) {
      errors.push('Transaction date is required');
    }
    
    if (transactionData.amount === undefined || transactionData.amount === null) {
      errors.push('Transaction amount is required');
    }
    
    if (!transactionData.transactionType) {
      errors.push('Transaction type is required');
    } else {
      // Check that transaction type is valid
      const validTypes = Object.values(CashTransactionType);
      if (!validTypes.includes(transactionData.transactionType)) {
        errors.push(`Invalid transaction type. Valid types are: ${validTypes.join(', ')}`);
      }
    }
    
    if (!transactionData.transactionPurpose) {
      errors.push('Transaction purpose is required');
    } else {
      // Check that transaction purpose is valid
      const validPurposes = Object.values(CashTransactionPurpose);
      if (!validPurposes.includes(transactionData.transactionPurpose)) {
        errors.push(`Invalid transaction purpose. Valid purposes are: ${validPurposes.join(', ')}`);
      }
    }
    
    // Additional validation for Romanian fiscal compliance
    
    // Transaction date validation
    const currentDate = new Date();
    const transactionDate = new Date(transactionData.transactionDate);
    
    // Romanian fiscal law requires cash transactions to be recorded on the same day
    const sameDayRequired = true;
    
    if (sameDayRequired) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      const txnDate = new Date(transactionDate);
      txnDate.setHours(0, 0, 0, 0);
      
      if (txnDate.getTime() !== todayDate.getTime()) {
        errors.push('Transaction date must be today according to Romanian fiscal regulations for cash operations');
      }
    }
    
    // Check for future dates which are not allowed
    if (transactionDate > currentDate) {
      errors.push('Transaction date cannot be in the future');
    }
    
    // Person information validation
    switch (transactionData.transactionType) {
      case CashTransactionType.CASH_RECEIPT:
      case CashTransactionType.CASH_PAYMENT:
        if (!transactionData.personName) {
          errors.push('Person name is required for cash receipts and payments');
        }
        
        // For certain transaction types, ID number is required by Romanian law
        if (
          (transactionData.transactionPurpose === CashTransactionPurpose.SUPPLIER_PAYMENT && transactionData.amount > 5000) ||
          (transactionData.transactionPurpose === CashTransactionPurpose.SALARY_PAYMENT)
        ) {
          if (!transactionData.personIdNumber) {
            errors.push('Person ID number (CNP/ID card) is required for this transaction type according to Romanian regulations');
          }
        }
        break;
    }
    
    // Fiscal receipt validation
    if (transactionData.isFiscalReceipt) {
      if (!transactionData.fiscalReceiptNumber) {
        errors.push('Fiscal receipt number is required for fiscal receipts');
      }
      
      // Items validation for fiscal receipts
      if (!transactionData.items || !Array.isArray(transactionData.items) || transactionData.items.length === 0) {
        errors.push('Fiscal receipts must have at least one item');
      } else {
        // Validate each item
        for (const [index, item] of transactionData.items.entries()) {
          if (!item.description) {
            errors.push(`Item #${index + 1}: Description is required`);
          }
          
          if (!item.quantity || Number(item.quantity) <= 0) {
            errors.push(`Item #${index + 1}: Quantity must be positive`);
          }
          
          if (!item.unitPrice || Number(item.unitPrice) < 0) {
            errors.push(`Item #${index + 1}: Unit price must be non-negative`);
          }
          
          // Check calculated values
          const calculatedNet = Number(item.quantity) * Number(item.unitPrice);
          if (Math.abs(calculatedNet - Number(item.netAmount)) > 0.01) {
            errors.push(`Item #${index + 1}: Net amount doesn't match quantity × unit price`);
          }
          
          const calculatedVat = Number(item.netAmount) * (Number(item.vatRate) / 100);
          if (Math.abs(calculatedVat - Number(item.vatAmount)) > 0.01) {
            errors.push(`Item #${index + 1}: VAT amount doesn't match net amount × VAT rate`);
          }
          
          const calculatedGross = Number(item.netAmount) + Number(item.vatAmount);
          if (Math.abs(calculatedGross - Number(item.grossAmount)) > 0.01) {
            errors.push(`Item #${index + 1}: Gross amount doesn't match net amount + VAT amount`);
          }
        }
        
        // Check totals
        const totalNet = transactionData.items.reduce((sum: number, item: any) => sum + Number(item.netAmount), 0);
        const totalVat = transactionData.items.reduce((sum: number, item: any) => sum + Number(item.vatAmount), 0);
        const totalGross = transactionData.items.reduce((sum: number, item: any) => sum + Number(item.grossAmount), 0);
        
        if (Math.abs(totalGross - Number(transactionData.amount)) > 0.01) {
          errors.push("Transaction amount does not match the sum of item gross amounts");
        }
        
        if (transactionData.vatAmount !== undefined && Math.abs(totalVat - Number(transactionData.vatAmount)) > 0.01) {
          errors.push("Transaction VAT amount does not match the sum of item VAT amounts");
        }
      }
      
      // VAT rate validation according to Romanian standards
      const validVatRates = [0, 5, 9, 19]; // Current Romanian VAT rates
      if (transactionData.vatRate !== undefined && !validVatRates.includes(Number(transactionData.vatRate))) {
        errors.push(`Invalid VAT rate. Valid rates in Romania are: ${validVatRates.join(', ')}%`);
      }
    }
    
    // Currency validation
    if (!transactionData.currency) {
      errors.push('Currency is required');
    } else if (transactionData.currency !== 'RON' && !transactionData.exchangeRate) {
      errors.push('Exchange rate is required for non-RON transactions');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get cash transaction entry by transaction ID
   * @param companyId Company ID
   * @param transactionId Transaction ID
   * @returns Ledger entry or null if not found
   */
  public async getCashTransactionEntryByTransactionId(companyId: string, transactionId: string): Promise<LedgerEntryData | null> {
    // This would typically involve a database query to find the ledger entry
    // associated with the transaction ID
    
    // For now, return null as this is just a placeholder
    return null;
  }
  
  /**
   * Generate a cash receipt number
   * This follows Romanian requirements for sequential numbering
   * @param companyId Company ID
   * @param cashRegisterId Cash register ID
   * @param isPayment Whether this is a payment (default: false, meaning it's a receipt)
   * @returns Generated receipt number
   */
  /**
   * Generare număr secvențial CORECT conform OMFP 2634/2015
   * Format: CH/2025/000123 sau DP/2025/000456
   */
  public async generateReceiptNumber(companyId: string, cashRegisterId: string, isPayment: boolean = false): Promise<string> {
    const db = getDrizzle();
    const year = new Date().getFullYear();
    const series = isPayment ? 'DP' : 'CH'; // CH = Chitanță, DP = Dispoziție Plată
    
    try {
      // Obține sau creează counter
      const [counter] = await db.$client.unsafe(`
        INSERT INTO document_counters (company_id, counter_type, series, year, last_number)
        VALUES ($1, 'CASH', $2, $3, 1)
        ON CONFLICT (company_id, counter_type, series, year)
        DO UPDATE SET last_number = document_counters.last_number + 1, updated_at = NOW()
        RETURNING last_number
      `, [companyId, series, year]);
      
      const number = counter.last_number.toString().padStart(6, '0');
      return `${series}/${year}/${number}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback la random dacă eșuează
      return `${series}/${year}/${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
    }
  }
}

export default CashRegisterService;