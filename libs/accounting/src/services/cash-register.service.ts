/**
 * Cash Register Journal Service
 * 
 * Specialized journal service for cash register operations.
 * Handles creating and managing cash receipts and payments according to Romanian accounting standards.
 * 
 * ENHANCED WITH:
 * - Redis caching for daily cash reports
 * - BullMQ async processing for reconciliations
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { getDrizzle } from "@common/drizzle";
import { and, desc, eq, gte, lte, SQL, sql } from 'drizzle-orm';
import { AC_cash_registers, AC_cash_transactions, CashRegister, CashTransaction } from '@geniuserp/shared/schema/cash-register.schema';
import { document_counters } from '@geniuserp/shared/schema/document-counters.schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogService } from './audit-log.service';
import { accountingQueueService } from './accounting-queue.service';
import { RedisService } from '@common/services/redis.service';
import {
  CashRegisterWithClosing,
  CreateCashRegisterData,
  UpdateCashRegisterData,
  RecordCashReceiptData,
  RecordCashPaymentData,
  TransferCashData,
  CashDepositToBankData,
  CashWithdrawalFromBankData,
  CreateReconciliationData,
  CashTransactionAdditionalData,
  CashRegisterReport,
  DailyClosingResult,
  CashRegisterBalance,
  CashRegisterListResponse,
  CashTransactionsListResponse,
  CashTransferResult,
  BankTransactionResult,
  ReconciliationJobResult,
  TransactionValidationResult,
  CashTransactionItem
} from '../types/cash-register-types';

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
  company_id: string;
  franchise_id?: string;
  cash_register_id: string;
  transaction_id: string;
  receipt_number: string;
  transaction_type: CashTransactionType;
  transaction_purpose: CashTransactionPurpose;
  amount: number;
  vat_amount?: number;
  vat_rate?: number;
  currency: string;
  exchange_rate: number;
  transaction_date: Date;
  description: string;
  person_id?: string;
  person_name: string;
  person_id_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  userId?: string;
  fiscal_receipt_number?: string;
  is_fiscal_receipt: boolean;
  items?: CashTransactionItem[];
  additional_data?: CashTransactionAdditionalData;
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
  private auditService: AuditLogService; // RECOMANDARE 4
  
  /**
   * Constructor
   */
  constructor() {
    this.journalService = new JournalService();
    this.auditService = new AuditLogService(); // RECOMANDARE 4
  }
  
  /**
   * CRUD OPERATIONS FOR CASH REGISTERS
   */
  
  /**
   * Get all cash registers for a company
   */
  public async getCashRegisters(companyId: string): Promise<CashRegisterListResponse> {
    try {
      const db = getDrizzle();
      
      const result = await db
        .select()
        .from(AC_cash_registers)
        .where(and(
          eq(AC_cash_registers.company_id, companyId),
          eq(AC_cash_registers.is_active, true)
        ))
        .orderBy(desc(AC_cash_registers.created_at));
      
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
        .from(AC_cash_registers)
        .where(and(
          eq(AC_cash_registers.id, id),
          eq(AC_cash_registers.company_id, companyId)
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
  public async createCashRegister(data: CreateCashRegisterData): Promise<string> {
    try {
      const db = getDrizzle();
      const id = uuidv4();
      
      await db.insert(AC_cash_registers).values({
        id,
        company_id: data.company_id,
        franchise_id: data.franchise_id || null,
        name: data.name,
        code: data.code,
        type: data.type || 'main',
        location: data.location || null,
        currency: data.currency || 'RON',
        responsible_person_id: data.responsible_person_id || null,
        responsible_person_name: data.responsible_person_name || null,
        daily_limit: data.daily_limit ? data.daily_limit.toString() : null,
        max_transaction_amount: data.max_transaction_amount ? data.max_transaction_amount.toString() : null,
        current_balance: '0',
        status: 'active',
        is_active: true,
        created_by: data.userId,
      });
      
      return id;
    } catch (error) {
      console.error('Error creating cash register:', error);
      throw new Error(`Failed to create cash register: ${(error as Error).message}`);
    }
  }
  
  /**
   * Update cash register
   */
  public async updateCashRegister(id: string, data: UpdateCashRegisterData, userId: string): Promise<void> {
    try {
      const db = getDrizzle();
      
      await db.update(AC_cash_registers)
        .set({
          name: data.name,
          location: data.location,
          responsible_person_id: data.responsible_person_id,
          responsible_person_name: data.responsible_person_name,
          daily_limit: data.daily_limit ? data.daily_limit.toString() : undefined,
          max_transaction_amount: data.max_transaction_amount ? data.max_transaction_amount.toString() : undefined,
          status: data.status,
          is_active: data.is_active,
          updated_by: userId,
          updated_at: new Date(),
        })
        .where(and(
          eq(AC_cash_registers.id, id),
          eq(AC_cash_registers.company_id, data.company_id)
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
  ): Promise<CashTransactionsListResponse> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build conditions
      const conditions: SQL[] = [eq(AC_cash_transactions.company_id, companyId)];
      
      if (registerId) {
        conditions.push(eq(AC_cash_transactions.cash_register_id, registerId));
      }
      if (startDate) {
        conditions.push(gte(AC_cash_transactions.transaction_date, startDate));
      }
      if (endDate) {
        conditions.push(lte(AC_cash_transactions.transaction_date, endDate));
      }
      
      const result = await db
        .select()
        .from(AC_cash_transactions)
        .where(and(...conditions))
        .orderBy(desc(AC_cash_transactions.transaction_date))
        .limit(limit)
        .offset(offset);
      
      const totalResult = await db
        .select()
        .from(AC_cash_transactions)
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
        .from(AC_cash_transactions)
        .where(and(
          eq(AC_cash_transactions.id, id),
          eq(AC_cash_transactions.company_id, companyId)
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
  public async recordCashReceipt(data: RecordCashReceiptData): Promise<string> {
    try {
      const db = getDrizzle();
      const transactionId = uuidv4();
      
      // Get current balance
      const register = await this.getCashRegister(data.cash_register_id, data.company_id);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      // PAS 5: Verifică dacă registrul este activ
      if (register.status !== 'active') {
        throw new Error('Registrul de casă nu este activ');
      }
      
      // PAS 5: Verifică dacă ziua curentă este închisă
      const registerWithClosing = register as CashRegisterWithClosing;
      if (registerWithClosing.lastClosedDate) {
        const lastClosed = new Date(registerWithClosing.lastClosedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (today <= lastClosed) {
          throw new Error('Registrul de casă pentru ziua curentă este închis. Nu mai puteți adăuga tranzacții. Operațiunile corective se fac prin tranzacții de ajustare în zile ulterioare.');
        }
      }
      
      // PAS 2: VALIDARE PLAFOANE Legea 70/2015
      if (register.max_transaction_amount && Number(data.amount) > Number(register.max_transaction_amount)) {
        throw new Error(`Suma depășește plafonul maxim per tranzacție (${register.max_transaction_amount} Lei). Conform Legii 70/2015, fragmentați tranzacția sau folosiți banca.`);
      }
      
      const balanceBefore = Number(register.current_balance);
      const balanceAfter = balanceBefore + Number(data.amount);
      
      // Verificare plafon zilnic (50,000 Lei)
      if (register.daily_limit && balanceAfter > Number(register.daily_limit)) {
        console.warn(`ATENȚIE: Soldul casieriei (${balanceAfter} Lei) depășește plafonul zilnic (${register.daily_limit} Lei). Depuneți excedentul la bancă în max 2 zile conform Legii 70/2015.`);
      }
      
      // Generate document number
      const documentNumber = await this.generateReceiptNumber(data.company_id, data.cash_register_id, false);
      
      // Insert transaction
      await db.insert(AC_cash_transactions).values({
        id: transactionId,
        company_id: data.company_id,
        franchise_id: data.franchise_id || null,
        cash_register_id: data.cash_register_id,
        document_number: documentNumber,
        series: 'CH',
        number: documentNumber.split('/')[2], // Folosește / ca separator
        transaction_type: 'cash_receipt',
        transaction_purpose: (data.purpose || 'customer_payment') as typeof AC_cash_transactions.$inferInsert.transaction_purpose,
        transaction_date: new Date(),
        amount: data.amount.toString(),
        vat_amount: (data.vat_amount || 0).toString(),
        vat_rate: data.vat_rate?.toString() || '19',
        net_amount: (data.net_amount || data.amount).toString(),
        currency: data.currency || 'RON',
        exchange_rate: (data.exchange_rate || 1).toString(),
        person_name: data.person_name,
        person_id_number: data.person_id_number || null,
        person_id: data.person_id || null,
        invoice_id: data.invoice_id || null,
        invoice_number: data.invoice_number || null,
        description: data.description,
        balance_before: balanceBefore.toString(),
        balance_after: balanceAfter.toString(),
        is_posted: false,
        is_canceled: false,
        created_by: data.userId,
      });
      
      // RECOMANDARE 5: Update atomic pentru prevenție race condition  
      // Folosim Drizzle ORM cu sql pentru update atomic
      await db.update(AC_cash_registers)
        .set({
          current_balance: sql`${AC_cash_registers.current_balance} + ${Number(data.amount)}`,
          updated_at: new Date(),
        })
        .where(eq(AC_cash_registers.id, data.cash_register_id));
      
      // PAS 3: POSTARE AUTOMATĂ ÎN CONTABILITATE pentru ÎNCASĂRI
      try {
        const entry = await this.createCashTransactionEntry({
          company_id: data.company_id,
          franchise_id: data.franchise_id,
          cash_register_id: data.cash_register_id,
          transaction_id: transactionId,
          receipt_number: documentNumber,
          transaction_type: CashTransactionType.CASH_RECEIPT,
          transaction_purpose: (data.purpose || 'customer_payment') as CashTransactionPurpose,
          amount: Number(data.amount),
          vat_amount: Number(data.vat_amount || 0),
          vat_rate: Number(data.vat_rate || 19),
          currency: data.currency || 'RON',
          exchange_rate: Number(data.exchange_rate || 1),
          transaction_date: new Date(),
          description: data.description,
          person_id: data.person_id,
          person_name: data.person_name,
          person_id_number: data.person_id_number,
          invoice_id: data.invoice_id,
          invoice_number: data.invoice_number,
          userId: data.userId,
          is_fiscal_receipt: data.is_fiscal_receipt || false,
          fiscal_receipt_number: data.fiscal_receipt_number,
          items: data.items || []
        });
        
        await db.update(AC_cash_transactions)
          .set({
            is_posted: true,
            posted_at: new Date(),
            ledger_entry_id: entry.id,
          })
          .where(eq(AC_cash_transactions.id, transactionId));
      } catch (error) {
        console.error('Error posting cash receipt to ledger:', error);
        // Nu facem rollback - tranzacția rămâne nepostată și poate fi postată manual
      }
      
      return transactionId;
    } catch (error) {
      console.error('Error recording cash receipt:', error);
      throw new Error(`Failed to record cash receipt: ${(error as Error).message}`);
    }
  }
  
  /**
   * Record cash payment (Dispoziție de Plată)
   */
  public async recordCashPayment(data: RecordCashPaymentData): Promise<string> {
    try {
      const db = getDrizzle();
      const transactionId = uuidv4();
      
      // Get current balance
      const register = await this.getCashRegister(data.cash_register_id, data.company_id);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      // PAS 5: Verifică dacă registrul este activ
      if (register.status !== 'active') {
        throw new Error('Registrul de casă nu este activ');
      }
      
      // PAS 5: Verifică dacă ziua curentă este închisă
      const registerWithClosing2 = register as CashRegisterWithClosing;
      if (registerWithClosing2.lastClosedDate) {
        const lastClosed = new Date(registerWithClosing2.lastClosedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (today <= lastClosed) {
          throw new Error('Registrul de casă pentru ziua curentă este închis. Nu mai puteți adăuga tranzacții. Operațiunile corective se fac prin tranzacții de ajustare în zile ulterioare.');
        }
      }
      
      // VALIDARE CNP pentru plăți mari
      if (Number(data.amount) > 10000 && !data.person_id_number) {
        throw new Error('CNP obligatoriu pentru plăți peste 10,000 Lei (Legea 70/2015)');
      }
      
      // VALIDARE PLAFOANE
      if (register.max_transaction_amount && Number(data.amount) > Number(register.max_transaction_amount)) {
        throw new Error(`Plata depășește plafonul legal (${register.max_transaction_amount} Lei). Conform Legii 70/2015, fragmentați sau plătiți prin bancă.`);
      }
      
      const balanceBefore = Number(register.current_balance);
      const balanceAfter = balanceBefore - Number(data.amount);
      
      if (balanceAfter < 0) {
        throw new Error('Insufficient cash balance');
      }
      
      // Generate document number
      const documentNumber = await this.generateReceiptNumber(data.company_id, data.cash_register_id, true);
      
      // Insert transaction
      await db.insert(AC_cash_transactions).values({
        id: transactionId,
        company_id: data.company_id,
        franchise_id: data.franchise_id || null,
        cash_register_id: data.cash_register_id,
        document_number: documentNumber,
        series: 'DP',
        number: documentNumber.split('-')[2],
        transaction_type: 'cash_payment',
        transaction_purpose: (data.purpose || 'expense_payment') as typeof AC_cash_transactions.$inferInsert.transaction_purpose,
        transaction_date: new Date(),
        amount: data.amount.toString(),
        vat_amount: (data.vat_amount || 0).toString(),
        vat_rate: data.vat_rate?.toString() || '0',
        net_amount: (data.net_amount || data.amount).toString(),
        currency: data.currency || 'RON',
        exchange_rate: (data.exchange_rate || 1).toString(),
        person_name: data.person_name,
        person_id_number: data.person_id_number || null,
        description: data.description,
        balance_before: balanceBefore.toString(),
        balance_after: balanceAfter.toString(),
        is_posted: false,
        is_canceled: false,
        created_by: data.userId,
      });
      
      // RECOMANDARE 5: Update atomic pentru prevenție race condition
      // Folosim Drizzle ORM cu sql pentru update atomic
      await db.update(AC_cash_registers)
        .set({
          current_balance: sql`${AC_cash_registers.current_balance} - ${Number(data.amount)}`,
          updated_at: new Date(),
        })
        .where(eq(AC_cash_registers.id, data.cash_register_id));
      
      // PAS 4: POSTARE AUTOMATĂ ÎN CONTABILITATE
      try {
        const entry = await this.createCashTransactionEntry({
          company_id: data.company_id,
          franchise_id: data.franchise_id,
          cash_register_id: data.cash_register_id,
          transaction_id: transactionId,
          receipt_number: documentNumber,
          transaction_type: CashTransactionType.CASH_PAYMENT,
          transaction_purpose: (data.purpose || 'expense_payment') as CashTransactionPurpose,
          amount: Number(data.amount),
          vat_amount: Number(data.vat_amount || 0),
          vat_rate: Number(data.vat_rate || 0),
          currency: data.currency || 'RON',
          exchange_rate: Number(data.exchange_rate || 1),
          transaction_date: new Date(),
          description: data.description,
          person_id: data.person_id,
          person_name: data.person_name,
          person_id_number: data.person_id_number,
          invoice_id: data.invoice_id,
          invoice_number: data.invoice_number,
          userId: data.userId,
          is_fiscal_receipt: false,
          items: []
        });
        
        await db.update(AC_cash_transactions)
          .set({
            is_posted: true,
            posted_at: new Date(),
            ledger_entry_id: entry.id,
          })
          .where(eq(AC_cash_transactions.id, transactionId));
      } catch (error) {
        console.error('Error posting cash payment to ledger:', error);
      }
      
      return transactionId;
    } catch (error) {
      console.error('Error recording cash payment:', error);
      throw new Error(`Failed to record cash payment: ${(error as Error).message}`);
    }
  }
  
  /**
   * Transfer cash between registers
   */
  public async transferCash(data: TransferCashData): Promise<CashTransferResult> {
    try {
      // Record payment from source register
      const fromTransactionId = await this.recordCashPayment({
        ...data,
        cash_register_id: data.from_register_id,
        purpose: 'cash_withdrawal',
        description: `Transfer către ${data.to_register_name || 'altă casă'}`,
      });
      
      // Record receipt to destination register
      const toTransactionId = await this.recordCashReceipt({
        ...data,
        cash_register_id: data.to_register_id,
        purpose: 'cash_withdrawal',
        description: `Transfer de la ${data.from_register_name || 'altă casă'}`,
      });
      
      const fromTransactionId = from_transaction_id;
      const toTransactionId = to_transaction_id;
      return { from_transaction_id: fromTransactionId, to_transaction_id: toTransactionId };
    } catch (error) {
      console.error('Error transferring cash:', error);
      throw new Error(`Failed to transfer cash: ${(error as Error).message}`);
    }
  }
  
  /**
   * PAS 9: Record cash deposit to bank - CU LEGARE AUTOMATĂ
   * Înregistrează depunerea în casierie ȘI încasarea în cont bancar
   */
  public async recordCashDepositToBank(data: CashDepositToBankData): Promise<BankTransactionResult> {
    try {
      // Importă BankJournalService doar când este necesar
      const { BankJournalService } = await import('./bank-journal.service');
      const bankService = new BankJournalService();
      
      // 1. Înregistrează plata din casierie (ieșire numerar)
      const cashTransactionId = await this.recordCashPayment({
        ...data,
        purpose: 'bank_deposit',
        description: data.description || `Depunere numerar la bancă - ${data.bank_account_name || 'cont bancar'}`,
      });
      
      // 2. Înregistrează încasarea în cont bancar (intrare în bancă)
      if (data.bank_account_id) {
        try {
          const bankTransactionId = await bankService.recordIncomingPayment({
            company_id: data.company_id,
            bankAccountId: data.bank_account_id,
            amount: data.amount,
            currency: data.currency || 'RON',
            exchange_rate: data.exchange_rate || 1,
            description: `Depunere numerar din casă - ${data.cash_register_name || 'casierie'}`,
            referenceNumber: `CASH-DEP-${Date.now()}`,
            transaction_date: new Date(),
            userId: data.userId,
            payerName: data.company_name || 'Numerar din casierie',
          });
          
          return { cash_transaction_id, bank_transaction_id };
        } catch (bankError) {
          console.error('Error creating bank transaction:', bankError);
          // Tranzacția cash a fost creată, dar cea bancară a eșuat
          // Notificăm utilizatorul să o creeze manual
          throw new Error(`Depunerea din casă a fost înregistrată (ID: ${cashTransactionId}), dar înregistrarea în bancă a eșuat. Vă rugăm să adăugați manual tranzacția bancară.`);
        }
      }
      
      // Dacă nu s-a specificat cont bancar, returnăm doar ID-ul cash
      return { cash_transaction_id, bank_transaction_id: '' };
    } catch (error) {
      console.error('Error recording cash deposit:', error);
      throw new Error(`Failed to record cash deposit: ${(error as Error).message}`);
    }
  }
  
  /**
   * PAS 9: Record cash withdrawal from bank - CU LEGARE AUTOMATĂ
   * Înregistrează ridicarea în casierie ȘI plata din cont bancar
   */
  public async recordCashWithdrawalFromBank(data: CashWithdrawalFromBankData): Promise<BankTransactionResult> {
    try {
      // Importă BankJournalService doar când este necesar
      const { BankJournalService } = await import('./bank-journal.service');
      const bankService = new BankJournalService();
      
      // 1. Înregistrează încasarea în casierie (intrare numerar)
      const cashTransactionId = await this.recordCashReceipt({
        ...data,
        purpose: 'cash_withdrawal',
        description: data.description || `Ridicare numerar de la bancă - ${data.bank_account_name || 'cont bancar'}`,
      });
      
      // 2. Înregistrează plata din cont bancar (ieșire din bancă)
      if (data.bank_account_id) {
        try {
          const bankTransactionId = await bankService.recordOutgoingPayment({
            company_id: data.company_id,
            bankAccountId: data.bank_account_id,
            amount: data.amount,
            currency: data.currency || 'RON',
            exchange_rate: data.exchange_rate || 1,
            description: `Ridicare numerar pentru casă - ${data.cash_register_name || 'casierie'}`,
            referenceNumber: `CASH-WD-${Date.now()}`,
            transaction_date: new Date(),
            userId: data.userId,
            payeeName: data.company_name || 'Numerar pentru casierie',
          });
          
          return { cash_transaction_id, bank_transaction_id };
        } catch (bankError) {
          console.error('Error creating bank transaction:', bankError);
          throw new Error(`Ridicarea în casă a fost înregistrată (ID: ${cashTransactionId}), dar înregistrarea în bancă a eșuat. Vă rugăm să adăugați manual tranzacția bancară.`);
        }
      }
      
      return { cash_transaction_id, bank_transaction_id: '' };
    } catch (error) {
      console.error('Error recording cash withdrawal:', error);
      throw new Error(`Failed to record cash withdrawal: ${(error as Error).message}`);
    }
  }
  
  /**
   * PAS 4: ÎNCHIDERE ZILNICĂ - Închide registrul de casă pentru o zi
   * Marchează ziua ca închisă și blochează modificările ulterioare
   */
  public async closeDailyCashRegister(cashRegisterId: string, companyId: string, date: Date, userId: string): Promise<DailyClosingResult> {
    try {
      const db = getDrizzle();
      
      // Verifică că data este în trecut sau azi
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Nu puteți închide o zi viitoare');
      }
      
      // Obține registrul
      const register = await this.getCashRegister(cashRegisterId, companyId);
      if (!register) {
        throw new Error('Registrul de casă nu a fost găsit');
      }
      
      // Verifică dacă ziua este deja închisă
      const registerWithClosing3 = register as CashRegisterWithClosing;
      if (registerWithClosing3.lastClosedDate) {
        const lastClosed = new Date(registerWithClosing3.lastClosedDate);
        const closeDate = new Date(date);
        closeDate.setHours(0, 0, 0, 0);
        
        if (closeDate <= lastClosed) {
          throw new Error(`Ziua ${date.toLocaleDateString('ro-RO')} este deja închisă`);
        }
      }
      
      // Obține toate tranzacțiile din ziua respectivă
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const transactions = await db
        .select()
        .from(AC_cash_transactions)
        .where(and(
          eq(AC_cash_transactions.cash_register_id, cashRegisterId),
          gte(AC_cash_transactions.transaction_date, startOfDay),
          lte(AC_cash_transactions.transaction_date, endOfDay),
          eq(AC_cash_transactions.is_canceled, false)
        ))
        .orderBy(AC_cash_transactions.transaction_date);
      
      if (transactions.length === 0) {
        throw new Error('Nu există tranzacții pentru această zi');
      }
      
      // Calculează soldul de închidere
      const closingBalance = Number(transactions[transactions.length - 1].balance_after);
      
      // Marchează ziua ca închisă
      await db.update(AC_cash_registers)
        .set({
          last_closed_date: date.toISOString().split('T')[0],
          updated_at: new Date(),
          updated_by: userId,
        })
        .where(eq(AC_cash_registers.id, cashRegisterId));
      
      // RECOMANDARE 4: Log audit pentru închidere zilnică
      await this.auditService.logDailyClosing(
        register.company_id,
        userId,
        cashRegisterId,
        date,
        closingBalance,
        transactions.length
      );
      
      // TODO PAS 6: Generează PDF (implementare ulterioară)
      // const pdfPath = await this.generateDailyRegisterPDF(cashRegisterId, date, transactions);
      
      return {
        success: true,
        closingBalance,
        // pdfPath
      };
    } catch (error) {
      console.error('Error closing daily cash register:', error);
      throw new Error(`Failed to close daily cash register: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get cash register balance as of date
   */
  public async getCashRegisterBalanceAsOf(cashRegisterId: string, companyId: string, asOfDate: Date): Promise<CashRegisterBalance> {
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
          balance: Number(register.current_balance),
          currency: register.currency
        };
      }
      
      // Calculate balance as of date by summing all transactions up to that date
      const transactions = await db
        .select()
        .from(AC_cash_transactions)
        .where(and(
          eq(AC_cash_transactions.cash_register_id, cashRegisterId),
          lte(AC_cash_transactions.transaction_date, asOfDate),
          eq(AC_cash_transactions.is_canceled, false)
        ));
      
      // RECOMANDARE 2: Logică corectă pentru toate tipurile de tranzacții
      let balance = 0;
      for (const txn of transactions) {
        // Încasări (cresc soldul)
        if (txn.transaction_type === 'cash_receipt' || 
            txn.transaction_type === 'bank_withdrawal' ||
            txn.transaction_type === 'petty_cash_settlement') {
          balance += Number(txn.amount);
        } 
        // Plăți (scad soldul)
        else if (txn.transaction_type === 'cash_payment' || 
                 txn.transaction_type === 'bank_deposit' ||
                 txn.transaction_type === 'petty_cash_advance') {
          balance -= Number(txn.amount);
        }
        // Ajustări (pot fi + sau -)
        else if (txn.transaction_type === 'cash_count_adjustment') {
          // Pentru ajustări, folosim direct balanceAfter din tranzacție
          balance = Number(txn.balanceAfter);
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
  public async createReconciliation(data: CreateReconciliationData): Promise<string> {
    try {
      const db = getDrizzle();
      
      // Get register and current balance
      const register = await this.getCashRegister(data.cash_register_id, data.company_id);
      if (!register) {
        throw new Error('Cash register not found');
      }
      
      const systemBalance = Number(register.current_balance);
      const physicalCount = Number(data.physical_count);
      const difference = physicalCount - systemBalance;
      
      // If there's a difference, create adjustment transaction
      if (Math.abs(difference) > 0.01) {
        const adjustmentId = uuidv4();
        
        await db.insert(AC_cash_transactions).values({
          id: adjustmentId,
          company_id: data.company_id,
          cash_register_id: data.cash_register_id,
          document_number: `ADJ-${Date.now()}`,
          series: 'ADJ',
          number: Date.now().toString(),
          transaction_type: 'cash_count_adjustment',
          transaction_purpose: 'other',
          transaction_date: new Date(),
          amount: Math.abs(difference).toString(),
          currency: register.currency,
          person_name: data.userId,
          description: difference > 0 
            ? `Plus de casă: ${difference} ${register.currency}`
            : `Lipsă de casă: ${Math.abs(difference)} ${register.currency}`,
          balance_before: systemBalance.toString(),
          balance_after: physicalCount.toString(),
          notes: data.notes || null,
          created_by: data.userId,
        });
        
        // RECOMANDARE 5: Update atomic - setăm direct la physical count
        await db.update(AC_cash_registers)
          .set({
            current_balance: physicalCount.toString(),
            updated_at: new Date(),
          })
          .where(eq(AC_cash_registers.id, data.cash_register_id));
        
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
      start_date: Date,
      end_date: Date
  ): Promise<CashRegisterReport> {
    try {
      const db = getDrizzle();
      
      const transactions = await db
        .select()
        .from(AC_cash_transactions)
        .where(and(
          eq(AC_cash_transactions.company_id, companyId),
          eq(AC_cash_transactions.cash_register_id, cashRegisterId),
          gte(AC_cash_transactions.transaction_date, startDate),
          lte(AC_cash_transactions.transaction_date, endDate),
          eq(AC_cash_transactions.is_canceled, false)
        ))
        .orderBy(AC_cash_transactions.transaction_date);
      
      let totalReceipts = 0;
      let totalPayments = 0;
      
      for (const txn of transactions) {
        if (txn.transaction_type === 'cash_receipt' || txn.transaction_type === 'bank_withdrawal') {
          totalReceipts += Number(txn.amount);
        } else if (txn.transaction_type === 'cash_payment' || txn.transaction_type === 'bank_deposit') {
          totalPayments += Number(txn.amount);
        }
      }
      
      return {
        cash_register_id: cashRegisterId,
        period: { start_date: startDate, end_date: endDate },
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
  ): Promise<CashRegisterReport> {
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
      company_id: companyId,
      franchise_id: franchiseId,
      cash_register_id: _cashRegisterId,
      transaction_id: _transactionId,
      receipt_number: receiptNumber,
      transaction_type: transactionType,
      transaction_purpose: transactionPurpose,
      amount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      currency,
      exchange_rate: exchangeRate,
      transaction_date: _transactionDate,
      description,
      person_id: _personId,
      person_name: personName,
      person_id_number: _personIdNumber,
      invoice_id: _invoiceId,
      invoice_number: invoiceNumber,
      userId,
      fiscal_receipt_number: fiscalReceiptNumber,
      is_fiscal_receipt: isFiscalReceipt,
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
                ? items.reduce((sum, item) => sum + item.net_amount, 0) 
                : (amount - (vatAmount || 0));
              
              const vatTotal = vatAmount || (items && items.length > 0 
                ? items.reduce((sum, item) => sum + item.vat_amount, 0) 
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
            const expenseType = data.additional_data?.['expense_type'];
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
    
    // PAS 8: If foreign currency, handle exchange rate differences
    if (currency !== 'RON' && exchangeRate !== 1) {
      // TODO: Implementare completă diferențe de curs
      // Pentru moment, înregistrăm totul la cursul specificat
      // Implementarea completă ar trebui să:
      // 1. Obțină cursul BNR oficial pentru ziua respectivă
      // 2. Calculeze diferența între exchangeRate și curs BNR
      // 3. Genereze automat linii contabile pe 665/765 pentru diferențe
      // 4. Pentru plăți legate de facturi, să folosească cursul facturii
      
      // Exemplu simplificat de calcul diferență:
      // const bnrRate = await getBNRRate(currency, transactionDate);
      // const diff = (exchangeRate - bnrRate) * amount;
      // if (Math.abs(diff) > 0.01) {
      //   if (diff > 0) {
      //     ledgerLines.push({ accountId: CASH_ACCOUNTS.EXCHANGE_DIFF_EXPENSE, debitAmount: diff, creditAmount: 0 });
      //     ledgerLines.push({ accountId: getCashAccount(), debitAmount: 0, creditAmount: diff });
      //   } else {
      //     ledgerLines.push({ accountId: getCashAccount(), debitAmount: Math.abs(diff), creditAmount: 0 });
      //     ledgerLines.push({ accountId: CASH_ACCOUNTS.EXCHANGE_DIFF_INCOME, debitAmount: 0, creditAmount: Math.abs(diff) });
      //   }
      // }
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
      lines: ledger_lines
    });
    
    return entry;
  }
  
  /**
   * Validate a cash transaction
   * @param transactionData Cash transaction data
   * @returns Validation result
   */
  public validateCashTransaction(transactionData: CashTransactionData): TransactionValidationResult {
    const errors: string[] = [];
    
    // Check required fields according to Romanian standards
    if (!transactionData.transaction_id) {
      errors.push('Transaction ID is required');
    }
    
    if (!transactionData.cash_register_id) {
      errors.push('Cash register ID is required');
    }
    
    if (!transactionData.receipt_number) {
      errors.push('Receipt number is required');
    }
    
    if (!transactionData.transaction_date) {
      errors.push('Transaction date is required');
    }
    
    if (transactionData.amount === undefined || transactionData.amount === null) {
      errors.push('Transaction amount is required');
    }
    
    if (!transactionData.transaction_type) {
      errors.push('Transaction type is required');
    } else {
      // Check that transaction type is valid
      const validTypes = Object.values(CashTransactionType);
      if (!validTypes.includes(transactionData.transaction_type)) {
        errors.push(`Invalid transaction type. Valid types are: ${validTypes.join(', ')}`);
      }
    }
    
    if (!transactionData.transaction_purpose) {
      errors.push('Transaction purpose is required');
    } else {
      // Check that transaction purpose is valid
      const validPurposes = Object.values(CashTransactionPurpose);
      if (!validPurposes.includes(transactionData.transaction_purpose)) {
        errors.push(`Invalid transaction purpose. Valid purposes are: ${validPurposes.join(', ')}`);
      }
    }
    
    // Additional validation for Romanian fiscal compliance
    
    // Transaction date validation
    const currentDate = new Date();
    const transactionDate = new Date(transactionData.transaction_date);
    
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
    switch (transactionData.transaction_type) {
      case CashTransactionType.CASH_RECEIPT:
      case CashTransactionType.CASH_PAYMENT:
        if (!transactionData.person_name) {
          errors.push('Person name is required for cash receipts and payments');
        }
        
        // For certain transaction types, ID number is required by Romanian law
        if (
          (transactionData.transactionPurpose === CashTransactionPurpose.SUPPLIER_PAYMENT && transactionData.amount > 5000) ||
          (transactionData.transactionPurpose === CashTransactionPurpose.SALARY_PAYMENT)
        ) {
          if (!transactionData.person_id_number) {
            errors.push('Person ID number (CNP/ID card) is required for this transaction type according to Romanian regulations');
          }
        }
        break;
    }
    
    // Fiscal receipt validation
    if (transactionData.is_fiscal_receipt) {
      if (!transactionData.fiscal_receipt_number) {
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
          
          if (!item.unit_price || Number(item.unit_price) < 0) {
            errors.push(`Item #${index + 1}: Unit price must be non-negative`);
          }
          
          // Check calculated values
          const calculatedNet = Number(item.quantity) * Number(item.unit_price);
          if (Math.abs(calculatedNet - Number(item.net_amount)) > 0.01) {
            errors.push(`Item #${index + 1}: Net amount doesn't match quantity × unit price`);
          }
          
          const calculatedVat = Number(item.net_amount) * (Number(item.vat_rate) / 100);
          if (Math.abs(calculatedVat - Number(item.vat_amount)) > 0.01) {
            errors.push(`Item #${index + 1}: VAT amount doesn't match net amount × VAT rate`);
          }
          
          const calculatedGross = Number(item.net_amount) + Number(item.vat_amount);
          if (Math.abs(calculatedGross - Number(item.gross_amount)) > 0.01) {
            errors.push(`Item #${index + 1}: Gross amount doesn't match net amount + VAT amount`);
          }
        }
        
        // Check totals - validate gross and VAT amounts
        const totalVat = transactionData.items.reduce((sum: number, item: CashTransactionItem) => sum + Number(item.vat_amount), 0);
        const totalGross = transactionData.items.reduce((sum: number, item: CashTransactionItem) => sum + Number(item.gross_amount), 0);
        
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
   * @param _companyId Company ID (unused - reserved for future filtering)
   * @param _transactionId Transaction ID (unused - reserved for future query)
   * @returns Ledger entry or null if not found
   */
  public async getCashTransactionEntryByTransactionId(_companyId: string, _transactionId: string): Promise<LedgerEntryData | null> {
    // This would typically involve a database query to find the ledger entry
    // associated with the transaction ID
    
    // For now, return null as this is just a placeholder
    return null;
  }
  
  /**
   * Generate a cash receipt number
   * This follows Romanian requirements for sequential numbering
   * @param companyId Company ID
   * @param _cashRegisterId Cash register ID (unused - reserved for future filtering)
   * @param isPayment Whether this is a payment (default: false, meaning it's a receipt)
   * @returns Generated receipt number
   */
  /**
   * Generare număr secvențial CORECT conform OMFP 2634/2015
   * Format: CH/2025/000123 sau DP/2025/000456
   */
  public async generateReceiptNumber(companyId: string, _cashRegisterId: string, isPayment: boolean = false): Promise<string> {
    const db = getDrizzle();
    const year = new Date().getFullYear();
    const series = isPayment ? 'DP' : 'CH'; // CH = Chitanță, DP = Dispoziție Plată
    
    try {
      // Obține sau creează counter folosind Drizzle ORM cu upsert pattern
      const [counter] = await db
        .insert(document_counters)
        .values({
          companyId,
          counterType: 'CASH',
          series,
          year: year.toString(),
          lastNumber: '1',
        })
        .onConflictDoUpdate({
          target: [
            document_counters.companyId,
            document_counters.counterType,
            document_counters.series,
            document_counters.year,
          ],
          set: {
            lastNumber: sql`${document_counters.lastNumber} + 1`,
            updated_at: new Date(),
          },
        })
        .returning({ lastNumber: document_counters.lastNumber });
      
      const number = counter.lastNumber.toString().padStart(6, '0');
      return `${series}/${year}/${number}`;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      // Fallback la random dacă eșuează
      return `${series}/${year}/${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
    }
  }
  
  /**
   * ============================================================================
   * REDIS CACHING & BULLMQ ASYNC OPERATIONS
   * ============================================================================
   */
  
  /**
   * Get daily cash report with caching
   */
  public async getDailyCashReportCached(
    companyId: string,
    cashRegisterId: string,
    date: Date,
    useCache: boolean = true
  ): Promise<CashRegisterReport> {
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `acc:cash-report:${companyId}:${cashRegisterId}:${dateStr}`;
    
    // Check cache
    if (useCache) {
      const redisService = new RedisService();
      await redisService.connect();
      
      if (redisService.isConnected()) {
        const cached = await redisService.getCached<CashRegisterReport>(cacheKey);
        
        if (cached) {
          console.log(`Daily cash report cache hit for ${cashRegisterId}`, 'cash-register-cache');
          return cached;
        }
      }
    }
    
    // Generate report
    console.log(`Generating daily cash report for ${cashRegisterId}`, 'cash-register');
    const report = await this.generateCashRegisterReport(companyId, cashRegisterId, date, date);
    
    // Cache result (1 day TTL for historical data, 5 min for today)
    if (useCache) {
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const ttl = isToday ? 300 : 86400;
      
      const redisService = new RedisService();
      await redisService.connect();
      if (redisService.isConnected()) {
        await redisService.setCached(cacheKey, report, ttl);
        console.log(`Daily cash report cached for ${cashRegisterId}`, 'cash-register-cache');
      }
    }
    
    return report;
  }
  
  /**
   * Queue cash register reconciliation as async job
   */
  public async reconcileCashRegisterAsync(
    companyId: string,
    cashRegisterId: string,
      start_date: string,
      end_date: string,
    _userId: string
  ): Promise<ReconciliationJobResult> {
    try {
      console.log(`Queueing async cash reconciliation for ${cashRegisterId}`, 'cash-register-async');
      
      const job = await accountingQueueService.queueAccountReconciliation({
        accountId: cashRegisterId,
        companyId,
        startDate: startDate,
        endDate: endDate
      });
      
      return {
        jobId: job.id || 'unknown',
        message: `Cash reconciliation queued. Job ID: ${job.id || 'unknown'}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error queueing cash reconciliation: ${errorMessage}`, 'cash-register-error');
      throw error;
    }
  }
  
  /**
   * Invalidate cash report cache
   */
  public async invalidateCashReportCache(
    companyId: string,
    cashRegisterId?: string
  ): Promise<void> {
    try {
      const redisService = new RedisService();
      await redisService.connect();
      
      if (!redisService.isConnected()) {
        return;
      }
      
      const pattern = cashRegisterId
        ? `acc:cash-report:${companyId}:${cashRegisterId}:*`
        : `acc:cash-report:${companyId}:*`;
      
      await redisService.invalidatePattern(pattern);
      console.log(`Invalidated cash report cache for ${companyId}`, 'cash-register-cache');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error invalidating cash report cache: ${errorMessage}`, 'cash-register-error');
    }
  }
}

export default CashRegisterService;