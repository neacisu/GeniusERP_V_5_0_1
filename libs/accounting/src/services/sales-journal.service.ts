/**
 * Sales Journal Service
 * 
 * Specialized journal service for sales-related accounting operations.
 * Handles creating and managing sales invoice entries.
 * 
 * ENHANCED WITH:
 * - Redis caching for journal reports
 * - BullMQ async processing for heavy operations
 * - Cache invalidation on data modifications
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from "@common/drizzle";
import { and, desc, eq, gte, lte, isNotNull } from 'drizzle-orm';
import { invoices, invoiceItems, invoiceDetails, invoicePayments, users, companies, type InvoicePayment, type InvoiceDetail } from '@geniuserp/shared';
import { accounting_ledger_entries, accounting_ledger_lines } from '../schema/accounting.schema';
import { VATCategory, determineVATCategory } from '../types/vat-categories';
import { 
  SalesJournalReport, 
  SalesJournalRow, 
  SalesJournalTotals,
  GenerateSalesJournalParams 
} from '../types/sales-journal-types';
import { 
  type InvoiceData,
  type InvoiceItemData,
  type CustomerData,
  type TaxRatesData,
  type PaymentTermsData,
  type LedgerEntryInputData,
  type WhereCondition,
  type PaginatedResponse,
  type ReportData
} from '../types/sales-journal-data-types';
import { accountingCacheService } from './accounting-cache.service';
import { accountingQueueService } from './accounting-queue.service';

/**
 * Sales journal entry interface
 */
export interface SalesJournalEntry {
  id: string;
  companyId: string;
  franchiseId?: string;
  entryType: string;
  referenceNumber: string;
  amount: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  customerId?: string;
  customerName?: string;
  lines: InvoiceItemData[];
}

/**
 * Sales report interface
 */
export interface SalesReport {
  period: string;
  totalSales: number;
  totalVat: number;
  netSales: number;
  invoiceCount: number;
  entries: SalesJournalEntry[];
}

/**
 * Sales invoice data interface for entry creation
 */
export interface SalesInvoiceData {
  companyId: string;
  franchiseId?: string;
  invoiceNumber: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  amount: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  currency: string;
  exchangeRate: number;
  issueDate: Date;
  dueDate: Date;
  description: string;
  userId?: string;
  isCashVAT?: boolean; // Flag pentru TVA la încasare
}

/**
 * Romanian accounts for sales transactions
 * These would typically come from a database, but are hardcoded for this example
 */
export const SALES_ACCOUNTS = {
  // Class 4 - Third Party Accounts
  CUSTOMER: '4111', // Clients
  VAT_COLLECTED: '4427', // VAT collected (exigibilă)
  VAT_DEFERRED: '4428', // TVA neexigibilă (pentru TVA la încasare)
  
  // Class 7 - Revenue Accounts
  REVENUE: '707', // Revenue from sale of goods
  REVENUE_SERVICES: '704', // Revenue from services
  
  // Currency accounts
  EXCHANGE_DIFF_INCOME: '765', // Foreign exchange gains
  EXCHANGE_DIFF_EXPENSE: '665', // Foreign exchange losses
};

/**
 * Sales journal service for sales-related accounting operations
 */
export class SalesJournalService {
  private journalService: JournalService;
  
  /**
   * Constructor
   */
  constructor() {
    this.journalService = new JournalService();
  }
  
  /**
   * Get all customer invoices with pagination and filtering
   * @param companyId Company ID
   * @param page Page number
   * @param limit Entries per page
   * @param startDate Filter by start date
   * @param endDate Filter by end date
   * @param customerId Filter by customer
   * @param status Filter by status
   * @returns Customer invoices with pagination
   */
  public async getCustomerInvoices(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
    customerId?: string,
    status?: string
  ): Promise<PaginatedResponse<InvoiceData>> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions: WhereCondition[] = [eq(invoices.companyId, companyId)];
      
      if (startDate) {
        conditions.push(gte(invoices.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(invoices.date, endDate));
      }
      if (customerId) {
        conditions.push(eq(invoices.customerId, customerId));
      }
      if (status) {
        conditions.push(eq(invoices.status, status as 'draft' | 'issued' | 'sent' | 'canceled'));
      }
      
      // Fetch invoices using select instead of query API
      // Notă: SELECT explicit pe câmpuri existente pentru compatibilitate înainte de migrație
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const result = await db
        .select({
          id: invoices.id,
          companyId: invoices.companyId,
          franchiseId: invoices.franchiseId,
          invoiceNumber: invoices.invoiceNumber,
          series: invoices.series,
          number: invoices.number,
          customerId: invoices.customerId,
          customerName: invoices.customerName,
          date: invoices.date,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          amount: invoices.amount,
          totalAmount: invoices.totalAmount,
          netAmount: invoices.netAmount,
          vatAmount: invoices.vatAmount,
          currency: invoices.currency,
          exchangeRate: invoices.exchangeRate,
          status: invoices.status,
          type: invoices.type,
          relatedInvoiceId: invoices.relatedInvoiceId,
          description: invoices.description,
          notes: invoices.notes,
          version: invoices.version,
          isValidated: invoices.isValidated,
          validatedAt: invoices.validatedAt,
          ledgerEntryId: invoices.ledgerEntryId,
          createdBy: invoices.createdBy,
          updatedBy: invoices.updatedBy,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          deletedAt: invoices.deletedAt
        })
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.date))
        .limit(limit)
        .offset(offset);
      
      // Get invoice lines for each invoice
      const invoicesWithLines = await Promise.all(
        result.map(async (invoice) => {
          const lines = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoice.id));
          return { ...invoice, lines } as InvoiceData;
        })
      );
      
      // Get total count
      const totalResult = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(whereClause);
      
      // Enrich invoices with user names
      const enrichedData = await Promise.all(
        invoicesWithLines.map(async (invoice) => {
          let createdByName: string | null = null;
          if (invoice.createdBy) {
            const userResult = await db
              .select({
                firstName: users.firstName,
                lastName: users.lastName,
                username: users.username
              })
              .from(users)
              .where(eq(users.id, invoice.createdBy))
              .limit(1);
            
            if (userResult.length > 0) {
              const user = userResult[0];
              createdByName = `${user.firstName} ${user.lastName}`.trim() || user.username;
            }
          }
          return {
            ...invoice,
            createdByName,
          };
        })
      );
      
      return {
        data: enrichedData,
        total: totalResult.length,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      throw new Error('Failed to retrieve customer invoices');
    }
  }
  
  /**
   * Get a single customer invoice by ID
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @returns Customer invoice or null
   */
  public async getCustomerInvoice(invoiceId: string, companyId: string): Promise<InvoiceData | null> {
    try {
      const db = getDrizzle();
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.companyId, companyId)
        ))
        .limit(1);
      
      if (invoiceResult.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult[0];
      
      // Get invoice lines
      const lines = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));
      
      return { ...invoice, lines };
    } catch (error) {
      console.error('Error getting customer invoice:', error);
      throw new Error('Failed to retrieve customer invoices');
    }
  }
  
  /**
   * Create a new customer invoice
   * @param invoiceData Invoice data
   * @param customer Customer data
   * @param items Invoice items
   * @param taxRates Tax rates
   * @param paymentTerms Payment terms
   * @param notes Additional notes
   * @returns Created invoice ID
   */
  public async createCustomerInvoice(
    invoiceData: Partial<InvoiceData>,
    customer: CustomerData,
    items: InvoiceItemData[],
    taxRates: TaxRatesData,
    paymentTerms: PaymentTermsData,
    notes?: string
  ): Promise<string> {
    // Folosește metoda existentă createSalesInvoice
    return await this.createSalesInvoice(invoiceData, customer, items, taxRates, paymentTerms, notes || '');
  }
  
  /**
   * Update customer invoice
   */
  public async updateCustomerInvoice(
    invoiceData: Partial<InvoiceData>,
    customer: CustomerData,
    items: InvoiceItemData[],
    _taxRates: TaxRatesData,
    _paymentTerms: PaymentTermsData,
    notes?: string
  ): Promise<void> {
    try {
      // Validate required fields
      if (!invoiceData.id) throw new Error('Invoice ID is required for update');
      if (!invoiceData.companyId) throw new Error('Company ID is required for update');
      
      const db = getDrizzle();
      
      // Update invoice
      await db.update(invoices)
        .set({
          customerName: customer.name || customer.customerName,
          amount: String(invoiceData.amount),
          totalAmount: String(invoiceData.totalAmount),
          netAmount: String(invoiceData.netAmount),
          vatAmount: String(invoiceData.vatAmount),
          dueDate: invoiceData.dueDate,
          notes: notes,
          updatedAt: new Date()
        })
        .where(and(
          eq(invoices.id, invoiceData.id),
          eq(invoices.companyId, invoiceData.companyId)
        ));
      
      // Delete old lines and insert new ones
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceData.id));
      
      for (const item of items) {
        await db.insert(invoiceItems).values({
          invoiceId: invoiceData.id,
          productId: item.productId || null,
          productName: item.productName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          netAmount: String(item.netAmount),
          vatRate: String(item.vatRate),
          vatAmount: String(item.vatAmount),
          grossAmount: String(item.grossAmount)
        });
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }
  
  /**
   * Delete customer invoice
   */
  public async deleteCustomerInvoice(invoiceId: string, companyId: string): Promise<void> {
    try {
      const db = getDrizzle();
      
      // Soft delete - mark as deleted
      await db.update(invoices)
        .set({ deletedAt: new Date() })
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.companyId, companyId)
        ));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  }
  
  /**
   * Get all sales journal entries with pagination
   * @param companyId Company ID
   * @param page Page number
   * @param limit Entries per page
   * @returns Sales journal entries
   */
  public async getSalesJournalEntries(
    companyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ entries: SalesJournalEntry[]; total: number; page: number; limit: number }> {
    try {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get entries from ledger
      const db = getDrizzle();
      const result = await db
        .select()
        .from(accountingLedgerEntries)
        .where(and(
          eq(accountingLedgerEntries.companyId, companyId),
          eq(accountingLedgerEntries.type, LedgerEntryType.SALES)
        ))
        .orderBy(desc(accountingLedgerEntries.createdAt))
        .limit(limit)
        .offset(offset);
      
      // Get lines for each entry with proper typing
      const entriesWithLines = await Promise.all(
        result.map(async (entry) => {
          const lines = await db
            .select()
            .from(accountingLedgerLines)
            .where(eq(accountingLedgerLines.ledgerEntryId, entry.id));
          return { ...entry, lines };
        })
      );
      
      const entries = entriesWithLines.map((entry) => this.mapToSalesJournalEntry(entry));
      
      // Get total count
      const totalCountResult = await db
        .select({ id: accounting_ledger_entries.id })
        .from(accountingLedgerEntries)
        .where(and(
          eq(accountingLedgerEntries.companyId, companyId),
          eq(accountingLedgerEntries.type, LedgerEntryType.SALES)
        ));
      
      return {
        entries,
        total: totalCountResult.length,
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting sales journal entries:', error);
      throw new Error('Failed to retrieve sales journal entries');
    }
  }
  
  /**
   * Get a sales journal entry by ID
   * @param id Entry ID
   * @param companyId Company ID
   * @returns Sales journal entry or null if not found
   */
  public async getSalesJournalEntry(id: string, companyId: string): Promise<SalesJournalEntry | null> {
    try {
      const db = getDrizzle();
      const entryResult = await db
        .select()
        .from(accountingLedgerEntries)
        .where(and(
          eq(accountingLedgerEntries.id, id),
          eq(accountingLedgerEntries.companyId, companyId),
          eq(accountingLedgerEntries.type, LedgerEntryType.SALES)
        ))
        .limit(1);
      
      if (entryResult.length === 0) {
        return null;
      }
      
      const entry = entryResult[0];
      
      // Get ledger lines
      const lines = await db
        .select()
        .from(accountingLedgerLines)
        .where(eq(accountingLedgerLines.ledgerEntryId, entry.id));
      
      return this.mapToSalesJournalEntry({ ...entry, lines });
    } catch (error) {
      console.error('Error getting sales journal entry:', error);
      throw new Error('Failed to retrieve sales journal entry');
    }
  }
  
  /**
   * Create a sales invoice in the journal
   * @param invoiceData Invoice data
   * @param customer Customer data
   * @param items Invoice items
   * @param taxRates Tax rates
   * @param paymentTerms Payment terms
   * @param notes Notes
   * @returns Created entry ID
   */
  public async createSalesInvoice(
    invoiceData: Partial<InvoiceData>,
    customer: CustomerData,
    items: InvoiceItemData[],
    taxRates: TaxRatesData,
    paymentTerms: PaymentTermsData,
    notes: string
  ): Promise<string> {
    try {
      // Validate invoice data
      const validation = this.validateSalesInvoice(invoiceData);
      if (!validation.valid) {
        throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;
      
      // Validate required fields
      if (!invoiceData.companyId) throw new Error('Company ID is required');
      if (!invoiceData.invoiceNumber) throw new Error('Invoice number is required');
      if (!customer.id) throw new Error('Customer ID is required');
      if (!customer.name && !customer.customerName) throw new Error('Customer name is required');
      if (!invoiceData.issueDate) throw new Error('Issue date is required');
      if (!invoiceData.dueDate) throw new Error('Due date is required');
      
      // Prepare data for journal entry
      const entryData: SalesInvoiceData = {
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId || undefined,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceData.id || uuidv4(),
        customerId: customer.id,
        customerName: customer.name || customer.customerName || 'Unknown',
        amount: grossAmount,
        netAmount,
        vatAmount,
        vatRate: taxRates.standard || 19, // Default Romanian VAT rate
        currency: invoiceData.currency || 'RON',
        exchangeRate: Number(invoiceData.exchangeRate) || 1,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        description: notes || `Invoice ${invoiceData.invoiceNumber} to ${customer.name || customer.customerName}`,
        userId: invoiceData['userId'] as string | undefined
      };
      
      // Create the invoice entry
      const entry = await this.createSalesInvoiceEntry(entryData);
      
      // Save invoice and items in database
      const db = getDrizzle();
      
      // Insert invoice and get generated ID
      const [insertedInvoice] = await db.insert(invoices).values({
        companyId: entryData.companyId,
        franchiseId: entryData.franchiseId,
        invoiceNumber: entryData.invoiceNumber,
        customerId: entryData.customerId,
        customerName: entryData.customerName,
        amount: String(entryData.amount),
        totalAmount: String(entryData.amount),
        netAmount: String(entryData.netAmount),
        vatAmount: String(entryData.vatAmount),
        currency: entryData.currency,
        exchangeRate: String(entryData.exchangeRate),
        issueDate: entryData.issueDate,
        dueDate: entryData.dueDate,
        status: 'issued', // Corectare: folosim 'issued' în loc de 'VALIDATED'
        type: 'INVOICE',
        isValidated: true, // Marcăm că factura a fost validată contabil
        validatedAt: new Date(),
        ledgerEntryId: entry.id,
        createdBy: entryData.userId
      }).returning();
      
      const invoiceId = insertedInvoice.id;
      
      // Insert invoice items
      for (const item of items) {
        await db.insert(invoiceItems).values({
          invoiceId: invoiceId,
          productId: item.productId,
          productName: item.productName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          netAmount: String(item.netAmount),
          vatRate: item.vatRate,
          vatAmount: String(item.vatAmount),
          grossAmount: String(item.grossAmount)
        });
      }
      
      // Insert invoice details with customer information
      // Conform OMFP 2634/2015, trebuie să păstrăm datele complete ale clientului
      await db.insert(invoiceDetails).values({
        invoiceId: invoiceId,
        partnerId: customer.id || null,
        partnerName: customer.name || customer.customerName || 'Unknown',
        partnerFiscalCode: customer.fiscalCode || customer.cui || customer.taxId || '',
        partnerRegistrationNumber: customer.registrationNumber || customer.regCom || '',
        partnerAddress: customer.address || '',
        partnerCity: customer.city || '',
        partnerCounty: customer.county || customer.state || null,
        partnerCountry: customer.country || 'Romania',
        paymentMethod: paymentTerms.method || 'bank_transfer',
        paymentDueDays: paymentTerms.dueDays || 30,
        paymentDueDate: entryData.dueDate,
        notes: notes || null
      });
      
      return invoiceId;
    } catch (error) {
      console.error('Error creating sales invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create sales invoice: ${errorMessage}`);
    }
  }
  
  /**
   * Create a credit note (sales return)
   * @param creditNoteData Credit note data
   * @param relatedInvoiceId Related invoice ID
   * @param customer Customer data
   * @param items Credit note items
   * @param taxRates Tax rates
   * @param reason Reason for credit note
   * @param notes Notes
   * @returns Created entry ID
   */
  public async createCreditNote(
    creditNoteData: Partial<InvoiceData>,
    relatedInvoiceId: string,
    customer: CustomerData,
    items: InvoiceItemData[],
    taxRates: TaxRatesData,
    reason: string,
    _notes: string
  ): Promise<string> {
    try {
      // Get the original invoice
      const db = getDrizzle();
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, relatedInvoiceId))
        .limit(1);
      
      if (invoiceResult.length === 0) {
        throw new Error(`Original invoice not found: ${relatedInvoiceId}`);
      }
      
      const invoice = invoiceResult[0];
      
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;
      
      // Validate required fields
      if (!creditNoteData.companyId) throw new Error('Company ID is required');
      const creditNoteNumber = creditNoteData['creditNoteNumber'] as string | undefined;
      if (!creditNoteNumber) throw new Error('Credit note number is required');
      if (!customer.id) throw new Error('Customer ID is required');
      if (!customer.name && !customer.customerName) throw new Error('Customer name is required');
      if (!creditNoteData.issueDate) throw new Error('Issue date is required');
      
      // Prepare data for journal entry
      const entryData: SalesInvoiceData = {
        companyId: creditNoteData.companyId,
        franchiseId: creditNoteData.franchiseId || undefined,
        invoiceNumber: creditNoteNumber,
        invoiceId: creditNoteData.id || uuidv4(),
        customerId: customer.id,
        customerName: customer.name || customer.customerName || 'Unknown',
        amount: grossAmount,
        netAmount,
        vatAmount,
        vatRate: taxRates.standard || 19, // Default Romanian VAT rate
        currency: creditNoteData.currency || 'RON',
        exchangeRate: Number(creditNoteData.exchangeRate) || 1,
        issueDate: new Date(creditNoteData.issueDate),
        dueDate: new Date(creditNoteData.dueDate || creditNoteData.issueDate),
        description: `Credit note ${creditNoteNumber} for invoice ${invoice.invoiceNumber}: ${reason}`,
        userId: creditNoteData['userId'] as string | undefined
      };
      
      // Create the credit note entry
      const entry = await this.createSalesCreditNoteEntry(entryData, creditNoteNumber, reason);
      
      // Save credit note in database and get generated ID
      const [insertedCreditNote] = await db.insert(invoices).values({
        companyId: entryData.companyId,
        franchiseId: entryData.franchiseId,
        invoiceNumber: entryData.invoiceNumber,
        customerId: entryData.customerId,
        customerName: entryData.customerName,
        amount: String(entryData.amount),
        totalAmount: String(entryData.amount),
        netAmount: String(entryData.netAmount),
        vatAmount: String(entryData.vatAmount),
        currency: entryData.currency,
        exchangeRate: String(entryData.exchangeRate),
        issueDate: entryData.issueDate,
        dueDate: entryData.dueDate,
        status: 'issued', // Corectare: folosim 'issued' în loc de 'CREDIT_NOTE'
        type: 'CREDIT_NOTE', // Folosim câmpul type pentru a diferenția nota de credit
        relatedInvoiceId,
        isValidated: true, // Marcăm că factura a fost validată contabil
        validatedAt: new Date(),
        ledgerEntryId: entry.id,
        createdBy: entryData.userId,
        description: entryData.description
      }).returning();
      
      const creditNoteId = insertedCreditNote.id;
      
      // Insert credit note items
      for (const item of items) {
        await db.insert(invoiceItems).values({
          invoiceId: creditNoteId,
          productId: item.productId,
          productName: item.productName,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          netAmount: String(item.netAmount),
          vatRate: item.vatRate,
          vatAmount: String(item.vatAmount),
          grossAmount: String(item.grossAmount),
          originalItemId: item.originalItemId // Reference to original invoice item
        });
      }
      
      // Insert credit note details with customer information
      await db.insert(invoiceDetails).values({
        invoiceId: creditNoteId,
        partnerId: customer.id || null,
        partnerName: customer.name || customer.customerName || 'Unknown',
        partnerFiscalCode: customer.fiscalCode || customer.cui || customer.taxId || '',
        partnerRegistrationNumber: customer.registrationNumber || customer.regCom || '',
        partnerAddress: customer.address || '',
        partnerCity: customer.city || '',
        partnerCounty: customer.county || customer.state || null,
        partnerCountry: customer.country || 'Romania',
        paymentMethod: 'credit_note',
        paymentDueDays: 0,
        paymentDueDate: entryData.dueDate,
        notes: reason || null
      });
      
      return creditNoteId;
    } catch (error) {
      console.error('Error creating credit note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create credit note: ${errorMessage}`);
    }
  }
  
  /**
   * Generate sales report for a period
   * @param companyId Company ID
   * @param fiscalYear Fiscal year
   * @param fiscalMonth Fiscal month (optional)
   * @returns Sales report
   */
  public async generateSalesReport(
    companyId: string,
    fiscalYear: number,
    fiscalMonth?: number
  ): Promise<SalesReport> {
    try {
      const db = getDrizzle();
      
      // Define start and end dates
      let startDate: Date, endDate: Date;
      let periodLabel: string;
      
      if (fiscalMonth) {
        // Month-specific report
        startDate = new Date(fiscalYear, fiscalMonth - 1, 1);
        endDate = new Date(fiscalYear, fiscalMonth, 0);
        periodLabel = `${startDate.toLocaleString('default', { month: 'long' })} ${fiscalYear}`;
      } else {
        // Full year report
        startDate = new Date(fiscalYear, 0, 1);
        endDate = new Date(fiscalYear, 11, 31);
        periodLabel = `${fiscalYear}`;
      }
      
      // Query entries
      const entriesResult = await db
        .select()
        .from(accountingLedgerEntries)
        .where(and(
          eq(accountingLedgerEntries.companyId, companyId),
          eq(accountingLedgerEntries.type, LedgerEntryType.SALES),
          gte(accountingLedgerEntries.createdAt, startDate),
          lte(accountingLedgerEntries.createdAt, endDate)
        ))
        .orderBy(desc(accountingLedgerEntries.createdAt));
      
      // Get lines for each entry
      const entries = await Promise.all(
        entriesResult.map(async (entry) => {
          const lines = await db
            .select()
            .from(accountingLedgerLines)
            .where(eq(accountingLedgerLines.ledgerEntryId, entry.id));
          return { ...entry, lines };
        })
      );
      
      // Calculate totals
      let totalAmount = 0;
      let totalVat = 0;
      
      for (const entry of entries) {
        totalAmount += Number(entry.totalAmount ?? 0);
        
        // Get VAT amount from ledger lines (using fullAccountNumber instead of accountId)
        const vatLines = entry.lines.filter((line: { fullAccountNumber?: string }) => 
          line.fullAccountNumber === SALES_ACCOUNTS.VAT_COLLECTED
        );
        
        for (const vatLine of vatLines) {
          totalVat += Number(vatLine.creditAmount ?? 0) - Number(vatLine.debitAmount ?? 0);
        }
      }
      
      const mappedEntries = entries.map((entry) => this.mapToSalesJournalEntry(entry));
      
      // Create report
      const report: SalesReport = {
        period: periodLabel,
        totalSales: totalAmount,
        totalVat: totalVat,
        netSales: totalAmount - totalVat,
        invoiceCount: entries.length,
        entries: mappedEntries
      };
      
      return report;
    } catch (error) {
      console.error('Error generating sales report:', error);
      throw new Error('Failed to generate sales report');
    }
  }
  
  /**
   * Generate customer sales report
   * @param companyId Company ID
   * @param customerId Customer ID
   * @param fiscalYear Fiscal year
   * @returns Sales report for the customer
   */
  public async generateCustomerSalesReport(
    companyId: string,
    customerId: string,
    fiscalYear: number
  ): Promise<SalesReport> {
    try {
      const db = getDrizzle();
      
      // Define start and end dates for the fiscal year
      const startDate = new Date(fiscalYear, 0, 1);
      const endDate = new Date(fiscalYear, 11, 31);
      
      // Query entries for the specific customer
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.companyId, companyId),
          eq(invoices.customerId, customerId),
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate)
        ))
        .orderBy(desc(invoices.issueDate));
      
      // Get lines for each invoice
      const invoiceEntries = await Promise.all(
        invoiceResult.map(async (inv: InvoiceData) => {
          const lines = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, inv.id));
          return { ...inv, lines };
        })
      );
      
      // Calculate totals
      let totalAmount = 0;
      let totalVat = 0;
      
      for (const invoice of invoiceEntries) {
        if (invoice.type === 'CREDIT_NOTE') {
          // Corectare: verificăm type în loc de status
          totalAmount -= Number(invoice.amount);
          // Calculate VAT from lines
          for (const item of invoice.lines) {
            totalVat -= Number(item.vatAmount);
          }
        } else {
          totalAmount += Number(invoice.amount);
          // Calculate VAT from lines
          for (const item of invoice.lines) {
            totalVat += Number(item.vatAmount);
          }
        }
      }
      
      // Create report - simplified without ledger entries mapping
      const report: SalesReport = {
        period: `${fiscalYear} - Customer ${customerId}`,
        totalSales: totalAmount,
        totalVat: totalVat,
        netSales: totalAmount - totalVat,
        invoiceCount: invoiceEntries.length,
        entries: [] // Will be populated separately if needed
      };
      
      return report;
    } catch (error) {
      console.error('Error generating customer sales report:', error);
      throw new Error('Failed to generate customer sales report');
    }
  }
  
  /**
   * Get customer name by ID
   * @param customerId Customer ID
   * @returns Customer name or 'Unknown Customer' if not found
   */
  
  /**
   * Create a sales invoice entry
   * @param data Sales invoice data
   * @returns Created ledger entry
   */
  public async createSalesInvoiceEntry(data: SalesInvoiceData): Promise<LedgerEntryData> {
    const {
      companyId,
      franchiseId,
      invoiceNumber,
      invoiceId: _invoiceId,
      customerId: _customerId,
      customerName,
      amount,
      netAmount,
      vatAmount,
      vatRate,
      currency,
      exchangeRate,
      issueDate: _issueDate,
      dueDate: _dueDate,
      description,
      userId,
      isCashVAT = false // Default: nu este TVA la încasare
    } = data;
    
    // Create ledger lines
    const ledgerLines = [];
    
    // Debit customer account (Asset +)
    ledgerLines.push({
      accountId: SALES_ACCOUNTS.CUSTOMER,
      debitAmount: amount,
      creditAmount: 0,
      description: `Customer: ${customerName}`
    });
    
    // Credit VAT account (Liability +)
    // Pentru TVA la încasare, folosim contul 4428 (TVA neexigibilă)
    // Pentru TVA normal, folosim contul 4427 (TVA colectată)
    if (vatAmount > 0) {
      const vatAccountId = isCashVAT ? SALES_ACCOUNTS.VAT_DEFERRED : SALES_ACCOUNTS.VAT_COLLECTED;
      const vatDescription = isCashVAT 
        ? `TVA neexigibilă ${vatRate}%: ${invoiceNumber}` 
        : `VAT ${vatRate}%: ${invoiceNumber}`;
      
      ledgerLines.push({
        accountId: vatAccountId,
        debitAmount: 0,
        creditAmount: vatAmount,
        description: vatDescription
      });
    }
    
    // Credit revenue account (Revenue +)
    ledgerLines.push({
      accountId: SALES_ACCOUNTS.REVENUE,
      debitAmount: 0,
      creditAmount: netAmount,
      description: `Sales revenue: ${invoiceNumber}`
    });
    
    // If foreign currency, add exchange difference entries if needed
    if (currency !== 'RON' && exchangeRate !== 1) {
      // TODO: Add exchange difference calculations and entries
      // This would require comparing the exchange rate on the invoice date
      // with the official BNR rate on that date, and creating appropriate entries
    }
    
    // Create the ledger entry
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      franchiseId,
      type: LedgerEntryType.SALES,
      referenceNumber: invoiceNumber,
      amount,
      description: description || `Sales invoice ${invoiceNumber} to ${customerName}`,
      userId,
      lines: ledger_lines
    });
    
    return entry;
  }
  
  /**
   * Metode pentru receipts (bonuri de vânzare cash)
   */
  public async createSalesReceipt(_receiptData: Partial<InvoiceData>): Promise<string> {
    // Placeholder - ar trebui implementat complet
    return uuidv4();
  }
  
  public async getSalesReceipt(_receiptId: string, _companyId: string): Promise<InvoiceData | null> {
    // Placeholder
    return null;
  }
  
  public async getSalesReceipts(_companyId: string, page: number, limit: number, _startDate?: Date, _endDate?: Date, _customerId?: string): Promise<PaginatedResponse<InvoiceData>> {
    return { data: [], total: 0, page, limit };
  }
  
  /**
   * Metode pentru ledger entries
   */
  public async createSalesLedgerEntry(ledgerEntryData: LedgerEntryInputData): Promise<string> {
    // Folosește JournalService
    const entry = await this.journalService.createLedgerEntry({
      companyId: ledgerEntryData.companyId,
      franchiseId: ledgerEntryData.franchiseId,
      type: LedgerEntryType.SALES,
      referenceNumber: ledgerEntryData.referenceNumber,
      amount: ledgerEntryData.amount,
      description: ledgerEntryData.description,
      userId: ledgerEntryData.userId,
      lines: ledgerEntryData.lines
    });
    return entry.id;
  }
  
  public async getSalesLedgerEntry(entryId: string, companyId: string): Promise<SalesJournalEntry | null> {
    return await this.getSalesJournalEntry(entryId, companyId);
  }
  
  public async getSalesLedgerEntries(companyId: string, page: number, limit: number, _startDate?: Date, _endDate?: Date): Promise<{ entries: SalesJournalEntry[]; total: number; page: number; limit: number }> {
    return await this.getSalesJournalEntries(companyId, page, limit);
  }
  
  /**
   * Customer statements and balances
   */
  public async generateCustomerAccountStatement(companyId: string, customerId: string, startDate?: Date, endDate?: Date): Promise<ReportData & { customerId: string }> {
    // Simplified implementation
    return {
      companyId,
      customerId,
      period: { start: startDate, end: endDate },
      transactions: [],
      openingBalance: 0,
      closingBalance: 0
    };
  }
  
  public async getCustomerBalanceAsOf(companyId: string, customerId: string, asOfDate: Date): Promise<{ companyId: string; customerId: string; asOfDate: Date; balance: number; currency: string }> {
    return {
      companyId,
      customerId,
      asOfDate,
      balance: 0,
      currency: 'RON'
    };
  }
  
  /**
   * Sales reports by period/product
   */
  public async generateSalesByPeriodReport(companyId: string, startDate?: Date, _endDate?: Date, _groupBy?: string): Promise<SalesReport> {
    return await this.generateSalesReport(companyId, startDate?.getFullYear() || new Date().getFullYear());
  }
  
  public async generateSalesByProductReport(companyId: string, startDate?: Date, endDate?: Date): Promise<{ companyId: string; period: { start?: Date; end?: Date }; products: unknown[]; totalSales: number }> {
    return {
      companyId,
      period: { start: startDate, end: endDate },
      products: [],
      totalSales: 0
    };
  }
  
  /**
   * Transfer VAT from deferred to collected when payment is received
   * Pentru facturi cu TVA la încasare, când se primește plata
   * @param invoiceId Invoice ID
   * @param paymentAmount Amount received
   * @param paymentDate Date of payment
   * @param userId User making the transfer
   * @returns Created ledger entry for VAT transfer
   */
  public async transferDeferredVAT(
    invoiceId: string,
    paymentAmount: number,
    _paymentDate: Date,
    userId?: string
  ): Promise<LedgerEntryData | null> {
    try {
      const db = getDrizzle();
      
      // Get the invoice to check if it has deferred VAT
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      if (invoiceResult.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult[0];
      
      if (!invoice.isCashVAT) {
        // Invoice doesn't have cash VAT
        return null;
      }
      
      // Calculate VAT proportion based on payment amount
      const totalAmount = Number(invoice.amount);
      const vatAmount = Number(invoice.vatAmount);
      const paymentRatio = paymentAmount / totalAmount;
      const vatToTransfer = vatAmount * paymentRatio;
      
      // Create ledger entry for VAT transfer
      // Debit 4428 (TVA neexigibilă) and Credit 4427 (TVA colectată)
      const ledgerLines = [];
      
      ledgerLines.push({
        accountId: SALES_ACCOUNTS.VAT_DEFERRED,
        debitAmount: vatToTransfer,
        creditAmount: 0,
        description: `Transfer TVA din neexigibil pentru factura ${invoice.invoiceNumber}`
      });
      
      ledgerLines.push({
        accountId: SALES_ACCOUNTS.VAT_COLLECTED,
        debitAmount: 0,
        creditAmount: vatToTransfer,
        description: `TVA devenit exigibil pentru factura ${invoice.invoiceNumber}`
      });
      
      // Create the ledger entry
      const entry = await this.journalService.createLedgerEntry({
        companyId: invoice.companyId,
        franchiseId: invoice.franchiseId || undefined,
        type: LedgerEntryType.SALES,
        referenceNumber: `TVA-${invoice.invoiceNumber}`,
        amount: vatToTransfer,
        description: `Transfer TVA la încasare pentru factura ${invoice.invoiceNumber} - plată ${paymentAmount} RON`,
        userId,
        lines: ledger_lines
      });
      
      return entry;
    } catch (error) {
      console.error('Error transferring deferred VAT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to transfer deferred VAT: ${errorMessage}`);
    }
  }
  
  /**
   * Create a sales credit note entry (return/refund)
   * This would reverse the sales entry
   */
  public async createSalesCreditNoteEntry(
    invoiceData: SalesInvoiceData,
    creditNoteNumber: string,
    reason: string
  ): Promise<LedgerEntryData> {
    // Copy invoice data but reverse the entry
    const creditNoteData: SalesInvoiceData = {
      ...invoiceData,
      invoiceNumber: creditNoteNumber,
      description: `Credit note ${creditNoteNumber} for invoice ${invoiceData.invoiceNumber}: ${reason}`
    };
    
    // Create ledger lines (reversed compared to sales invoice)
    const ledgerLines = [];
    
    // Credit customer account (Asset -)
    ledgerLines.push({
      accountId: SALES_ACCOUNTS.CUSTOMER,
      debitAmount: 0,
      creditAmount: creditNoteData.amount,
      description: `Credit to customer: ${creditNoteData.customerName}`
    });
    
    // Debit VAT collected account (Liability -)
    if (creditNoteData.vatAmount > 0) {
      ledgerLines.push({
        accountId: SALES_ACCOUNTS.VAT_COLLECTED,
        debitAmount: creditNoteData.vatAmount,
        creditAmount: 0,
        description: `VAT ${creditNoteData.vatRate}% reversal: ${creditNoteNumber}`
      });
    }
    
    // Debit revenue account (Revenue -)
    ledgerLines.push({
      accountId: SALES_ACCOUNTS.REVENUE,
      debitAmount: creditNoteData.netAmount,
      creditAmount: 0,
      description: `Sales revenue reversal: ${creditNoteNumber}`
    });
    
    // Create the ledger entry
    const entry = await this.journalService.createLedgerEntry({
      companyId: creditNoteData.companyId,
      franchiseId: creditNoteData.franchiseId,
      type: LedgerEntryType.SALES,
      referenceNumber: creditNoteNumber,
      amount: creditNoteData.amount,
      description: creditNoteData.description,
      userId: creditNoteData.userId,
      lines: ledger_lines
    });
    
    return entry;
  }
  
  /**
   * Map from ledger entry to sales journal entry
   * @param entry Ledger entry with lines
   * @returns Sales journal entry
   */
  private mapToSalesJournalEntry(entry: { 
    id: string; 
    companyId: string; 
    franchiseId?: string | null; 
    type: string; 
    documentNumber?: string | null; 
    totalAmount?: string | null; 
    description?: string | null; 
    createdAt: Date | string; 
    updatedAt?: Date | string | null; 
    lines: Array<Record<string, unknown>>
  }): SalesJournalEntry {
    // Extract customer information from the entry
    const customerId = '';
    let customerName = '';
    
    // Look for customer info in the description
    const description = entry.description ?? '';
    if (description && description.includes('to ')) {
      customerName = description.split('to ').pop()?.trim() ?? '';
    }
    
    // Look for customer info in the ledger lines
    if (entry.lines) {
      for (const line of entry.lines) {
        const lineDesc = (line['description'] as string | null | undefined) ?? '';
        const lineAccount = line['fullAccountNumber'] as string | null | undefined;
        if (lineAccount === SALES_ACCOUNTS.CUSTOMER && lineDesc) {
          const match = lineDesc.match(/Customer: (.+)/);
          if (match && match[1]) {
            customerName = match[1];
          }
        }
      }
    }
    
    return {
      id: entry.id,
      companyId: entry.companyId,
      franchiseId: entry.franchiseId || undefined,
      entryType: entry.type,
      referenceNumber: entry.documentNumber ?? '',
      amount: Number(entry.totalAmount ?? 0),
      description: description,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt || entry.createdAt),
      customerId,
      customerName,
      lines: (entry.lines || []) as InvoiceItemData[]
    };
  }
  
  /**
   * Validate a sales invoice
   * @param invoiceData Sales invoice data
   * @returns Validation result
   */
  public validateSalesInvoice(invoiceData: Partial<InvoiceData> & { lines?: InvoiceItemData[] }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    if (!invoiceData.invoiceNumber) {
      errors.push('Invoice number is required');
    }
    
    if (!invoiceData.customerId) {
      errors.push('Customer ID is required');
    }
    
    if (!invoiceData.issueDate) {
      errors.push('Issue date is required');
    }
    
    if (!invoiceData.lines || !Array.isArray(invoiceData.lines) || invoiceData.lines.length === 0) {
      errors.push('Invoice must have at least one line');
    } else {
      // Check invoice lines
      for (const [index, item] of invoiceData.lines.entries()) {
        if (!item.productName) {
          errors.push(`Item #${index + 1}: Product name is required`);
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
      const totalNet = invoiceData.lines.reduce((sum: number, item: InvoiceItemData) => {
        return sum + Number(item.netAmount);
      }, 0);
      
      if (invoiceData.netTotal && Math.abs(Number(invoiceData.netTotal) - totalNet) > 0.01) {
        errors.push("Invoice net total does not match sum of line net amounts");
      }
      
      const totalVat = invoiceData.lines.reduce((sum: number, item: InvoiceItemData) => {
        return sum + Number(item.vatAmount);
      }, 0);
      
      if (invoiceData.vatTotal && Math.abs(Number(invoiceData.vatTotal) - totalVat) > 0.01) {
        errors.push("Invoice VAT total does not match sum of line VAT amounts");
      }
      
      const totalGross = invoiceData.lines.reduce((sum: number, item: InvoiceItemData) => {
        return sum + Number(item.grossAmount);
      }, 0);
      
      if (invoiceData.grossTotal && Math.abs(Number(invoiceData.grossTotal) - totalGross) > 0.01) {
        errors.push("Invoice gross total does not match sum of line gross amounts");
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * =========================================================================
   * ÎNREGISTRARE PLĂȚI ȘI TRANSFER TVA LA ÎNCASARE
   * =========================================================================
   */
  
  /**
   * Înregistrare plată pentru factură
   * Include transfer automat TVA pentru facturi cu TVA la încasare
   * 
   * @param paymentData Date plată
   * @returns ID-ul plății create
   */
  public async recordInvoicePayment(paymentData: {
    invoiceId: string;
    companyId: string;
    paymentDate: Date;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    notes?: string;
    userId?: string;
  }): Promise<string> {
    try {
      const db = getDrizzle();
      
      // 1. Verifică că factura există
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.id, paymentData.invoiceId),
          eq(invoices.companyId, paymentData.companyId)
        ))
        .limit(1);
      
      if (!invoice) {
        throw new Error(`Invoice not found: ${paymentData.invoiceId}`);
      }
      
      // 2. Inserează plata
      const [payment] = await db.insert(invoicePayments).values({
        invoiceId: paymentData.invoiceId,
        companyId: paymentData.companyId,
        paymentDate: paymentData.paymentDate,
        amount: String(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        notes: paymentData.notes,
        createdBy: paymentData.userId
      }).returning();
      
      // 3. Dacă factura are TVA la încasare, transferă TVA proporțional
      if (invoice.isCashVAT && invoice.vatAmount && Number(invoice.vatAmount) > 0) {
        const vatTransferEntry = await this.transferDeferredVAT(
          paymentData.invoiceId,
          paymentData.amount,
          paymentData.paymentDate,
          paymentData.userId
        );
        
        // Actualizează plata cu referința către nota de transfer TVA
        if (vatTransferEntry) {
          await db.update(invoicePayments)
            .set({
              vatTransferLedgerId: vatTransferEntry.id,
              vatAmountTransferred: String(
                Number(invoice.vatAmount) * (paymentData.amount / Number(invoice.amount))
              ),
              updatedAt: new Date()
            })
            .where(eq(invoicePayments.id, payment.id));
        }
      }
      
      return payment.id;
    } catch (error) {
      console.error('Error recording invoice payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record payment: ${errorMessage}`);
    }
  }
  
  /**
   * Obține toate plățile pentru o factură
   */
  public async getInvoicePayments(invoiceId: string, companyId: string): Promise<InvoicePayment[]> {
    try {
      const db = getDrizzle();
      
      const payments = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.invoiceId, invoiceId),
          eq(invoicePayments.companyId, companyId)
        ))
        .orderBy(invoicePayments.paymentDate);
      
      return payments;
    } catch (error) {
      console.error('Error getting invoice payments:', error);
      throw new Error('Failed to retrieve payments');
    }
  }
  
  /**
   * Obține o plată specifică
   */
  public async getInvoicePayment(paymentId: string, companyId: string): Promise<InvoicePayment | null> {
    try {
      const db = getDrizzle();
      
      const [payment] = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.id, paymentId),
          eq(invoicePayments.companyId, companyId)
        ))
        .limit(1);
      
      return payment || null;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw new Error('Failed to retrieve payment');
    }
  }
  
  /**
   * Șterge o plată
   */
  public async deleteInvoicePayment(paymentId: string, companyId: string): Promise<void> {
    try {
      const db = getDrizzle();
      
      await db.delete(invoicePayments)
        .where(and(
          eq(invoicePayments.id, paymentId),
          eq(invoicePayments.companyId, companyId)
        ));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment');
    }
  }
  
  /**
   * =========================================================================
   * GENERARE JURNAL DE VÂNZĂRI - CONFORM OMFP 2634/2015
   * =========================================================================
   */
  
  /**
   * Generare Jurnal de Vânzări pentru o perioadă
   * 
   * Această metodă implementează cerințele OMFP 2634/2015 pentru jurnalul de vânzări,
   * incluzând toate coloanele obligatorii și tratamentul special pentru TVA la încasare.
   * 
   * @param params Parametri generare jurnal
   * @returns Raport complet jurnal de vânzări
   */
  public async generateSalesJournal(params: GenerateSalesJournalParams): Promise<SalesJournalReport> {
    const {
      companyId,
      periodStart,
      periodEnd,
      reportType = 'DETAILED',
      includeZeroVAT: _includeZeroVAT = true,
      includeCanceled = false,
      customerFilter,
      categoryFilter
    } = params;
    
    try {
      const db = getDrizzle();
      
      // 1. Obține informații companie
      const [company] = await db
        .select({
          name: companies.name,
          fiscalCode: companies.fiscalCode,
          useCashVAT: companies.useCashVAT
        })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);
      
      if (!company) {
        throw new Error(`Company not found: ${companyId}`);
      }
      
      // 2. Construire condiții WHERE pentru facturi
      const conditions: WhereCondition[] = [
        eq(invoices.companyId, companyId),
        gte(invoices.issueDate, periodStart),
        lte(invoices.issueDate, periodEnd),
        isNotNull(invoices.invoiceNumber) // Doar facturi cu număr alocat
      ];
      
      // Includem doar facturile emise (status = issued sau sent)
      if (!includeCanceled) {
        conditions.push(eq(invoices.status, 'issued'));
      }
      
      if (customerFilter) {
        conditions.push(eq(invoices.customerId, customerFilter));
      }
      
      // 3. Selectare facturi din perioadă
      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
      const invoicesResult = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          series: invoices.series,
          number: invoices.number,
          date: invoices.date,
          issueDate: invoices.issueDate,
          customerId: invoices.customerId,
          customerName: invoices.customerName,
          amount: invoices.amount,
          totalAmount: invoices.totalAmount,
          netAmount: invoices.netAmount,
          vatAmount: invoices.vatAmount,
          status: invoices.status,
          type: invoices.type,
          isCashVAT: invoices.isCashVAT,
          relatedInvoiceId: invoices.relatedInvoiceId,
          description: invoices.description
        })
        .from(invoices)
        .where(whereClause)
        .orderBy(invoices.issueDate, invoices.invoiceNumber);
      
      // 4. Pentru fiecare factură, obținem liniile și detaliile client
      const journalRows: SalesJournalRow[] = [];
      let rowNumber = 1;
      
      for (const invoice of invoicesResult) {
        // Obține liniile facturii
        const lines = await db
          .select()
          .from(invoiceItems)
          .where(eq(invoiceItems.invoiceId, invoice.id));
        
        // Obține detalii client
        const [details] = await db
          .select()
          .from(invoiceDetails)
          .where(eq(invoiceDetails.invoiceId, invoice.id))
          .limit(1);
        
        // 5. Grupare linii pe categorie fiscală
        const linesByCategory = this.groupLinesByVATCategory(lines, details);
        
        // 6. Creare rânduri jurnal pentru fiecare categorie din factură
        // Dacă o factură are mai multe categorii (ex: 19% și 9%), vor fi mai multe rânduri
        for (const [category, categoryLines] of linesByCategory.entries()) {
          // Filtrare după categorie (dacă e setat filtru)
          if (categoryFilter && category !== categoryFilter) {
            continue;
          }
          
          // Calculare totaluri pe categorie
          const categoryTotals = this.calculateCategoryTotals(categoryLines);
          
          // Determinare dacă e factură storno (valori negative)
          const isStorno = invoice.type === 'CREDIT_NOTE';
          const multiplier = isStorno ? -1 : 1;
          
          // Construire rând jurnal
          const row = this.buildJournalRow(
            rowNumber++,
            invoice as unknown as InvoiceData,
            details,
            category,
            categoryTotals,
            multiplier
          );
          
          journalRows.push(row);
        }
      }
      
      // 7. Adaugă rânduri pentru încasări TVA la încasare (pseudo-documente)
      const paymentRows = await this.addCashVATPaymentRows(db, periodStart, periodEnd, companyId, journalRows);
      const allRows = [...journalRows, ...paymentRows];
      
      // 8. Renumerotare după adăugare plăți
      allRows.forEach((row, index) => {
        row.rowNumber = index + 1;
      });
      
      // 9. Calcul totaluri generale
      const totals = this.calculateJournalTotals(allRows);
      
      // 10. Verificări contabile automate
      const accountingValidation = await this.validateJournalWithAccounts(
        db,
        companyId,
        periodStart,
        periodEnd,
        totals
      );
      
      // 11. Construire raport final
      const report: SalesJournalReport = {
        companyId,
        companyName: company.name,
        companyFiscalCode: company.fiscalCode,
        periodStart,
        periodEnd,
        periodLabel: this.formatPeriodLabel(periodStart, periodEnd),
        generatedAt: new Date(),
        rows: allRows, // Include și rândurile de plăți
        totals,
        reportType,
        accountingValidation // Include verificările
      };
      
      return report;
    } catch (error) {
      console.error('Error generating sales journal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate sales journal: ${errorMessage}`);
    }
  }
  
  /**
   * Grupează liniile facturii pe categorie fiscală
   */
  private groupLinesByVATCategory(
    lines: InvoiceItemData[],
    clientDetails: InvoiceDetail | undefined
  ): Map<VATCategory, InvoiceItemData[]> {
    const grouped = new Map<VATCategory, InvoiceItemData[]>();
    
    for (const line of lines) {
      // Determină categoria fiscală
      let category: VATCategory;
      
      if (line.vatCategory) {
        // Folosim categoria setată explicit
        category = line.vatCategory as VATCategory;
      } else {
        // Determinare automată pe bază de date
        category = determineVATCategory(
          Number(line.vatRate),
          clientDetails?.partnerCountry || 'Romania',
          clientDetails?.partnerFiscalCode,
          false // reverse charge - ar trebui determinat din alte surse
        );
      }
      
      // Adaugă linia la categoria sa
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      const categoryLines = grouped.get(category);
      if (categoryLines) {
        categoryLines.push(line);
      }
    }
    
    return grouped;
  }
  
  /**
   * Calculează totalurile pentru o categorie fiscală
   */
  private calculateCategoryTotals(lines: InvoiceItemData[]): { base: number; vat: number } {
    let base = 0;
    let vat = 0;
    
    for (const line of lines) {
      base += Number(line.netAmount);
      vat += Number(line.vatAmount);
    }
    
    return { base, vat };
  }
  
  /**
   * Construiește un rând în jurnalul de vânzări
   */
  private buildJournalRow(
    rowNumber: number,
    invoice: InvoiceData,
    clientDetails: InvoiceDetail | undefined,
    category: VATCategory,
    totals: { base: number; vat: number },
    multiplier: number
  ): SalesJournalRow {
    // Inițializare rând cu toate valorile la 0
    const row: SalesJournalRow = {
      rowNumber,
      date: invoice.issueDate,
      documentNumber: invoice.invoiceNumber || `${invoice.series}-${invoice.number}`,
      documentType: invoice.type || 'INVOICE',
      clientName: clientDetails?.partnerName || invoice.customerName || 'Unknown',
      clientFiscalCode: clientDetails?.partnerFiscalCode || '',
      clientCountry: clientDetails?.partnerCountry || 'Romania',
      totalAmount: Number(invoice.amount) * multiplier,
      // Inițializare toate categoriile la 0
      base19: 0,
      vat19: 0,
      base9: 0,
      vat9: 0,
      base5: 0,
      vat5: 0,
      exemptWithCredit: 0,
      exemptNoCredit: 0,
      intraCommunity: 0,
      export: 0,
      reverseCharge: 0,
      notSubject: 0,
      isCashVAT: invoice.isCashVAT || false,
      vatDeferred: 0,
      vatCollected: 0,
      relatedInvoiceNumber: invoice.relatedInvoiceId ? `Storno pentru ${invoice.relatedInvoiceId}` : undefined
    };
    
    // Populare coloane specifice categoriei
    switch (category) {
      case VATCategory.STANDARD_19:
        row.base19 = totals.base * multiplier;
        row.vat19 = totals.vat * multiplier;
        break;
      case VATCategory.REDUCED_9:
        row.base9 = totals.base * multiplier;
        row.vat9 = totals.vat * multiplier;
        break;
      case VATCategory.REDUCED_5:
        row.base5 = totals.base * multiplier;
        row.vat5 = totals.vat * multiplier;
        break;
      case VATCategory.EXEMPT_WITH_CREDIT:
        // Poate fi IC sau Export - determinăm
        if (clientDetails?.partnerCountry && clientDetails.partnerCountry !== 'Romania') {
          const isEU = this.isEUCountry(clientDetails.partnerCountry);
          if (isEU) {
            row.intraCommunity = totals.base * multiplier;
          } else {
            row.export = totals.base * multiplier;
          }
        } else {
          row.exemptWithCredit = totals.base * multiplier;
        }
        break;
      case VATCategory.EXEMPT_NO_CREDIT:
        row.exemptNoCredit = totals.base * multiplier;
        break;
      case VATCategory.REVERSE_CHARGE:
        row.reverseCharge = totals.base * multiplier;
        break;
      case VATCategory.NOT_SUBJECT:
      case VATCategory.ZERO_RATE:
        row.notSubject = totals.base * multiplier;
        break;
    }
    
    // TVA la încasare - determinare exigibil vs neexigibil
    if (invoice.isCashVAT) {
      // Pentru moment, tot TVA-ul e neexigibil la emitere
      // Încasările vor fi tratate ca rânduri separate în jurnal (vezi metoda următoare)
      row.vatDeferred = totals.vat * multiplier;
      row.vatCollected = 0;
    } else {
      // TVA normal - tot exigibil la emitere
      row.vatDeferred = 0;
      row.vatCollected = totals.vat * multiplier;
    }
    
    return row;
  }
  
  /**
   * Adaugă în jurnal rânduri pentru încasări de facturi cu TVA la încasare
   * Acestea sunt "pseudo-documente" care arată TVA devenit exigibil
   */
  private async addCashVATPaymentRows(
    db: ReturnType<typeof getDrizzle>,
    periodStart: Date,
    periodEnd: Date,
    companyId: string,
    existingRows: SalesJournalRow[]
  ): Promise<SalesJournalRow[]> {
    try {
      // Găsește toate plățile din perioadă pentru facturi cu TVA la încasare
      const paymentsInPeriod = await db
        .select({
          paymentId: invoicePayments.id,
          paymentDate: invoicePayments.paymentDate,
          paymentAmount: invoicePayments.amount,
          paymentReference: invoicePayments.paymentReference,
          vatTransferred: invoicePayments.vatAmountTransferred,
          invoiceId: invoicePayments.invoiceId,
          invoiceNumber: invoices.invoiceNumber,
          clientName: invoiceDetails.partnerName,
          clientFiscalCode: invoiceDetails.partnerFiscalCode
        })
        .from(invoicePayments)
        .innerJoin(invoices, eq(invoicePayments.invoiceId, invoices.id))
        .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
        .where(and(
          eq(invoicePayments.companyId, companyId),
          gte(invoicePayments.paymentDate, periodStart),
          lte(invoicePayments.paymentDate, periodEnd),
          eq(invoices.isCashVAT, true),
          isNotNull(invoicePayments.vatAmountTransferred)
        ))
        .orderBy(invoicePayments.paymentDate);
      
      const paymentRows: SalesJournalRow[] = [];
      let rowNumber = existingRows.length + 1;
      
      for (const payment of paymentsInPeriod) {
        // Creează rând pseudo-document pentru încasare
        const row: SalesJournalRow = {
          rowNumber: rowNumber++,
          date: payment.paymentDate,
          documentNumber: `ÎNCAS-${payment.invoiceNumber}`,
          documentType: 'PAYMENT',
          clientName: payment.clientName || 'Unknown',
          clientFiscalCode: payment.clientFiscalCode || '',
          clientCountry: 'Romania',
          totalAmount: 0, // Nu afectează totalul - e doar transfer TVA
          base19: 0,
          vat19: 0,
          base9: 0,
          vat9: 0,
          base5: 0,
          vat5: 0,
          exemptWithCredit: 0,
          exemptNoCredit: 0,
          intraCommunity: 0,
          export: 0,
          reverseCharge: 0,
          notSubject: 0,
          isCashVAT: true,
          vatDeferred: -Number(payment.vatTransferred), // Scade din neexigibil
          vatCollected: Number(payment.vatTransferred),  // Crește exigibil
          paymentReference: payment.paymentReference || undefined,
          notes: `TVA devenit exigibil pentru factura ${payment.invoiceNumber}`
        };
        
        paymentRows.push(row);
      }
      
      return paymentRows;
    } catch (error) {
      console.error('Error adding cash VAT payment rows:', error);
      return []; // Return empty array on error, don't break the whole journal
    }
  }
  
  /**
   * Calculează totalurile generale pentru jurnal
   */
  private calculateJournalTotals(rows: SalesJournalRow[]): SalesJournalTotals {
    const totals: SalesJournalTotals = {
      totalDocuments: rows.length,
      totalAmount: 0,
      totalBase19: 0,
      totalVAT19: 0,
      totalBase9: 0,
      totalVAT9: 0,
      totalBase5: 0,
      totalVAT5: 0,
      totalExemptWithCredit: 0,
      totalExemptNoCredit: 0,
      totalIntraCommunity: 0,
      totalExport: 0,
      totalReverseCharge: 0,
      totalNotSubject: 0,
      totalVATDeferred: 0,
      totalVATCollected: 0,
      totalNetAmount: 0,
      totalVATAmount: 0
    };
    
    for (const row of rows) {
      totals.totalAmount += row.totalAmount;
      totals.totalBase19 += row.base19;
      totals.totalVAT19 += row.vat19;
      totals.totalBase9 += row.base9;
      totals.totalVAT9 += row.vat9;
      totals.totalBase5 += row.base5;
      totals.totalVAT5 += row.vat5;
      totals.totalExemptWithCredit += row.exemptWithCredit;
      totals.totalExemptNoCredit += row.exemptNoCredit;
      totals.totalIntraCommunity += row.intraCommunity;
      totals.totalExport += row.export;
      totals.totalReverseCharge += row.reverseCharge;
      totals.totalNotSubject += row.notSubject;
      totals.totalVATDeferred += row.vatDeferred;
      totals.totalVATCollected += row.vatCollected;
    }
    
    // Calcul verificare
    totals.totalNetAmount = 
      totals.totalBase19 + totals.totalBase9 + totals.totalBase5 +
      totals.totalExemptWithCredit + totals.totalExemptNoCredit +
      totals.totalIntraCommunity + totals.totalExport +
      totals.totalReverseCharge + totals.totalNotSubject;
    
    totals.totalVATAmount = totals.totalVATDeferred + totals.totalVATCollected;
    
    return totals;
  }
  
  /**
   * Formatare etichetă perioadă
   */
  private formatPeriodLabel(start: Date, end: Date): string {
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const year = start.getFullYear();
    
    if (startMonth === endMonth) {
      const monthNames = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
      ];
      return `${monthNames[startMonth]} ${year}`;
    }
    
    return `${start.toLocaleDateString('ro-RO')} - ${end.toLocaleDateString('ro-RO')}`;
  }
  
  /**
   * Validează jurnalul cu balanța contabilă
   * Verifică consistența dintre totalurile jurnalului și soldurile conturilor
   */
  private async validateJournalWithAccounts(
    db: ReturnType<typeof getDrizzle>,
    companyId: string,
    periodStart: Date,
    _periodEnd: Date,
    totals: SalesJournalTotals
  ): Promise<{
    account4427Balance: number;
    account4428Balance: number;
    account707Balance: number;
    account4111Balance: number;
    isBalanced: boolean;
    discrepancies?: string[];
  }> {
    try {
      // Calculează solduri conturi pentru perioadă din ledger entries
      const periodYear = periodStart.getFullYear();
      const periodMonth = periodStart.getMonth() + 1;
      
      // Query pentru sold cont 4427 (TVA colectată)
      const vat4427 = await this.getAccountBalance(db, companyId, '4427', periodYear, periodMonth);
      
      // Query pentru sold cont 4428 (TVA neexigibilă)
      const vat4428 = await this.getAccountBalance(db, companyId, '4428', periodYear, periodMonth);
      
      // Query pentru sold cont 707 (Venituri)
      const revenue707 = await this.getAccountBalance(db, companyId, '707', periodYear, periodMonth);
      
      // Query pentru sold cont 4111 (Clienți)
      const clients4111 = await this.getAccountBalance(db, companyId, '4111', periodYear, periodMonth);
      
      // Verificări
      const discrepancies: string[] = [];
      
      // Verificare TVA colectată
      if (Math.abs(vat4427 - totals.totalVATCollected) > 0.01) {
        discrepancies.push(
          `TVA colectată: Jurnal ${totals.totalVATCollected.toFixed(2)} RON vs Cont 4427 ${vat4427.toFixed(2)} RON`
        );
      }
      
      // Verificare TVA neexigibilă
      if (Math.abs(vat4428 - totals.totalVATDeferred) > 0.01) {
        discrepancies.push(
          `TVA neexigibilă: Jurnal ${totals.totalVATDeferred.toFixed(2)} RON vs Cont 4428 ${vat4428.toFixed(2)} RON`
        );
      }
      
      // Verificare venituri
      if (Math.abs(revenue707 - totals.totalNetAmount) > 0.01) {
        discrepancies.push(
          `Venituri: Jurnal ${totals.totalNetAmount.toFixed(2)} RON vs Cont 707 ${revenue707.toFixed(2)} RON`
        );
      }
      
      return {
        account4427Balance: vat4427,
        account4428Balance: vat4428,
        account707Balance: revenue707,
        account4111Balance: clients4111,
        isBalanced: discrepancies.length === 0,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined
      };
    } catch (error) {
      console.error('Error validating journal with accounts:', error);
      return {
        account4427Balance: 0,
        account4428Balance: 0,
        account707Balance: 0,
        account4111Balance: 0,
        isBalanced: false,
        discrepancies: ['Nu s-au putut verifica soldurile contabile']
      };
    }
  }
  
  /**
   * Obține soldul unui cont pentru o perioadă
   */
  private async getAccountBalance(
    db: ReturnType<typeof getDrizzle>,
    companyId: string,
    accountCode: string,
    year: number,
    month: number
  ): Promise<number> {
    try {
      // Query suma creditelor - debitelor pentru cont în perioadă (using fullAccountNumber)
      const result = await db
        .select()
        .from(accountingLedgerLines)
        .innerJoin(accountingLedgerEntries, eq(accountingLedgerLines.ledgerEntryId, accountingLedgerEntries.id))
        .where(and(
          eq(accountingLedgerEntries.companyId, companyId),
          eq(accountingLedgerLines.fullAccountNumber, accountCode),
          gte(accountingLedgerEntries.createdAt, new Date(year, month - 1, 1)),
          lte(accountingLedgerEntries.createdAt, new Date(year, month, 0))
        ));
      
      let balance = 0;
      for (const row of result) {
        const credit = Number(row.accounting_ledger_lines.creditAmount || 0);
        const debit = Number(row.accounting_ledger_lines.debitAmount || 0);
        balance += credit - debit;
      }
      
      return balance;
    } catch (error) {
      console.error(`Error getting balance for account ${accountCode}:`, error);
      return 0;
    }
  }
  
  /**
   * Verifică dacă o țară este în UE
   */
  private isEUCountry(country: string): boolean {
    const euCountries = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Czechia',
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
      'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
      'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
    ];
    
    return euCountries.some(c => 
      c.toLowerCase() === country.toLowerCase() ||
      country.toLowerCase() === c.substring(0, 2).toLowerCase()
    );
  }
  
  /**
   * ============================================================================
   * REDIS CACHING & BULLMQ ASYNC OPERATIONS
   * ============================================================================
   */
  
  /**
   * Generate sales journal with caching
   * Checks cache first, generates if not found, then caches result
   * 
   * @param params Generation parameters
   * @param useCache Whether to use cache (default: true)
   * @returns Sales journal report
   */
  public async generateSalesJournalCached(
    params: GenerateSalesJournalParams,
    useCache: boolean = true
  ): Promise<SalesJournalReport> {
    // Build cache key
    const periodStart = params.periodStart.toISOString().split('T')[0];
    const periodEnd = params.periodEnd.toISOString().split('T')[0];
    
    // Check cache if enabled
    if (useCache) {
      await accountingCacheService.connect();
      
      if (accountingCacheService.isConnected()) {
        const cached = await accountingCacheService.getSalesJournal(
          params.companyId,
          periodStart,
          periodEnd
        );
        
        if (cached) {
          console.log(`Sales journal cache hit for ${params.companyId} ${periodStart}-${periodEnd}`, 'sales-journal-cache');
          return cached;
        }
      }
    }
    
    // Generate report (cache miss or disabled)
    console.log(`Generating sales journal for ${params.companyId} ${periodStart}-${periodEnd}`, 'sales-journal');
    const report = await this.generateSalesJournal(params);
    
    // Cache result
    if (useCache && accountingCacheService.isConnected()) {
      await accountingCacheService.setSalesJournal(
        params.companyId,
        periodStart,
        periodEnd,
        report
      );
      console.log(`Sales journal cached for ${params.companyId}`, 'sales-journal-cache');
    }
    
    return report;
  }
  
  /**
   * Queue sales journal generation for async processing
   * Returns job ID for tracking progress
   * 
   * @param params Generation parameters
   * @param userId User ID requesting the generation
   * @returns Job ID for tracking
   */
  public async generateSalesJournalAsync(
    params: GenerateSalesJournalParams,
    userId: string
  ): Promise<{ jobId: string; message: string }> {
    try {
      const periodStart = params.periodStart.toISOString().split('T')[0];
      const periodEnd = params.periodEnd.toISOString().split('T')[0];
      
      console.log(`Queueing async sales journal generation for ${params.companyId}`, 'sales-journal-async');
      
      const job = await accountingQueueService.queueSalesJournalGeneration({
        companyId: params.companyId,
        periodStart,
        periodEnd,
        reportType: params.reportType,
        userId
      });
      
      const jobId = job.id || 'unknown';
      return {
        jobId,
        message: `Sales journal generation queued. Job ID: ${jobId}`
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error queueing sales journal generation: ${errorMessage}`, 'sales-journal-error');
      throw error;
    }
  }
  
  /**
   * Invalidate sales journal cache after invoice modifications
   * Should be called after creating, updating, or deleting invoices
   * 
   * @param companyId Company ID
   * @param invoiceDate Invoice date (to determine which periods to invalidate)
   */
  public async invalidateSalesJournalCache(
    companyId: string,
    invoiceDate?: Date
  ): Promise<void> {
    try {
      await accountingCacheService.connect();
      
      if (!accountingCacheService.isConnected()) {
        return;
      }
      
      if (invoiceDate) {
        // Invalidate specific period
        const year = invoiceDate.getFullYear();
        const month = String(invoiceDate.getMonth() + 1).padStart(2, '0');
        const period = `${year}-${month}`;
        
        await accountingCacheService.invalidateSalesJournal(companyId, period);
        console.log(`Invalidated sales journal cache for ${companyId} period ${period}`, 'sales-journal-cache');
      } else {
        // Nuclear option - invalidate all periods for company
        await accountingCacheService.invalidateSalesJournal(companyId);
        console.log(`Invalidated all sales journal cache for ${companyId}`, 'sales-journal-cache');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error invalidating sales journal cache: ${errorMessage}`, 'sales-journal-error');
      // Don't throw - cache invalidation failures shouldn't break the main operation
    }
  }
}

export default SalesJournalService;