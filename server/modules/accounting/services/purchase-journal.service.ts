/**
 * Purchase Journal Service
 * 
 * Specialized journal service for purchase-related accounting operations.
 * Handles creating and managing purchase invoice entries according to Romanian accounting standards.
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { getDrizzle } from '../../../common/drizzle';
import { and, desc, eq, gte, lte, isNotNull } from 'drizzle-orm';
import { invoices, invoiceLines, invoiceDetails, invoicePayments, companies } from '../../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { VATCategory, determineVATCategory } from '../types/vat-categories';

/**
 * Purchase invoice data interface for entry creation
 */
export interface PurchaseInvoiceData {
  companyId: string;
  franchiseId?: string;
  invoiceNumber: string;
  invoiceId: string;
  supplierId: string;
  supplierName: string;
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
  expenseType: string; // Type of expense (goods, services, assets, etc.)
  deductibleVat: boolean; // Whether VAT is deductible
  isCashVAT?: boolean; // TVA la încasare flag
}

/**
 * Romanian accounts for purchase transactions
 * These would typically come from a database, but are hardcoded for this example
 */
export const PURCHASE_ACCOUNTS = {
  // Class 4 - Third Party Accounts
  SUPPLIER: '401', // Suppliers
  VAT_DEDUCTIBLE: '4426', // VAT deductible (exigibilă)
  VAT_DEFERRED: '4428', // TVA neexigibilă (pentru TVA la încasare)
  
  // Class 3 - Inventory Accounts
  MERCHANDISE: '371', // Merchandise inventory
  RAW_MATERIALS: '301', // Raw materials
  CONSUMABLES: '302', // Consumable materials
  
  // Class 6 - Expense Accounts
  UTILITIES: '605', // Utilities expenses
  SERVICES: '628', // Services performed by third parties
  MAINTENANCE: '611', // Maintenance and repairs
  
  // Class 2 - Fixed Asset Accounts
  EQUIPMENT: '213', // Equipment and machinery
  
  // Currency accounts
  EXCHANGE_DIFF_INCOME: '765', // Foreign exchange gains
  EXCHANGE_DIFF_EXPENSE: '665', // Foreign exchange losses
};

/**
 * Expense type enum
 */
export enum ExpenseType {
  MERCHANDISE = 'merchandise',
  RAW_MATERIALS = 'raw_materials',
  CONSUMABLES = 'consumables',
  UTILITIES = 'utilities',
  SERVICES = 'services',
  MAINTENANCE = 'maintenance',
  EQUIPMENT = 'equipment'
}

/**
 * Purchase journal service for purchase-related accounting operations
 */
export class PurchaseJournalService {
  private journalService: JournalService;
  
  /**
   * Constructor
   */
  constructor() {
    this.journalService = new JournalService();
  }
  
  /**
   * Get all supplier invoices with pagination and filtering
   * @param companyId Company ID
   * @param page Page number
   * @param limit Entries per page
   * @param startDate Filter by start date
   * @param endDate Filter by end date
   * @param supplierId Filter by supplier
   * @param status Filter by status
   * @returns Supplier invoices with pagination
   */
  public async getSupplierInvoices(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
    supplierId?: string,
    status?: string
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions: any[] = [
        eq(invoices.companyId, companyId),
        eq(invoices.type, 'PURCHASE') // Filter for purchase invoices
      ];
      
      if (startDate) {
        conditions.push(gte(invoices.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(invoices.date, endDate));
      }
      if (supplierId) {
        conditions.push(eq(invoices.customerId, supplierId)); // Using customerId for supplier
      }
      if (status) {
        // Status must be one of the enum values
        conditions.push(eq(invoices.status, status as 'draft' | 'issued' | 'sent' | 'canceled'));
      }
      
      // Fetch invoices with lines
      const result = await db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(desc(invoices.date))
        .limit(limit)
        .offset(offset);
      
      // Fetch invoice lines for each invoice
      const invoicesWithLines = await Promise.all(
        result.map(async (invoice) => {
          const lines = await db
            .select()
            .from(invoiceLines)
            .where(eq(invoiceLines.invoiceId, invoice.id));
          return { ...invoice, lines };
        })
      );
      
      // Get total count
      const totalResult = await db
        .select()
        .from(invoices)
        .where(and(...conditions));
      
      return {
        data: invoicesWithLines,
        total: totalResult.length,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error getting supplier invoices:', error);
      throw new Error('Failed to retrieve supplier invoices');
    }
  }
  
  /**
   * Get a single supplier invoice by ID
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @returns Supplier invoice or null
   */
  public async getSupplierInvoice(invoiceId: string, companyId: string): Promise<any | null> {
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
      
      if (!invoiceResult || invoiceResult.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult[0];
      const lines = await db
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, invoice.id));
      
      return { ...invoice, lines };
    } catch (error) {
      console.error('Error getting supplier invoice:', error);
      throw new Error('Failed to retrieve supplier invoice');
    }
  }
  
  /**
   * Record a supplier invoice
   * @param invoiceData Invoice data
   * @param supplier Supplier data
   * @param items Invoice items
   * @param taxRates Tax rates
   * @param paymentTerms Payment terms
   * @param notes Additional notes
   * @returns Created invoice ID
   */
  public async recordSupplierInvoice(
    invoiceData: any,
    supplier: any,
    items: any[],
    taxRates: any,
    paymentTerms: any,
    notes?: string
  ): Promise<string> {
    try {
      const db = getDrizzle();
      const invoiceId = invoiceData.id || uuidv4();
      
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;
      
      // Insert invoice
      await db.insert(invoices).values({
        id: invoiceId,
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        invoiceNumber: invoiceData.invoiceNumber,
        customerId: supplier.id, // Using customerId for supplierId
        customerName: supplier.name, // Using customerName for supplierName
        amount: grossAmount,
        totalAmount: grossAmount,
        netAmount: netAmount,
        vatAmount: vatAmount,
        currency: invoiceData.currency || 'RON',
        exchangeRate: invoiceData.exchangeRate || 1,
        date: new Date(invoiceData.issueDate),
        issueDate: new Date(invoiceData.issueDate),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
        status: 'issued',
        type: 'PURCHASE',
        description: notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`,
        createdBy: invoiceData.userId || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Insert invoice items
      for (const item of items) {
        await db.insert(invoiceLines).values({
          invoiceId: invoiceId,
          productId: item.productId || null,
          productName: item.productName || null,
          description: item.description || null,
          quantity: Number(item.quantity).toString(),
          unitPrice: Number(item.unitPrice).toString(),
          netAmount: Number(item.netAmount).toString(),
          vatRate: Number(item.vatRate),
          vatAmount: Number(item.vatAmount).toString(),
          grossAmount: Number(item.grossAmount).toString(),
          totalAmount: Number(item.grossAmount).toString(),
        } as any);
      }
      
      // CORECTARE CRITICĂ: Salvare date furnizor în invoice_details (CUI obligatoriu!)
      await db.insert(invoiceDetails).values({
        invoiceId: invoiceId,
        partnerId: supplier.id || null,
        partnerName: supplier.name || supplier.supplierName || 'Unknown',
        partnerFiscalCode: supplier.fiscalCode || supplier.cui || supplier.taxId || '',
        partnerRegistrationNumber: supplier.registrationNumber || supplier.regCom || '',
        partnerAddress: supplier.address || '',
        partnerCity: supplier.city || '',
        partnerCounty: supplier.county || supplier.state || null,
        partnerCountry: supplier.country || 'Romania',
        paymentMethod: paymentTerms?.method || 'bank_transfer',
        paymentDueDays: paymentTerms?.dueDays || 30,
        paymentDueDate: invoiceData.dueDate,
        notes: notes || null
      });
      
      // GENERARE AUTOMATĂ NOTĂ CONTABILĂ (Integrare în contabilitate)
      const entry = await this.createPurchaseInvoiceEntry({
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount: grossAmount,
        netAmount,
        vatAmount,
        vatRate: taxRates.standard || 19,
        currency: invoiceData.currency || 'RON',
        exchangeRate: invoiceData.exchangeRate || 1,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date(),
        description: notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`,
        userId: invoiceData.userId,
        expenseType: invoiceData.expenseType || 'services',
        deductibleVat: invoiceData.deductibleVat !== false
      });
      
      // Actualizare factură cu ledgerEntryId
      await db.update(invoices)
        .set({
          ledgerEntryId: entry.id,
          isValidated: true,
          validatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));
      
      return invoiceId;
    } catch (error) {
      console.error('Error recording supplier invoice:', error);
      throw new Error(`Failed to record supplier invoice: ${(error as Error).message}`);
    }
  }
  
  /**
   * Create a purchase invoice entry
   * @param data Purchase invoice data
   * @returns Created ledger entry
   */
  public async createPurchaseInvoiceEntry(data: PurchaseInvoiceData): Promise<LedgerEntryData> {
    const {
      companyId,
      franchiseId,
      invoiceNumber,
      invoiceId,
      supplierId,
      supplierName,
      amount,
      netAmount,
      vatAmount,
      vatRate,
      currency,
      exchangeRate,
      issueDate,
      dueDate,
      description,
      userId,
      expenseType,
      deductibleVat,
      isCashVAT = false
    } = data;
    
    // Get account for expense type
    const expenseAccount = this.getExpenseAccount(expenseType);
    
    // Create ledger lines
    const ledgerLines = [];
    
    // Credit supplier account (Liability +)
    ledgerLines.push({
      accountId: PURCHASE_ACCOUNTS.SUPPLIER,
      debitAmount: 0,
      creditAmount: amount,
      description: `Supplier: ${supplierName}, Invoice: ${invoiceNumber}`
    });
    
    // Debit VAT account (Asset +) if VAT is deductible
    // Pentru TVA la încasare folosim 4428, altfel 4426
    if (vatAmount > 0 && deductibleVat) {
      const vatAccount = isCashVAT ? PURCHASE_ACCOUNTS.VAT_DEFERRED : PURCHASE_ACCOUNTS.VAT_DEDUCTIBLE;
      const vatDescription = isCashVAT 
        ? `TVA neexigibilă ${vatRate}%: ${invoiceNumber}` 
        : `VAT ${vatRate}%: ${invoiceNumber}`;
      
      ledgerLines.push({
        accountId: vatAccount,
        debitAmount: vatAmount,
        creditAmount: 0,
        description: vatDescription
      });
    }
    
    // Debit expense or asset account
    ledgerLines.push({
      accountId: expenseAccount,
      debitAmount: netAmount,
      creditAmount: 0,
      description: `Purchase: ${invoiceNumber} from ${supplierName}`
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
      type: LedgerEntryType.PURCHASE,
      referenceNumber: invoiceNumber,
      amount,
      description: description || `Purchase invoice ${invoiceNumber} from ${supplierName}`,
      userId,
      lines: ledgerLines
    });
    
    return entry;
  }
  
  /**
   * Get the appropriate account for the expense type
   * @param expenseType Type of expense
   * @returns Account ID
   */
  private getExpenseAccount(expenseType: string): string {
    switch (expenseType) {
      case ExpenseType.MERCHANDISE:
        return PURCHASE_ACCOUNTS.MERCHANDISE;
      case ExpenseType.RAW_MATERIALS:
        return PURCHASE_ACCOUNTS.RAW_MATERIALS;
      case ExpenseType.CONSUMABLES:
        return PURCHASE_ACCOUNTS.CONSUMABLES;
      case ExpenseType.UTILITIES:
        return PURCHASE_ACCOUNTS.UTILITIES;
      case ExpenseType.SERVICES:
        return PURCHASE_ACCOUNTS.SERVICES;
      case ExpenseType.MAINTENANCE:
        return PURCHASE_ACCOUNTS.MAINTENANCE;
      case ExpenseType.EQUIPMENT:
        return PURCHASE_ACCOUNTS.EQUIPMENT;
      default:
        return PURCHASE_ACCOUNTS.SERVICES; // Default to services
    }
  }
  
  /**
   * Validate a purchase invoice
   * @param invoiceData Purchase invoice data
   * @returns Validation result
   */
  public validatePurchaseInvoice(invoiceData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields according to Romanian standards
    if (!invoiceData.invoiceNumber) {
      errors.push('Invoice number is required');
    }
    
    if (!invoiceData.supplierId) {
      errors.push('Supplier ID is required');
    }
    
    if (!invoiceData.issueDate) {
      errors.push('Issue date is required');
    }
    
    // Romanian law requires invoice date to be within the current fiscal period
    const currentDate = new Date();
    const invoiceDate = new Date(invoiceData.issueDate);
    const maxBackdatedDays = 15; // Romanian law allows backdating up to 15 days
    
    const daysDifference = Math.floor((currentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference > maxBackdatedDays) {
      errors.push(`Invoice date is too old. Maximum allowed backdating is ${maxBackdatedDays} days according to Romanian fiscal law`);
    }
    
    // Check for future dates which are not allowed
    if (invoiceDate > currentDate) {
      errors.push('Invoice date cannot be in the future');
    }
    
    // Check supplier fiscal information (required by Romanian tax law)
    if (!invoiceData.supplier) {
      errors.push('Supplier information is required');
    } else {
      if (!invoiceData.supplier.vatNumber && !invoiceData.supplier.fiscalCode) {
        errors.push('Supplier must have either a VAT number (CUI) or fiscal code (CIF)');
      }
      
      if (!invoiceData.supplier.registrationNumber) {
        errors.push('Supplier registration number (J number) is required');
      }
      
      if (!invoiceData.supplier.address) {
        errors.push('Supplier address is required');
      }
    }
    
    // Check VAT rate validity according to Romanian standards
    const validVatRates = [0, 5, 9, 19]; // Current Romanian VAT rates
    if (invoiceData.vatRate !== undefined && !validVatRates.includes(Number(invoiceData.vatRate))) {
      errors.push(`Invalid VAT rate. Valid rates in Romania are: ${validVatRates.join(', ')}%`);
    }
    
    // Check items
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      errors.push('Invoice must have at least one item');
    } else {
      // Check invoice items
      for (const [index, item] of invoiceData.items.entries()) {
        if (!item.description && !item.productName) {
          errors.push(`Item #${index + 1}: Description or product name is required`);
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
      const totalNet = invoiceData.items.reduce((sum: number, item: any) => {
        return sum + Number(item.netAmount);
      }, 0);
      
      if (invoiceData.netTotal && Math.abs(Number(invoiceData.netTotal) - totalNet) > 0.01) {
        errors.push("Invoice net total does not match sum of line net amounts");
      }
      
      const totalVat = invoiceData.items.reduce((sum: number, item: any) => {
        return sum + Number(item.vatAmount);
      }, 0);
      
      if (invoiceData.vatTotal && Math.abs(Number(invoiceData.vatTotal) - totalVat) > 0.01) {
        errors.push("Invoice VAT total does not match sum of line VAT amounts");
      }
      
      const totalGross = invoiceData.items.reduce((sum: number, item: any) => {
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
   * PARTEA 2 - PLĂȚI ȘI TRANSFER TVA
   */
  
  public async recordSupplierPayment(paymentData: any): Promise<string> {
    const db = getDrizzle();
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, paymentData.invoiceId)).limit(1);
    if (!invoice) throw new Error('Invoice not found');
    
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
    
    if (invoice.isCashVAT && invoice.vatAmount && Number(invoice.vatAmount) > 0) {
      const vatEntry = await this.transferDeferredVATForPurchases(paymentData.invoiceId, paymentData.amount, paymentData.paymentDate, paymentData.userId);
      if (vatEntry) {
        await db.update(invoicePayments).set({
          vatTransferLedgerId: vatEntry.id,
          vatAmountTransferred: String(Number(invoice.vatAmount) * (paymentData.amount / Number(invoice.amount)))
        }).where(eq(invoicePayments.id, payment.id));
      }
    }
    
    return payment.id;
  }
  
  public async transferDeferredVATForPurchases(invoiceId: string, paymentAmount: number, paymentDate: Date, userId?: string): Promise<LedgerEntryData | null> {
    const db = getDrizzle();
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!invoice || !invoice.isCashVAT) return null;
    
    const vatToTransfer = Number(invoice.vatAmount) * (paymentAmount / Number(invoice.amount));
    
    const entry = await this.journalService.createLedgerEntry({
      companyId: invoice.companyId,
      franchiseId: invoice.franchiseId || undefined,
      type: LedgerEntryType.PURCHASE,
      referenceNumber: `TVA-${invoice.invoiceNumber}`,
      amount: vatToTransfer,
      description: `Transfer TVA deductibil pentru ${invoice.invoiceNumber}`,
      userId,
      lines: [
        { accountId: PURCHASE_ACCOUNTS.VAT_DEDUCTIBLE, debitAmount: vatToTransfer, creditAmount: 0, description: 'TVA devenit deductibil' },
        { accountId: PURCHASE_ACCOUNTS.VAT_DEFERRED, debitAmount: 0, creditAmount: vatToTransfer, description: 'Transfer din TVA neexigibil' }
      ]
    });
    
    return entry;
  }
  
  /**
   * PARTEA 3 - GENERARE RAPORT JURNAL CUMPĂRĂRI
   */
  
  public async generatePurchaseJournal(params: any): Promise<any> {
    const { companyId, periodStart, periodEnd } = params;
    const db = getDrizzle();
    
    const [company] = await db.select({ name: companies.name, fiscalCode: companies.fiscalCode }).from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company) throw new Error('Company not found');
    
    const invoicesResult = await db.select().from(invoices).where(and(
      eq(invoices.companyId, companyId),
      eq(invoices.type, 'PURCHASE'),
      gte(invoices.issueDate, periodStart),
      lte(invoices.issueDate, periodEnd)
    )).orderBy(invoices.issueDate);
    
    const rows = [];
    for (const invoice of invoicesResult) {
      const [details] = await db.select().from(invoiceDetails).where(eq(invoiceDetails.invoiceId, invoice.id)).limit(1);
      const lines = await db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoice.id));
      
      rows.push({
        rowNumber: rows.length + 1,
        date: invoice.issueDate,
        documentNumber: invoice.invoiceNumber,
        supplierName: details?.partnerName || invoice.customerName,
        supplierFiscalCode: details?.partnerFiscalCode || '',
        totalAmount: Number(invoice.amount),
        base19: lines.filter(l => l.vatRate === 19).reduce((sum, l) => sum + Number(l.netAmount), 0),
        vat19: lines.filter(l => l.vatRate === 19).reduce((sum, l) => sum + Number(l.vatAmount), 0),
        vatDeductible: invoice.isCashVAT ? 0 : Number(invoice.vatAmount)
      });
    }
    
    return {
      companyId,
      companyName: company.name,
      companyFiscalCode: company.fiscalCode,
      periodStart,
      periodEnd,
      periodLabel: new Date(periodStart).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
      rows,
      totals: { totalAmount: rows.reduce((s, r) => s + r.totalAmount, 0) }
    };
  }
}

export default PurchaseJournalService;