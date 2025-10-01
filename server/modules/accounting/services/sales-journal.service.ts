/**
 * Sales Journal Service
 * 
 * Specialized journal service for sales-related accounting operations.
 * Handles creating and managing sales invoice entries.
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from '../../../common/drizzle';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { invoices, invoiceLines, users } from '../../../../shared/schema';

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
  lines: any[];
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
}

/**
 * Romanian accounts for sales transactions
 * These would typically come from a database, but are hardcoded for this example
 */
export const SALES_ACCOUNTS = {
  // Class 4 - Third Party Accounts
  CUSTOMER: '4111', // Clients
  VAT_COLLECTED: '4427', // VAT collected
  
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
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions: any[] = [eq(invoices.companyId, companyId)];
      
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
        conditions.push(eq(invoices.status, status));
      }
      
      // Fetch invoices
      const result = await db.query.invoices.findMany({
        where: and(...conditions),
        with: {
          lines: true, // Relation name in schema is 'lines', not 'invoiceLines'
        },
        orderBy: (invoices, { desc }) => [desc(invoices.date)],
        limit,
        offset,
      });
      
      // Get total count
      const totalResult = await db.query.invoices.findMany({
        where: and(...conditions),
        columns: {
          id: true,
        },
      });
      
      // Enrich invoices with user names
      const enrichedData = await Promise.all(
        result.map(async (invoice) => {
          let createdByName = null;
          if (invoice.createdBy) {
            const user = await db.query.users.findFirst({
              where: eq(users.id, invoice.createdBy),
              columns: {
                firstName: true,
                lastName: true,
                username: true,
              },
            });
            if (user) {
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
  public async getCustomerInvoice(invoiceId: string, companyId: string): Promise<any | null> {
    try {
      const db = getDrizzle();
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, invoiceId),
          eq(invoices.companyId, companyId)
        ),
        with: {
          lines: true, // Relation name in schema is 'lines', not 'invoiceLines'
        },
      });
      
      return invoice || null;
    } catch (error) {
      console.error('Error getting customer invoice:', error);
      throw new Error('Failed to retrieve customer invoice');
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
    invoiceData: any,
    customer: any,
    items: any[],
    taxRates: any,
    paymentTerms: any,
    notes?: string
  ): Promise<string> {
    try {
      // For now, return a placeholder ID
      // Full implementation would insert into database
      const newId = uuidv4();
      console.log('Creating customer invoice:', { invoiceData, customer, items, taxRates, paymentTerms, notes });
      return newId;
    } catch (error) {
      console.error('Error creating customer invoice:', error);
      throw new Error('Failed to create customer invoice');
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
      
      // Get entries from journal service
      const db = getDrizzle();
      const result = await db.query.ledgerEntries.findMany({
        where: and(
          eq(invoices.companyId, companyId),
          eq(invoices.type, LedgerEntryType.SALES)
        ),
        with: {
          lines: true
        },
        orderBy: [desc(invoices.createdAt)],
        limit,
        offset
      });
      
      const entries = result.map(entry => this.mapToSalesJournalEntry(entry));
      
      // Get total count
      const totalCount = await db.query.ledgerEntries.findMany({
        where: and(
          eq(invoices.companyId, companyId),
          eq(invoices.type, LedgerEntryType.SALES)
        ),
        columns: {
          id: true
        }
      });
      
      return {
        entries,
        total: totalCount.length,
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
      const entry = await db.query.ledgerEntries.findFirst({
        where: and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.type, LedgerEntryType.SALES)
        ),
        with: {
          lines: true
        }
      });
      
      if (!entry) {
        return null;
      }
      
      return this.mapToSalesJournalEntry(entry);
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
    invoiceData: any,
    customer: any,
    items: any[],
    taxRates: any,
    paymentTerms: any,
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
      
      // Prepare data for journal entry
      const entryData: SalesInvoiceData = {
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceData.id || uuidv4(),
        customerId: customer.id,
        customerName: customer.name,
        amount: grossAmount,
        netAmount,
        vatAmount,
        vatRate: taxRates.standard || 19, // Default Romanian VAT rate
        currency: invoiceData.currency || 'RON',
        exchangeRate: invoiceData.exchangeRate || 1,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        description: notes || `Invoice ${invoiceData.invoiceNumber} to ${customer.name}`,
        userId: invoiceData.userId
      };
      
      // Create the invoice entry
      const entry = await this.createSalesInvoiceEntry(entryData);
      
      // Save invoice and items in database
      const db = getDrizzle();
      
      // Insert/update invoice
      await db.insert(invoices).values({
        id: entryData.invoiceId,
        companyId: entryData.companyId,
        franchiseId: entryData.franchiseId,
        invoiceNumber: entryData.invoiceNumber,
        customerId: entryData.customerId,
        amount: entryData.amount,
        currency: entryData.currency,
        exchangeRate: entryData.exchangeRate,
        issueDate: entryData.issueDate,
        dueDate: entryData.dueDate,
        status: 'VALIDATED',
        ledgerEntryId: entry.id,
        createdBy: entryData.userId || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: invoices.id,
        set: {
          status: 'VALIDATED',
          ledgerEntryId: entry.id,
          updatedAt: new Date()
        }
      });
      
      // Insert invoice items
      for (const item of items) {
        await db.insert(invoiceLines).values({
          id: item.id || uuidv4(),
          invoiceId: entryData.invoiceId,
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          netAmount: Number(item.netAmount),
          vatRate: Number(item.vatRate),
          vatAmount: Number(item.vatAmount),
          grossAmount: Number(item.grossAmount),
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: invoiceLines.id,
          set: {
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            netAmount: Number(item.netAmount),
            vatRate: Number(item.vatRate),
            vatAmount: Number(item.vatAmount),
            grossAmount: Number(item.grossAmount),
            updatedAt: new Date()
          }
        });
      }
      
      return entry.id;
    } catch (error) {
      console.error('Error creating sales invoice:', error);
      throw new Error(`Failed to create sales invoice: ${error.message}`);
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
    creditNoteData: any,
    relatedInvoiceId: string,
    customer: any,
    items: any[],
    taxRates: any,
    reason: string,
    notes: string
  ): Promise<string> {
    try {
      // Get the original invoice
      const db = getDrizzle();
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, relatedInvoiceId),
        with: {
          lines: true
        }
      });
      
      if (!invoice) {
        throw new Error(`Original invoice not found: ${relatedInvoiceId}`);
      }
      
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;
      
      // Prepare data for journal entry
      const entryData: SalesInvoiceData = {
        companyId: creditNoteData.companyId,
        franchiseId: creditNoteData.franchiseId,
        invoiceNumber: creditNoteData.creditNoteNumber,
        invoiceId: creditNoteData.id || uuidv4(),
        customerId: customer.id,
        customerName: customer.name,
        amount: grossAmount,
        netAmount,
        vatAmount,
        vatRate: taxRates.standard || 19, // Default Romanian VAT rate
        currency: creditNoteData.currency || 'RON',
        exchangeRate: creditNoteData.exchangeRate || 1,
        issueDate: new Date(creditNoteData.issueDate),
        dueDate: new Date(creditNoteData.dueDate || creditNoteData.issueDate),
        description: `Credit note ${creditNoteData.creditNoteNumber} for invoice ${invoice.invoiceNumber}: ${reason}`,
        userId: creditNoteData.userId
      };
      
      // Create the credit note entry
      const entry = await this.createSalesCreditNoteEntry(entryData, creditNoteData.creditNoteNumber, reason);
      
      // Save credit note in database
      await db.insert(invoices).values({
        id: entryData.invoiceId,
        companyId: entryData.companyId,
        franchiseId: entryData.franchiseId,
        invoiceNumber: entryData.invoiceNumber,
        customerId: entryData.customerId,
        amount: entryData.amount,
        currency: entryData.currency,
        exchangeRate: entryData.exchangeRate,
        issueDate: entryData.issueDate,
        dueDate: entryData.dueDate,
        status: 'CREDIT_NOTE',
        relatedInvoiceId,
        ledgerEntryId: entry.id,
        createdBy: entryData.userId || 'system',
        description: entryData.description,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Insert credit note items
      for (const item of items) {
        await db.insert(invoiceLines).values({
          id: uuidv4(),
          invoiceId: entryData.invoiceId,
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          netAmount: Number(item.netAmount),
          vatRate: Number(item.vatRate),
          vatAmount: Number(item.vatAmount),
          grossAmount: Number(item.grossAmount),
          originalItemId: item.originalItemId, // Reference to original invoice item
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return entry.id;
    } catch (error) {
      console.error('Error creating credit note:', error);
      throw new Error(`Failed to create credit note: ${error.message}`);
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
      const entries = await db.query.ledgerEntries.findMany({
        where: and(
          eq(invoices.companyId, companyId),
          eq(invoices.type, LedgerEntryType.SALES),
          gte(invoices.createdAt, startDate),
          lte(invoices.createdAt, endDate)
        ),
        with: {
          lines: true
        },
        orderBy: [desc(invoices.createdAt)]
      });
      
      // Calculate totals
      let totalAmount = 0;
      let totalVat = 0;
      
      for (const entry of entries) {
        totalAmount += Number(entry.amount);
        
        // Get VAT amount from ledger lines
        const vatLines = entry.lines.filter(line => 
          line.accountId === SALES_ACCOUNTS.VAT_COLLECTED
        );
        
        for (const vatLine of vatLines) {
          totalVat += Number(vatLine.creditAmount) - Number(vatLine.debitAmount);
        }
      }
      
      const mappedEntries = entries.map(entry => this.mapToSalesJournalEntry(entry));
      
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
      const invoiceEntries = await db.query.invoices.findMany({
        where: and(
          eq(invoices.companyId, companyId),
          eq(invoices.customerId, customerId),
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate)
        ),
        with: {
          lines: true
        },
        orderBy: [desc(invoices.issueDate)]
      });
      
      // Get ledger entries for invoices
      const ledgerEntryIds = invoiceEntries.map(inv => inv.ledgerEntryId).filter(Boolean);
      
      const ledgerEntries = await Promise.all(
        ledgerEntryIds.map(async (ledgerEntryId) => {
          if (!ledgerEntryId) return null;
          return this.journalService.getLedgerEntry(ledgerEntryId, companyId);
        })
      );
      
      const validLedgerEntries = ledgerEntries.filter(Boolean);
      
      // Calculate totals
      let totalAmount = 0;
      let totalVat = 0;
      
      for (const invoice of invoiceEntries) {
        if (invoice.status === 'CREDIT_NOTE') {
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
      
      // Get customer name
      const customer = invoiceEntries.length > 0 ? 
        { name: await this.getCustomerName(customerId) } : 
        { name: 'Unknown Customer' };
      
      // Map entries
      const mappedEntries = validLedgerEntries.map(entry => {
        if (!entry) return null;
        return this.mapToSalesJournalEntry(entry);
      }).filter(Boolean);
      
      // Create report
      const report: SalesReport = {
        period: `${fiscalYear} - ${customer.name}`,
        totalSales: totalAmount,
        totalVat: totalVat,
        netSales: totalAmount - totalVat,
        invoiceCount: invoiceEntries.length,
        entries: mappedEntries as SalesJournalEntry[]
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
  private async getCustomerName(customerId: string): Promise<string> {
    try {
      const db = getDrizzle();
      const customer = await db.query.customers.findFirst({
        where: eq(db.customers.id, customerId),
        columns: {
          name: true
        }
      });
      
      return customer?.name || 'Unknown Customer';
    } catch (error) {
      console.error('Error getting customer name:', error);
      return 'Unknown Customer';
    }
  }
  
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
      invoiceId,
      customerId,
      customerName,
      amount,
      netAmount,
      vatAmount,
      vatRate,
      currency,
      exchangeRate,
      issueDate,
      dueDate,
      description,
      userId
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
    
    // Credit VAT collected account (Liability +)
    if (vatAmount > 0) {
      ledgerLines.push({
        accountId: SALES_ACCOUNTS.VAT_COLLECTED,
        debitAmount: 0,
        creditAmount: vatAmount,
        description: `VAT ${vatRate}%: ${invoiceNumber}`
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
      lines: ledgerLines
    });
    
    return entry;
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
      lines: ledgerLines
    });
    
    return entry;
  }
  
  /**
   * Map from ledger entry to sales journal entry
   * @param entry Ledger entry
   * @returns Sales journal entry
   */
  private mapToSalesJournalEntry(entry: any): SalesJournalEntry {
    // Extract customer information from the entry
    let customerId = '';
    let customerName = '';
    
    // Look for customer info in the description
    if (entry.description && entry.description.includes('to ')) {
      customerName = entry.description.split('to ').pop().trim();
    }
    
    // Look for customer info in the ledger lines
    if (entry.lines) {
      for (const line of entry.lines) {
        if (line.accountId === SALES_ACCOUNTS.CUSTOMER && line.description) {
          const match = line.description.match(/Customer: (.+)/);
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
      referenceNumber: entry.referenceNumber,
      amount: Number(entry.amount),
      description: entry.description,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt || entry.createdAt),
      customerId,
      customerName,
      lines: entry.lines || []
    };
  }
  
  /**
   * Validate a sales invoice
   * @param invoiceData Sales invoice data
   * @returns Validation result
   */
  public validateSalesInvoice(invoiceData: any): { valid: boolean; errors: string[] } {
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
      const totalNet = invoiceData.lines.reduce((sum: number, item: any) => {
        return sum + Number(item.netAmount);
      }, 0);
      
      if (invoiceData.netTotal && Math.abs(Number(invoiceData.netTotal) - totalNet) > 0.01) {
        errors.push("Invoice net total does not match sum of line net amounts");
      }
      
      const totalVat = invoiceData.lines.reduce((sum: number, item: any) => {
        return sum + Number(item.vatAmount);
      }, 0);
      
      if (invoiceData.vatTotal && Math.abs(Number(invoiceData.vatTotal) - totalVat) > 0.01) {
        errors.push("Invoice VAT total does not match sum of line VAT amounts");
      }
      
      const totalGross = invoiceData.lines.reduce((sum: number, item: any) => {
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
}

export default SalesJournalService;