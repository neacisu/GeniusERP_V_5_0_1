/**
 * Purchase Journal Service
 * 
 * Specialized journal service for purchase-related accounting operations.
 * Handles creating and managing purchase invoice entries according to Romanian accounting standards.
 * 
 * ENHANCED WITH:
 * - Redis caching for journal reports
 * - BullMQ async processing for heavy operations
 * - Cache invalidation on data modifications
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { getDrizzle } from "@common/drizzle";
import { and, desc, eq, gte, lte, isNotNull, sql } from 'drizzle-orm';
import { invoices, invoiceItems, invoiceDetails, invoicePayments, companies, users, ledgerEntries, ledgerLines } from '@geniuserp/shared';
import { crm_companies } from '@geniuserp/crm/schema';

import { v4 as uuidv4 } from 'uuid';

import { accountingCacheService } from './accounting-cache.service';
import { accountingQueueService } from './accounting-queue.service';
import { log } from "@api/vite";
import { createModuleLogger } from "@common/logger/loki-logger";

// Import all type definitions
import type {
  SupplierData,
  InvoiceItemData,
  PaymentTerms,
  TaxRates,
  InvoiceData,
  PaymentData,
  PaymentRecord,
  InvoiceWithLines,
  SupplierInvoiceListResponse,
  InvoiceValidationResult,
  PurchaseJournalReport,
  PurchaseJournalTotals,
  GeneratePurchaseJournalParams,
  SupplierStatementResponse,
  PurchaseJournalRow
} from '../types/purchase-journal-types';

const logger = createModuleLogger('purchase-journal');

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
  /**
   * Get all supplier invoices with pagination and filtering
   * 
   * IMPORTANT: Pentru facturi de tip PURCHASE, câmpurile din tabela `invoices`:
   * - customerId = ID-ul FURNIZORULUI (nu clientului!)
   * - customerName = Numele FURNIZORULUI (nu clientului!)
   * Această convenție este folosită deoarece tabela `invoices` este UNIFICATĂ
   * pentru ambele tipuri de facturi (SALES și PURCHASE).
   */
  public async getSupplierInvoices(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
    supplierId?: string,
    status?: string
  ): Promise<SupplierInvoiceListResponse> {
    try {
      const db = getDrizzle();
      const offset = (page - 1) * limit;
      
      // Build where conditions using SQL builders (not QueryCondition interface)
      const conditions = [
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
        // NOTE: For PURCHASE invoices, customerId field stores the supplier ID
        // This is a design choice to reuse the same table for both sales and purchase invoices
        const supplierIdForQuery = supplierId; // Alias for clarity: supplierId maps to customerId in DB
        conditions.push(eq(invoices.customerId, supplierIdForQuery)); // customerId = supplierId
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
      const invoicesWithLines: InvoiceWithLines[] = await Promise.all(
        result.map(async (invoice) => {
          const lines = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoice.id));
          
          // Transform DB types to match InvoiceWithLines interface
          return { 
            ...invoice, 
            lines: lines.map(line => ({
              productName: line.productName,
              description: line.description,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
              netAmount: Number(line.netAmount),
              vatRate: Number(line.vatRate),
              vatAmount: Number(line.vatAmount),
              grossAmount: Number(line.grossAmount),
              vatCategory: line.vatCategory || undefined,
              expenseType: undefined // Not in DB, used for categorization
            }))
          } as InvoiceWithLines;
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
  public async getSupplierInvoice(invoiceId: string, companyId: string): Promise<InvoiceWithLines | null> {
    try {
      const db = getDrizzle();

      // Get invoice with creator name
      const invoiceResult = await db
        .select({
          id: invoices.id,
          companyId: invoices.companyId,
          franchiseId: invoices.franchiseId,
          customerId: invoices.customerId, // NOTE: For PURCHASE invoices, this represents supplierId
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName,
          status: invoices.status,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          amount: invoices.amount,
          totalAmount: invoices.totalAmount,
          netAmount: invoices.netAmount,
          vatAmount: invoices.vatAmount,
          currency: invoices.currency,
          exchangeRate: invoices.exchangeRate,
          type: invoices.type,
          description: invoices.description,
          notes: invoices.notes,
          isValidated: invoices.isValidated,
          validatedAt: invoices.validatedAt,
          ledgerEntryId: invoices.ledgerEntryId,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          createdBy: invoices.createdBy,
          // Join with users table to get creator name
          createdByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        })
        .from(invoices)
        .leftJoin(users, eq(invoices.createdBy, users.id))
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.companyId, companyId)
        ))
        .limit(1);

      if (!invoiceResult || invoiceResult.length === 0) {
        return null;
      }

      const invoice = invoiceResult[0];
      const linesFromDB = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));
      
      // Transform DB lines to InvoiceItemData
      const lines: InvoiceItemData[] = linesFromDB.map(line => ({
        productName: line.productName,
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        netAmount: Number(line.netAmount),
        vatRate: Number(line.vatRate),
        vatAmount: Number(line.vatAmount),
        grossAmount: Number(line.grossAmount),
        vatCategory: line.vatCategory || undefined,
        expenseType: undefined
      }));

      // Transform to InvoiceWithLines
      const result: InvoiceWithLines = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        amount: invoice.amount,
        totalAmount: invoice.totalAmount,
        netAmount: invoice.netAmount,
        vatAmount: invoice.vatAmount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        type: invoice.type,
        description: invoice.description,
        createdBy: invoice.createdBy,
        lines
      };

      return result;
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
    invoiceData: InvoiceData,
    supplier: SupplierData,
    items: InvoiceItemData[],
    taxRates: TaxRates,
    paymentTerms: PaymentTerms,
    notes?: string
  ): Promise<string> {
    logger.info('Starting supplier invoice recording', { context: { invoiceNumber: invoiceData.invoiceNumber } });

    try {
      // Check if invoiceData exists and has the expected structure
      logger.info('Invoice data validation', {
        context: {
          hasInvoiceData: !!invoiceData,
          keys: invoiceData ? Object.keys(invoiceData) : []
        }
      });

      // Check specific problematic fields
      if (invoiceData) {
        logger.info('Invoice data fields check', {
          context: {
            companyId: invoiceData.companyId,
            companyIdType: typeof invoiceData.companyId,
            issueDate: invoiceData.issueDate,
            issueDateType: typeof invoiceData.issueDate,
            dueDate: invoiceData.dueDate,
            dueDateType: typeof invoiceData.dueDate
          }
        });
      }

      logger.info('Drizzle instance will be obtained');

      const invoiceId = invoiceData.id || uuidv4();
      logger.info('Invoice ID generated', { context: { invoiceId } });

      logger.info('Starting totals calculation', { context: { itemCount: items.length } });

      // Calculate totals
      const netAmount = items.reduce((sum, item) => {
        return sum + Number(item.netAmount);
      }, 0);
      logger.info('Net amount calculated', { context: { netAmount } });

      const vatAmount = items.reduce((sum, item) => {
        return sum + Number(item.vatAmount);
      }, 0);
      logger.info('VAT amount calculated', { context: { vatAmount } });

      const grossAmount = netAmount + vatAmount;
      logger.info('Gross amount calculated', { context: { grossAmount } });

      const db = getDrizzle();
      const actualInvoiceId = uuidv4();

      try {
        // Insert invoice using Drizzle ORM
        await db.insert(invoices).values({
          id: actualInvoiceId,
          companyId: invoiceData.companyId,
          invoiceNumber: invoiceData.invoiceNumber,
          customerName: supplier.name,
          amount: grossAmount.toString(),
          totalAmount: grossAmount.toString(),
          netAmount: netAmount.toString(),
          vatAmount: vatAmount.toString(),
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          type: 'PURCHASE',
          description: notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`,
          createdBy: invoiceData.userId || 'system'
        });

        // Insert invoice items using Drizzle ORM
        for (const item of items) {
          await db.insert(invoiceItems).values({
            invoiceId: actualInvoiceId,
            productName: item.productName || '',
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            netAmount: String(item.netAmount),
            vatRate: String(item.vatRate),
            vatAmount: String(item.vatAmount),
            grossAmount: String(item.grossAmount),
            sequence: 1
          });
        }

        // Insert supplier details using Drizzle ORM
        await db.insert(invoiceDetails).values({
          invoiceId: actualInvoiceId,
          partnerName: supplier.name || 'Furnizor necunoscut',
          partnerFiscalCode: supplier.fiscalCode || 'N/A',
          partnerRegistrationNumber: supplier.registrationNumber || null,
          partnerAddress: supplier.address || 'Adresă necunoscută',
          partnerCity: supplier.city || 'Oraș necunoscut',
          partnerCountry: supplier.country || 'Romania',
          paymentMethod: paymentTerms?.method || 'bank_transfer',
          paymentDueDays: paymentTerms?.dueDays || 30
        });

        logger.info('Successfully recorded purchase invoice with supplier details (OMFP 2634/2015 compliance)', {
          context: { invoiceId: actualInvoiceId }
        });

        // GENERARE AUTOMATĂ NOTĂ CONTABILĂ (Integrare în contabilitate)
        logger.info('Generating automatic accounting entry for purchase invoice', {
          context: { invoiceId: actualInvoiceId }
        });
        try {
          const entry = await this.createPurchaseInvoiceEntry({
            companyId: invoiceData.companyId,
            franchiseId: invoiceData.franchiseId,
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceId: actualInvoiceId,
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

          // Actualizare factură cu ledgerEntryId folosind Drizzle ORM
          await db.update(invoices)
            .set({
              ledgerEntryId: entry.id,
              isValidated: true,
              validatedAt: new Date()
            })
            .where(eq(invoices.id, actualInvoiceId));
          logger.info('Invoice validated and linked to ledger entry', {
            context: { invoiceId: actualInvoiceId, ledgerEntryId: entry.id }
          });
        } catch (accountingError) {
          logger.error('Warning: Failed to generate automatic accounting entry', {
            error: accountingError,
            context: { invoiceId: actualInvoiceId }
          });
          // Nu aruncăm eroare - înregistrarea facturii a reușit, doar nota contabilă a eșuat
        }

        return actualInvoiceId;

      } catch (error) {
        logger.error('Error recording supplier invoice', { error });
        throw new Error(`Failed to record supplier invoice: ${(error as Error).message}`);
      }
    } catch (error) {
      logger.error('Error recording supplier invoice (outer)', { error });
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
      invoiceId: _invoiceId,
      supplierId: _supplierId,
      supplierName,
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
  public validatePurchaseInvoice(invoiceData: InvoiceData): InvoiceValidationResult {
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
      const totalNet = invoiceData.items.reduce((sum: number, item: InvoiceItemData) => {
        return sum + Number(item.netAmount);
      }, 0);
      
      if (invoiceData.netTotal && Math.abs(Number(invoiceData.netTotal) - totalNet) > 0.01) {
        errors.push("Invoice net total does not match sum of line net amounts");
      }
      
      const totalVat = invoiceData.items.reduce((sum: number, item: InvoiceItemData) => {
        return sum + Number(item.vatAmount);
      }, 0);
      
      if (invoiceData.vatTotal && Math.abs(Number(invoiceData.vatTotal) - totalVat) > 0.01) {
        errors.push("Invoice VAT total does not match sum of line VAT amounts");
      }
      
      const totalGross = invoiceData.items.reduce((sum: number, item: InvoiceItemData) => {
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
   * Complete supplier details for existing purchase invoices that don't have invoice_details records
   * This ensures compliance with Romanian tax law (art. 319 Cod Fiscal)
   */
  public async completeMissingSupplierDetails(companyId: string): Promise<number> {
    try {
      const db = getDrizzle();

      // Find purchase invoices without invoice_details
      // NOTE: customerName and customerId fields contain supplier information for PURCHASE type invoices
      const invoicesWithoutDetails = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName, // Supplier name for PURCHASE invoices
          customerId: invoices.customerId, // Supplier ID for PURCHASE invoices
          date: invoices.date
        })
        .from(invoices)
        .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
        .where(and(
          eq(invoices.companyId, companyId),
          eq(invoices.type, 'PURCHASE'),
          sql`${invoiceDetails.invoiceId} IS NULL` // Only invoices without details
        ));

      let completedCount = 0;

      for (const invoice of invoicesWithoutDetails) {
        // Try to get supplier data from crm_companies using customerId (which stores supplier ID for PURCHASE invoices)
        let supplierData = null;
        const supplierId = invoice.customerId; // Alias for clarity: customerId = supplierId for PURCHASE invoices

        if (supplierId) {
          try {
            // Use Drizzle ORM to get supplier data
            const supplierResult = await db
              .select({
                id: crm_companies.id,
                name: crm_companies.name,
                cui: crm_companies.cui,
                registrationNumber: crm_companies.registrationNumber,
                address: crm_companies.address,
                city: crm_companies.city,
                postalCode: crm_companies.postalCode,
                country: crm_companies.country
              })
              .from(crm_companies)
              .where(and(eq(crm_companies.id, supplierId), eq(crm_companies.isSupplier, true)))
              .limit(1);

            if (supplierResult.length > 0) {
              const supplier = supplierResult[0];
              supplierData = {
                id: supplier.id,
                name: supplier.name,
                fiscalCode: supplier.cui || '',
                registrationNumber: supplier.registrationNumber || '',
                address: supplier.address || '',
                city: supplier.city || '',
                county: supplier.postalCode || '', // Using postal_code as county approximation
                country: supplier.country || ''
              };
            }
          } catch (error) {
            logger.error('Could not find supplier in crm_companies', {
              error,
              context: { supplierId }
            });
          }
        }

        // If no supplier data found in crm_companies, use minimal data from invoice
        // NOTE: invoice.customerName contains supplier name for PURCHASE invoices
        if (!supplierData) {
          supplierData = {
            id: null,
            name: invoice.customerName || 'Furnizor necunoscut', // customerName = supplierName for PURCHASE
            fiscalCode: 'N/A',
            registrationNumber: null,
            address: 'Adresă necunoscută',
            city: 'Oraș necunoscut',
            county: null,
            country: 'Romania'
          };
        }

        // Insert invoice details
        await db.insert(invoiceDetails).values({
          invoiceId: invoice.id,
          partnerId: supplierData.id,
          partnerName: supplierData.name,
          partnerFiscalCode: supplierData.fiscalCode,
          partnerRegistrationNumber: supplierData.registrationNumber,
          partnerAddress: supplierData.address,
          partnerCity: supplierData.city,
          partnerCounty: supplierData.county,
          partnerCountry: supplierData.country,
          paymentMethod: 'bank_transfer',
          paymentDueDays: 30,
          paymentDueDate: null,
          notes: `Date furnizor completate automat pentru conformitatea fiscală`
        });

        completedCount++;
        logger.info('Completed supplier details for invoice', { context: { invoiceNumber: invoice.invoiceNumber } });
      }

      logger.info('Completed supplier details batch processing', { context: { completedCount } });
      return completedCount;
    } catch (error) {
      logger.error('Error completing missing supplier details', { error });
      throw new Error('Failed to complete missing supplier details');
    }
  }

  /**
   * PARTEA 2 - PLĂȚI ȘI TRANSFER TVA
   */
  
  public async recordSupplierPayment(paymentData: PaymentData): Promise<string> {
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
  
  public async transferDeferredVATForPurchases(invoiceId: string, paymentAmount: number, _paymentDate: Date, userId?: string): Promise<LedgerEntryData | null> {
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
  
  /**
   * Generare Jurnal de Cumpărări COMPLET conform OMFP 2634/2015
   * Similar cu generateSalesJournal dar adaptat pentru achiziții
   */
  public async generatePurchaseJournal(params: GeneratePurchaseJournalParams): Promise<PurchaseJournalReport> {
    const { companyId, periodStart, periodEnd } = params;
    const db = getDrizzle();
    
    // 1. Obține companie
    const [company] = await db.select({ name: companies.name, fiscalCode: companies.fiscalCode }).from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!company) throw new Error('Company not found');
    
    // 2. Obține TOATE facturile PURCHASE din perioadă
    const invoicesResult = await db.select().from(invoices).where(and(
      eq(invoices.companyId, companyId),
      eq(invoices.type, 'PURCHASE'),
      gte(invoices.issueDate, periodStart),
      lte(invoices.issueDate, periodEnd),
      isNotNull(invoices.invoiceNumber)
    )).orderBy(invoices.issueDate);
    
    const journalRows = [];
    let rowNumber = 1;
    
    // 3. Pentru fiecare factură
    for (const invoice of invoicesResult) {
      // Obține detalii furnizor (NOTE: customerId = supplierId for PURCHASE!)
      const [details] = await db.select().from(invoiceDetails).where(eq(invoiceDetails.invoiceId, invoice.id)).limit(1);
      const linesFromDB = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
      
      // Transform DB lines to InvoiceItemData format
      const lines: InvoiceItemData[] = linesFromDB.map(line => ({
        productName: line.productName,
        description: line.description,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        netAmount: Number(line.netAmount),
        vatRate: Number(line.vatRate),
        vatAmount: Number(line.vatAmount),
        grossAmount: Number(line.grossAmount),
        vatCategory: line.vatCategory || undefined,
        expenseType: undefined
      }));
      
      // Transform invoice_details to SupplierData for grouping
      const supplierData: SupplierData = details ? {
        id: details.partnerId || '',
        name: details.partnerName,
        fiscalCode: details.partnerFiscalCode,
        vatNumber: details.partnerFiscalCode,
        registrationNumber: details.partnerRegistrationNumber || undefined,
        address: details.partnerAddress || undefined,
        city: details.partnerCity || undefined,
        county: details.partnerCounty || undefined,
        country: details.partnerCountry || 'Romania',
        partnerCountry: details.partnerCountry || 'Romania'
      } : {
        id: '',
        name: invoice.customerName || 'Unknown',
        fiscalCode: '',
        country: 'Romania'
      };
      
      // 4. Grupare linii pe categorie fiscală (ca la Sales Journal)
      const linesByCategory = this.groupLinesByCategory(lines, supplierData);
      
      // 5. Creare rânduri pentru fiecare categorie
      for (const [category, categoryLines] of linesByCategory.entries()) {
        const totals = { base: categoryLines.reduce((s, l) => s + Number(l.netAmount), 0), vat: categoryLines.reduce((s, l) => s + Number(l.vatAmount), 0) };
        
        // Construire rând
        const row: PurchaseJournalRow = {
          rowNumber: rowNumber++,
          date: invoice.issueDate,
          documentNumber: invoice.invoiceNumber || 'N/A',
          documentType: invoice.type || 'PURCHASE',
          supplierName: details?.partnerName || invoice.customerName || 'Unknown',
          supplierFiscalCode: details?.partnerFiscalCode || '',
          supplierCountry: details?.partnerCountry || 'Romania',
          totalAmount: Number(invoice.amount),
          base19: 0, base9: 0, base5: 0,
          vat19: 0, vat9: 0, vat5: 0,
          intraCommunity: 0, import: 0, reverseCharge: 0, notSubject: 0,
          isCashVAT: invoice.isCashVAT || false,
          vatDeferred: 0, vatDeductible: 0,
          expenseType: categoryLines[0]?.expenseType || 'unknown'
        };
        
        // Populare pe categorie
        switch (category) {
          case 'STANDARD_19': row.base19 = totals.base; row.vat19 = totals.vat; break;
          case 'REDUCED_9': row.base9 = totals.base; row.vat9 = totals.vat; break;
          case 'REDUCED_5': row.base5 = totals.base; row.vat5 = totals.vat; break;
          case 'EXEMPT_WITH_CREDIT':
            if (details?.partnerCountry && details.partnerCountry !== 'Romania') {
              const isEU = this.isEUCountry(details.partnerCountry);
              if (isEU) row.intraCommunity = totals.base;
              else row.import = totals.base;
            }
            break;
          case 'REVERSE_CHARGE': row.reverseCharge = totals.base; break;
          default: row.notSubject = totals.base; break;
        }
        
        // TVA la încasare
        if (invoice.isCashVAT) {
          row.vatDeferred = totals.vat;
          row.vatDeductible = 0;
        } else {
          row.vatDeferred = 0;
          row.vatDeductible = totals.vat;
        }
        
        journalRows.push(row);
      }
    }
    
    // 6. PAS 8: Adaugă rânduri pentru PLĂȚI (TVA la încasare)
    const paymentRows = await this.addSupplierPaymentRows(db, periodStart, periodEnd, companyId, journalRows);
    const allRows = [...journalRows, ...paymentRows];
    
    // Renumerotare după adăugare plăți
    allRows.forEach((row, index) => { row.rowNumber = index + 1; });
    
    // 7. Totaluri DUPĂ includerea plăților
    const totals = {
      totalDocuments: invoicesResult.length, // Număr facturi distincte, nu rânduri!
      totalAmount: allRows.reduce((s, r) => r.documentType !== 'PAYMENT' ? s + r.totalAmount : s, 0),
      totalBase19: allRows.reduce((s, r) => s + r.base19, 0),
      totalVAT19: allRows.reduce((s, r) => s + r.vat19, 0),
      totalBase9: allRows.reduce((s, r) => s + r.base9, 0),
      totalVAT9: allRows.reduce((s, r) => s + r.vat9, 0),
      totalBase5: allRows.reduce((s, r) => s + r.base5, 0),
      totalVAT5: allRows.reduce((s, r) => s + r.vat5, 0),
      totalIntraCommunity: allRows.reduce((s, r) => s + r.intraCommunity, 0),
      totalImport: allRows.reduce((s, r) => s + r.import, 0),
      totalReverseCharge: allRows.reduce((s, r) => s + r.reverseCharge, 0),
      totalNotSubject: allRows.reduce((s, r) => s + r.notSubject, 0),
      totalVATDeferred: allRows.reduce((s, r) => s + r.vatDeferred, 0),
      totalVATDeductible: allRows.reduce((s, r) => s + r.vatDeductible, 0),
      totalNetAmount: allRows.reduce((s, r) => s + r.base19 + r.base9 + r.base5 + r.intraCommunity + r.import + r.reverseCharge + r.notSubject, 0),
      totalVATAmount: allRows.reduce((s, r) => s + r.vatDeferred + r.vatDeductible, 0)
    };
    
    // 8. PAS 9: Verificări contabile
    const accountingValidation = await this.validatePurchaseJournalWithAccounts(db, companyId, periodStart, periodEnd, totals);
    
    return {
      companyId, companyName: company.name, companyFiscalCode: company.fiscalCode,
      periodStart, periodEnd,
      periodLabel: new Date(periodStart).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
      generatedAt: new Date(),
      rows: allRows, totals, reportType: 'DETAILED',
      accountingValidation
    };
  }
  
  /**
   * PAS 8: Adaugă rânduri pentru plăți furnizori (TVA la încasare)
   */
  private async addSupplierPaymentRows(db: ReturnType<typeof getDrizzle>, periodStart: Date, periodEnd: Date, companyId: string, _existingRows: PurchaseJournalRow[]): Promise<PurchaseJournalRow[]> {
    try {
      const paymentsInPeriod = await db.select({
        paymentId: invoicePayments.id,
        paymentDate: invoicePayments.paymentDate,
        paymentAmount: invoicePayments.amount,
        paymentReference: invoicePayments.paymentReference,
        vatTransferred: invoicePayments.vatAmountTransferred,
        invoiceId: invoicePayments.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        supplierName: invoiceDetails.partnerName,
        supplierFiscalCode: invoiceDetails.partnerFiscalCode
      }).from(invoicePayments)
        .innerJoin(invoices, eq(invoicePayments.invoiceId, invoices.id))
        .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
        .where(and(
          eq(invoicePayments.companyId, companyId),
          gte(invoicePayments.paymentDate, periodStart),
          lte(invoicePayments.paymentDate, periodEnd),
          eq(invoices.type, 'PURCHASE'),
          eq(invoices.isCashVAT, true),
          isNotNull(invoicePayments.vatAmountTransferred)
        )).orderBy(invoicePayments.paymentDate);
      
      const paymentRows = [];
      for (const payment of paymentsInPeriod) {
        paymentRows.push({
          rowNumber: 0, // va fi renumerotat
          date: payment.paymentDate,
          documentNumber: `PLATĂ-${payment.invoiceNumber}`,
          documentType: 'PAYMENT',
          supplierName: payment.supplierName || 'Unknown',
          supplierFiscalCode: payment.supplierFiscalCode || '',
          supplierCountry: 'Romania',
          totalAmount: 0,
          base19: 0, base9: 0, base5: 0, vat19: 0, vat9: 0, vat5: 0,
          intraCommunity: 0, import: 0, reverseCharge: 0, notSubject: 0,
          isCashVAT: true,
          vatDeferred: -Number(payment.vatTransferred),
          vatDeductible: Number(payment.vatTransferred),
          expenseType: 'payment',
          notes: `TVA devenit deductibil pentru factura ${payment.invoiceNumber}`
        });
      }
      return paymentRows;
    } catch (error) {
      console.error('Error adding supplier payment rows:', error);
      return [];
    }
  }
  
  /**
   * PAS 9: Validare jurnal cu balanța contabilă
   */
  private async validatePurchaseJournalWithAccounts(
    db: ReturnType<typeof getDrizzle>, 
    companyId: string, 
    periodStart: Date, 
    _periodEnd: Date, 
    totals: PurchaseJournalTotals
  ): Promise<{
    account4426Balance: number;
    account4428Balance: number;
    account401Balance: number;
    isBalanced: boolean;
    discrepancies?: string[];
  }> {
    try {
      const year = periodStart.getFullYear();
      const month = periodStart.getMonth() + 1;
      
      const account4426 = await this.getAccountBalancePurchase(db, companyId, '4426', year, month);
      const account4428 = await this.getAccountBalancePurchase(db, companyId, '4428', year, month);
      const account401 = await this.getAccountBalancePurchase(db, companyId, '401', year, month);
      
      const discrepancies: string[] = [];
      
      if (Math.abs(account4426 - totals['totalVATDeductible']) > 0.01) {
        discrepancies.push(`TVA deductibilă: Jurnal ${totals['totalVATDeductible'].toFixed(2)} vs Cont 4426 ${account4426.toFixed(2)}`);
      }
      if (Math.abs(account4428 - totals['totalVATDeferred']) > 0.01) {
        discrepancies.push(`TVA neexigibilă: Jurnal ${totals['totalVATDeferred'].toFixed(2)} vs Cont 4428 ${account4428.toFixed(2)}`);
      }
      
      return {
        account4426Balance: account4426,
        account4428Balance: account4428,
        account401Balance: account401,
        isBalanced: discrepancies.length === 0,
        discrepancies: discrepancies.length > 0 ? discrepancies : undefined
      };
    } catch (error) {
      console.error('Error validating journal:', error);
      return { 
        account4426Balance: 0, 
        account4428Balance: 0, 
        account401Balance: 0, 
        isBalanced: false 
      };
    }
  }
  
  private async getAccountBalancePurchase(db: ReturnType<typeof getDrizzle>, companyId: string, accountCode: string, year: number, month: number): Promise<number> {
    try {
      const result = await db.select().from(ledgerLines)
        .innerJoin(ledgerEntries, eq(ledgerLines.ledgerEntryId, ledgerEntries.id))
        .where(and(
          eq(ledgerEntries.companyId, companyId),
          eq(ledgerLines.accountId, accountCode),
          gte(ledgerEntries.createdAt, new Date(year, month - 1, 1)),
          lte(ledgerEntries.createdAt, new Date(year, month, 0))
        ));
      
      let balance = 0;
      for (const row of result) {
        const debit = Number(row.ledger_lines.debitAmount || 0);
        const credit = Number(row.ledger_lines.creditAmount || 0);
        balance += accountCode === '401' ? (credit - debit) : (debit - credit);
      }
      return balance;
    } catch (_error) {
      return 0;
    }
  }
  
  private groupLinesByCategory(lines: InvoiceItemData[], supplierDetails: SupplierData): Map<string, InvoiceItemData[]> {
    const grouped = new Map<string, InvoiceItemData[]>();
    for (const line of lines) {
      let category = line.vatCategory || 'STANDARD_19';
      if (!line.vatCategory) {
        if (line.vatRate === 19) category = 'STANDARD_19';
        else if (line.vatRate === 9) category = 'REDUCED_9';
        else if (line.vatRate === 5) category = 'REDUCED_5';
        else if (line.vatRate === 0) category = supplierDetails?.partnerCountry !== 'Romania' ? 'EXEMPT_WITH_CREDIT' : 'NOT_SUBJECT';
      }
      if (!grouped.has(category)) grouped.set(category, []);
      const categoryLines = grouped.get(category);
      if (categoryLines) categoryLines.push(line);
    }
    return grouped;
  }
  
  private isEUCountry(country: string): boolean {
    const euCountries = ['Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'];
    return euCountries.some(c => c.toLowerCase() === country.toLowerCase());
  }

  /**
   * Update supplier invoice
   *
   * @param invoiceId Invoice ID
   * @param invoiceData Updated invoice data
   * @param supplier Updated supplier information
   * @param items Updated invoice items
   * @param taxRates Updated tax rates
   * @param paymentTerms Updated payment terms
   * @param notes Updated notes
   * @returns Updated invoice ID
   */
  public async updateSupplierInvoice(
    invoiceId: string,
    invoiceData: InvoiceData,
    supplier: SupplierData,
    items: InvoiceItemData[],
    _taxRates: TaxRates,
    paymentTerms: PaymentTerms,
    notes?: string
  ): Promise<string> {
    try {
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;

      const db = getDrizzle();

      try {
        // Use Drizzle transaction for atomicity
        await db.transaction(async (tx) => {
          // Update invoice using Drizzle ORM
          await tx.update(invoices)
            .set({
              invoiceNumber: invoiceData.invoiceNumber,
              customerName: supplier.name,
              amount: grossAmount.toString(),
              totalAmount: grossAmount.toString(),
              netAmount: netAmount.toString(),
              vatAmount: vatAmount.toString(),
              issueDate: invoiceData.issueDate,
              dueDate: invoiceData.dueDate,
              description: notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`,
              updatedAt: new Date()
            })
            .where(eq(invoices.id, invoiceId));

          // Delete existing invoice items using Drizzle ORM
          await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

          // Insert updated invoice items using Drizzle ORM
          for (const item of items) {
            await tx.insert(invoiceItems).values({
              invoiceId: invoiceId,
              productName: item.productName || '',
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
              netAmount: String(item.netAmount),
              vatRate: String(item.vatRate),
              vatAmount: String(item.vatAmount),
              grossAmount: String(item.grossAmount),
              sequence: 1
            });
          }

          // Update supplier details using Drizzle ORM
          await tx.update(invoiceDetails)
            .set({
              partnerName: supplier.name || 'Furnizor necunoscut',
              partnerFiscalCode: supplier.fiscalCode || 'N/A',
              partnerRegistrationNumber: supplier.registrationNumber || null,
              partnerAddress: supplier.address || 'Adresă necunoscută',
              partnerCity: supplier.city || 'Oraș necunoscut',
              partnerCountry: supplier.country || 'Romania',
              paymentMethod: paymentTerms?.method || 'bank_transfer',
              paymentDueDays: paymentTerms?.dueDays || 30,
              notes: notes || null
            })
            .where(eq(invoiceDetails.invoiceId, invoiceId));
        });

        logger.info('Successfully updated purchase invoice with supplier details', { context: { invoiceId } });
        return invoiceId;

      } catch (error) {
        logger.error('Database error', { error });
        throw error;
      }
    } catch (error) {
      logger.error('Error updating supplier invoice', { error });
      throw new Error(`Failed to update supplier invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Delete supplier invoice
   *
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @returns Success status
   */
  public async deleteSupplierInvoice(invoiceId: string, _companyId: string): Promise<boolean> {
    try {
      const db = getDrizzle();

      // Delete in correct order due to foreign keys
      await db.delete(invoiceDetails).where(eq(invoiceDetails.invoiceId, invoiceId));
      await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      await db.delete(invoices).where(eq(invoices.id, invoiceId));

      logger.info('Successfully deleted purchase invoice', { context: { invoiceId } });
      return true;
    } catch (error) {
      logger.error('Error deleting supplier invoice', { error });
      throw new Error(`Failed to delete supplier invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Record invoice payment
   *
   * @param paymentData Payment data
   * @returns Created payment ID
   */
  public async recordInvoicePayment(paymentData: PaymentData): Promise<string> {
    try {
      const db = getDrizzle();

      const [insertedPayment] = await db.insert(invoicePayments).values({
        invoiceId: paymentData.invoiceId,
        companyId: paymentData.companyId,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount.toString(),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference || paymentData.reference || null,
        notes: paymentData.notes || null
      }).returning({ id: invoicePayments.id });

      logger.info('Successfully recorded invoice payment', { context: { paymentId: insertedPayment.id } });
      return insertedPayment.id;
    } catch (error) {
      logger.error('Error recording invoice payment', { error });
      throw new Error(`Failed to record invoice payment: ${(error as Error).message}`);
    }
  }

  /**
   * Get invoice payment
   *
   * @param paymentId Payment ID
   * @param companyId Company ID
   * @returns Payment data
   */
  public async getInvoicePayment(paymentId: string, companyId: string): Promise<PaymentRecord | null> {
    try {
      const db = getDrizzle();

      const paymentFromDB = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.id, paymentId),
          eq(invoicePayments.companyId, companyId)
        ))
        .limit(1);

      if (!paymentFromDB || paymentFromDB.length === 0) return null;
      
      const payment = paymentFromDB[0];
      // Transform DB result to PaymentRecord (reference field from paymentReference)
      return {
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        reference: payment.paymentReference,
        createdAt: payment.createdAt,
        createdBy: payment.createdBy || 'system'
      };
    } catch (error) {
      console.error('Error getting invoice payment:', error);
      throw new Error(`Failed to get invoice payment: ${(error as Error).message}`);
    }
  }

  /**
   * Get invoice payments
   *
   * @param invoiceId Invoice ID
   * @param companyId Company ID
   * @returns Array of payments
   */
  public async getInvoicePayments(invoiceId: string, companyId: string): Promise<PaymentRecord[]> {
    try {
      const db = getDrizzle();

      const paymentsFromDB = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.invoiceId, invoiceId),
          eq(invoicePayments.companyId, companyId)
        ))
        .orderBy(desc(invoicePayments.paymentDate));
      
      // Transform DB results to PaymentRecord[]
      return paymentsFromDB.map(payment => ({
        id: payment.id,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        reference: payment.paymentReference,
        createdAt: payment.createdAt,
        createdBy: payment.createdBy || 'system'
      }));
    } catch (error) {
      console.error('Error getting invoice payments:', error);
      throw new Error(`Failed to get invoice payments: ${(error as Error).message}`);
    }
  }

  /**
   * Delete invoice payment
   *
   * @param paymentId Payment ID
   * @param companyId Company ID
   * @returns Success status
   */
  public async deleteInvoicePayment(paymentId: string, companyId: string): Promise<boolean> {
    try {
      const db = getDrizzle();

      await db
        .delete(invoicePayments)
        .where(and(
          eq(invoicePayments.id, paymentId),
          eq(invoicePayments.companyId, companyId)
        ));

      logger.info('Successfully deleted invoice payment', { context: { paymentId } });
      return true;
    } catch (error) {
      logger.error('Error deleting invoice payment', { error });
      throw new Error(`Failed to delete invoice payment: ${(error as Error).message}`);
    }
  }

  /**
   * Create purchase ledger entry
   *
   * @param data Purchase invoice data
   * @returns Created entry
   */
  public async createPurchaseLedgerEntry(data: PurchaseInvoiceData): Promise<LedgerEntryData> {
    try {
      return await this.createPurchaseInvoiceEntry(data);
    } catch (error) {
      console.error('Error creating purchase ledger entry:', error);
      throw new Error(`Failed to create purchase ledger entry: ${(error as Error).message}`);
    }
  }

  /**
   * Get purchase ledger entry
   *
   * @param entryId Entry ID
   * @param companyId Company ID
   * @returns Ledger entry
   */
  public async getPurchaseLedgerEntry(_entryId: string, _companyId: string): Promise<LedgerEntryData | null> {
    try {
      // This would need to be implemented based on the actual ledger entry table
      // For now, return a placeholder
      logger.info('getPurchaseLedgerEntry not fully implemented');
      return null;
    } catch (error) {
      logger.error('Error getting purchase ledger entry', { error });
      throw new Error(`Failed to get purchase ledger entry: ${(error as Error).message}`);
    }
  }

  /**
   * Get purchase ledger entries
   *
   * @param companyId Company ID
   * @param page Page number
   * @param limit Items per page
   * @param startDate Start date filter
   * @param endDate End date filter
   * @returns Array of ledger entries
   */
  public async getPurchaseLedgerEntries(
    _companyId: string,
    _page?: number,
    _limit?: number,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<LedgerEntryData[]> {
    try {
      // This would need to be implemented based on the actual ledger entry table
      // For now, return empty array
      logger.info('getPurchaseLedgerEntries not fully implemented');
      return [];
    } catch (error) {
      logger.error('Error getting purchase ledger entries', { error });
      throw new Error(`Failed to get purchase ledger entries: ${(error as Error).message}`);
    }
  }

  /**
   * Get supplier information
   *
   * @param supplierId Supplier ID
   * @param companyId Company ID
   * @returns Supplier data
   */
  public async getSupplier(supplierId: string, companyId: string): Promise<SupplierData | null> {
    try {
      const db = getDrizzle();

      const supplierResult = await db
        .select({
          id: crm_companies.id,
          name: crm_companies.name,
          fiscalCode: crm_companies.cui,
          registrationNumber: crm_companies.registrationNumber,
          address: crm_companies.address,
          city: crm_companies.city,
          county: crm_companies.postalCode,
          country: crm_companies.country
        })
        .from(crm_companies)
        .where(
          and(
            eq(crm_companies.id, supplierId),
            eq(crm_companies.companyId, companyId),
            eq(crm_companies.isSupplier, true)
          )
        )
        .limit(1);

      return supplierResult[0] || null;
    } catch (error) {
      logger.error('Error getting supplier', {
        error,
        context: { supplierId, companyId }
      });
      throw new Error(`Failed to get supplier: ${(error as Error).message}`);
    }
  }

  /**
   * Generate supplier account statement
   *
   * @param supplierId Supplier ID
   * @param companyId Company ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Account statement data
   */
  public async generateSupplierAccountStatement(
    supplierId: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SupplierStatementResponse> {
    try {
      const db = getDrizzle();

      // Get supplier information
      const supplier = await this.getSupplier(supplierId, companyId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Get all purchase invoices for the supplier in the date range
      // NOTE: Using customerId field to filter by supplierId for PURCHASE type invoices
      const invoiceList = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.customerId, supplierId), // customerId = supplierId for PURCHASE invoices
          eq(invoices.companyId, companyId),
          eq(invoices.type, 'PURCHASE'),
          gte(invoices.date, startDate),
          lte(invoices.date, endDate)
        ))
        .orderBy(invoices.date);

      // Get payments for these invoices
      const invoiceIds = invoiceList.map((inv) => inv.id);
      let payments: PaymentRecord[] = [];
      if (invoiceIds.length > 0) {
        const paymentsFromDB = await db
          .select()
          .from(invoicePayments)
          .where(and(
            eq(invoicePayments.companyId, companyId),
            sql`${invoicePayments.invoiceId} IN (${invoiceIds.join(',')})`
          ))
          .orderBy(invoicePayments.paymentDate);
        
        // Transform to PaymentRecord[]
        payments = paymentsFromDB.map(p => ({
          id: p.id,
          invoiceId: p.invoiceId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          reference: p.paymentReference,
          createdAt: p.createdAt,
          createdBy: p.createdBy || 'system'
        }));
      }

      // Calculate totals
      const totalInvoiced = invoiceList.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      const totalPaid = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

      return {
        supplier,
        period: { startDate, endDate },
        transactions: [],
        summary: {
          openingBalance: 0,
          totalInvoiced,
          totalPaid,
          closingBalance: totalInvoiced - totalPaid
        }
      };
    } catch (error) {
      logger.error('Error generating supplier account statement', {
        error,
        context: { supplierId, companyId }
      });
      throw new Error(`Failed to generate supplier account statement: ${(error as Error).message}`);
    }
  }

  /**
   * Get supplier balance as of date
   *
   * @param supplierId Supplier ID
   * @param companyId Company ID
   * @param asOfDate Date to calculate balance for
   * @returns Balance information
   */
  public async getSupplierBalanceAsOf(
    supplierId: string,
    companyId: string,
    asOfDate: Date
  ): Promise<{ balance: number; totalInvoiced: number; totalPaid: number }> {
    try {
      const db = getDrizzle();

      // Get all invoices up to the date
      // NOTE: Using customerId field to filter by supplierId for PURCHASE type invoices
      const invoiceList = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.customerId, supplierId), // customerId = supplierId for PURCHASE invoices
          eq(invoices.companyId, companyId),
          eq(invoices.type, 'PURCHASE'),
          lte(invoices.date, asOfDate)
        ));

      // Get all payments up to the date
      const paymentsFromDB = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.companyId, companyId),
          lte(invoicePayments.paymentDate, asOfDate),
          sql`EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_payments.invoice_id
            AND i.customer_id = ${supplierId}
            AND i.company_id = ${companyId}
            AND i.type = 'PURCHASE'
          )`
        ));

      const totalInvoiced = invoiceList.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      const totalPaid = paymentsFromDB.reduce((sum, pay) => sum + Number(pay.amount), 0);
      const balance = totalInvoiced - totalPaid;

      return {
        totalInvoiced,
        totalPaid,
        balance
      };
    } catch (error) {
      console.error('Error getting supplier balance:', error);
      throw new Error(`Failed to get supplier balance: ${(error as Error).message}`);
    }
  }
  
  /**
   * ============================================================================
   * REDIS CACHING & BULLMQ ASYNC OPERATIONS
   * ============================================================================
   */
  
  /**
   * Generate purchase journal with caching
   * Checks cache first, generates if not found, then caches result
   * 
   * @param params Generation parameters
   * @param useCache Whether to use cache (default: true)
   * @returns Purchase journal report
   */
  public async generatePurchaseJournalCached(
    params: GeneratePurchaseJournalParams,
    useCache: boolean = true
  ): Promise<PurchaseJournalReport> {
    // Build cache key
    const periodStart = params.periodStart.toISOString().split('T')[0];
    const periodEnd = params.periodEnd.toISOString().split('T')[0];
    
    // Check cache if enabled
    if (useCache) {
      await accountingCacheService.connect();
      
      if (accountingCacheService.isConnected()) {
        const cached = await accountingCacheService.getPurchaseJournal(
          params.companyId,
          periodStart,
          periodEnd
        );
        
        if (cached) {
          log(`Purchase journal cache hit for ${params.companyId} ${periodStart}-${periodEnd}`, 'purchase-journal-cache');
          return cached;
        }
      }
    }
    
    // Generate report (cache miss or disabled)
    log(`Generating purchase journal for ${params.companyId} ${periodStart}-${periodEnd}`, 'purchase-journal');
    const report = await this.generatePurchaseJournal(params);
    
    // Cache result
    if (useCache && accountingCacheService.isConnected()) {
      await accountingCacheService.setPurchaseJournal(
        params.companyId,
        periodStart,
        periodEnd,
        report
      );
      log(`Purchase journal cached for ${params.companyId}`, 'purchase-journal-cache');
    }
    
    return report;
  }
  
  /**
   * Queue purchase journal generation for async processing
   * Returns job ID for tracking progress
   * 
   * @param params Generation parameters
   * @param userId User ID requesting the generation
   * @returns Job ID for tracking
   */
  public async generatePurchaseJournalAsync(
    params: GeneratePurchaseJournalParams,
    userId: string
  ): Promise<{ jobId: string; message: string }> {
    try {
      const periodStart = params.periodStart.toISOString().split('T')[0];
      const periodEnd = params.periodEnd.toISOString().split('T')[0];
      
      log(`Queueing async purchase journal generation for ${params.companyId}`, 'purchase-journal-async');
      
      const job = await accountingQueueService.queuePurchaseJournalGeneration({
        companyId: params.companyId,
        periodStart,
        periodEnd,
        reportType: params.reportType,
        userId
      });
      
      const jobId = job.id || 'unknown';
      return {
        jobId,
        message: `Purchase journal generation queued. Job ID: ${jobId}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`Error queueing purchase journal generation: ${errorMessage}`, 'purchase-journal-error');
      throw error;
    }
  }
  
  /**
   * Invalidate purchase journal cache after invoice modifications
   * Should be called after creating, updating, or deleting supplier invoices
   * 
   * @param companyId Company ID
   * @param invoiceDate Invoice date (to determine which periods to invalidate)
   */
  public async invalidatePurchaseJournalCache(
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
        
        await accountingCacheService.invalidatePurchaseJournal(companyId, period);
        log(`Invalidated purchase journal cache for ${companyId} period ${period}`, 'purchase-journal-cache');
      } else {
        // Nuclear option - invalidate all periods for company
        await accountingCacheService.invalidatePurchaseJournal(companyId);
        log(`Invalidated all purchase journal cache for ${companyId}`, 'purchase-journal-cache');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log(`Error invalidating purchase journal cache: ${errorMessage}`, 'purchase-journal-error');
      // Don't throw - cache invalidation failures shouldn't break the main operation
    }
  }
}

export default PurchaseJournalService;