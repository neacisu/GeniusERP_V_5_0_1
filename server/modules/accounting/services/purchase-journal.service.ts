/**
 * Purchase Journal Service
 * 
 * Specialized journal service for purchase-related accounting operations.
 * Handles creating and managing purchase invoice entries according to Romanian accounting standards.
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';
import { getDrizzle } from '../../../common/drizzle';
import { and, desc, eq, gte, lte, isNotNull, sql } from 'drizzle-orm';
import { sql as drizzleSql } from 'drizzle-orm';
import { invoices, invoiceLines, invoiceDetails, invoicePayments, companies, users, insertInvoiceSchema, insertInvoiceLineSchema, insertInvoiceDetailSchema } from '../../../../shared/schema';

import { v4 as uuidv4 } from 'uuid';
import { VATCategory, determineVATCategory } from '../types/vat-categories';
import pg from 'pg';
const { Client } = pg;

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
        // NOTE: For PURCHASE invoices, customerId field stores the supplier ID
        // This is a design choice to reuse the same table for both sales and purchase invoices
        const supplierIdForQuery = supplierId; // Alias for clarity: supplierId maps to customerId in DB
        conditions.push(eq(invoices.customerId, supplierIdForQuery));
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

      // Get invoice with creator name
      const invoiceResult = await db
        .select({
          id: invoices.id,
          companyId: invoices.companyId,
          franchiseId: invoices.franchiseId,
          customerId: invoices.customerId, // NOTE: For PURCHASE invoices, this represents supplierId
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          currency: invoices.currency,
          exchangeRate: invoices.exchangeRate,
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
    console.log('=== START recordSupplierInvoice ===');
    console.log('Input parameters received');

    try {
      // Check if invoiceData exists and has the expected structure
      console.log('invoiceData exists:', !!invoiceData);
      console.log('invoiceData keys:', invoiceData ? Object.keys(invoiceData) : 'null');

      // Check specific problematic fields
      if (invoiceData) {
        console.log('companyId:', invoiceData.companyId, 'type:', typeof invoiceData.companyId);
        console.log('issueDate:', invoiceData.issueDate, 'type:', typeof invoiceData.issueDate);
        console.log('dueDate:', invoiceData.dueDate, 'type:', typeof invoiceData.dueDate);
      }

      const drizzleDb = getDrizzle();
      console.log('Drizzle instance obtained');

      const invoiceId = invoiceData.id || uuidv4();
      console.log('Invoice ID generated:', invoiceId);

      console.log('About to calculate totals');
      console.log('Items:', items);

      // Calculate totals
      console.log('Calculating netAmount...');
      const netAmount = items.reduce((sum, item) => {
        console.log('Item netAmount:', item.netAmount, 'type:', typeof item.netAmount);
        return sum + Number(item.netAmount);
      }, 0);
      console.log('netAmount calculated:', netAmount);

      console.log('Calculating vatAmount...');
      const vatAmount = items.reduce((sum, item) => {
        console.log('Item vatAmount:', item.vatAmount, 'type:', typeof item.vatAmount);
        return sum + Number(item.vatAmount);
      }, 0);
      console.log('vatAmount calculated:', vatAmount);

      const grossAmount = netAmount + vatAmount;
      console.log('grossAmount calculated:', grossAmount);

      // Create completely separate PostgreSQL client to avoid Drizzle interference
      const { Client } = require('pg');
      const client = new Client({
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: process.env.NODE_ENV === 'production'
      });

      const actualInvoiceId = uuidv4();

      try {
        await client.connect();

        // Insert invoice using completely separate client
        await client.query(`
          INSERT INTO invoices (
            id, company_id, invoice_number, customer_name,
            amount, total_amount, net_amount, vat_amount, issue_date, due_date,
            type, description, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          actualInvoiceId,
          invoiceData.companyId,
          invoiceData.invoiceNumber,
          supplier.name,
          grossAmount.toString(),
          grossAmount.toString(),
          netAmount.toString(),
          vatAmount.toString(),
          invoiceData.issueDate,
          invoiceData.dueDate,
          'PURCHASE',
          notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`,
          invoiceData.userId || 'system'
        ]);

        // Insert invoice items
        for (const item of items) {
          await client.query(`
            INSERT INTO invoice_lines (
              invoice_id, product_name, description, quantity,
              unit_price, net_amount, vat_rate, vat_amount, gross_amount, total_amount
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            actualInvoiceId,
            item.productName || null,
            item.description || null,
            Number(item.quantity),
            Number(item.unitPrice),
            Number(item.netAmount),
            Number(item.vatRate),
            Number(item.vatAmount),
            Number(item.grossAmount),
            Number(item.grossAmount)
          ]);
        }

        // Insert supplier details
        await client.query(`
          INSERT INTO invoice_details (
            invoice_id, partner_name, partner_fiscal_code, partner_registration_number,
            partner_address, partner_city, partner_country,
            payment_method, payment_due_days
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          actualInvoiceId,
          supplier.name || 'Furnizor necunoscut',
          supplier.fiscalCode || 'N/A',
          supplier.registrationNumber || null,
          supplier.address || 'Adresă necunoscută',
          supplier.city || 'Oraș necunoscut',
          supplier.country || 'Romania',
          paymentTerms?.method || 'bank_transfer',
          paymentTerms?.dueDays || 30
        ]);

        console.log('Successfully recorded purchase invoice with supplier details (OMFP 2634/2015 compliance)');
        return actualInvoiceId;

      } catch (error) {
        console.error('Error recording supplier invoice:', error);
        throw new Error(`Failed to record supplier invoice: ${(error as Error).message}`);
      } finally {
        await client.end();
      }

      // GENERARE AUTOMATĂ NOTĂ CONTABILĂ (Integrare în contabilitate)
      console.log('Generating automatic accounting entry for purchase invoice...');
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

        // Actualizare factură cu ledgerEntryId folosind client separat
        const updateClient = new Client({
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || '5432'),
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          ssl: process.env.NODE_ENV === 'production'
        });

        try {
          await updateClient.connect();
          await updateClient.query(`
            UPDATE invoices
            SET ledger_entry_id = $1, is_validated = true, validated_at = $2
            WHERE id = $3
          `, [entry.id, new Date(), actualInvoiceId]);
          console.log('Invoice validated and linked to ledger entry:', entry.id);
        } finally {
          await updateClient.end();
        }
      } catch (accountingError) {
        console.error('Warning: Failed to generate automatic accounting entry:', accountingError);
        // Nu aruncăm eroare - înregistrarea facturii a reușit, doar nota contabilă a eșuat
      }

      return actualInvoiceId;
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
            // Use raw SQL query to get supplier data
            const supplierQuery = `
              SELECT id, name, cui, registration_number, address, city, postal_code, country
              FROM crm_companies
              WHERE id = $1 AND is_supplier = true
              LIMIT 1
            `;
            const supplierResult = await db.$client.unsafe(supplierQuery, [supplierId]);

            if (supplierResult.length > 0) {
              const supplier = supplierResult[0];
              supplierData = {
                id: supplier.id,
                name: supplier.name,
                fiscalCode: supplier.cui,
                registrationNumber: supplier.registration_number,
                address: supplier.address,
                city: supplier.city,
                county: supplier.postal_code, // Using postal_code as county approximation
                country: supplier.country
              };
            }
          } catch (error) {
            console.warn(`Could not find supplier ${supplierId} in crm_companies:`, error);
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
        console.log(`Completed supplier details for invoice ${invoice.invoiceNumber}`);
      }

      console.log(`Completed supplier details for ${completedCount} purchase invoices`);
      return completedCount;
    } catch (error) {
      console.error('Error completing missing supplier details:', error);
      throw new Error('Failed to complete missing supplier details');
    }
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
        supplierName: details?.partnerName || invoice.customerName, // customerName = supplierName for PURCHASE invoices
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
    invoiceData: any,
    supplier: any,
    items: any[],
    taxRates: any,
    paymentTerms: any,
    notes?: string
  ): Promise<string> {
    try {
      // Calculate totals
      const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const vatAmount = items.reduce((sum, item) => sum + Number(item.vatAmount), 0);
      const grossAmount = netAmount + vatAmount;

      // Create direct PostgreSQL client connection
      const { Client } = require('pg');
      const client = new Client({
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE || 'geniuserp',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        ssl: false
      });

      try {
        await client.connect();

        // Start transaction
        await client.query('BEGIN');

        // Update invoice
        await client.query(`
          UPDATE invoices SET
            invoice_number = $2, customer_name = $3,
            amount = $4, total_amount = $5, net_amount = $6, vat_amount = $7,
            issue_date = $8, due_date = $9, description = $10, updated_at = NOW()
          WHERE id = $1
        `, [
          invoiceId,
          invoiceData.invoiceNumber,
          supplier.name,
          grossAmount.toString(),
          grossAmount.toString(),
          netAmount.toString(),
          vatAmount.toString(),
          invoiceData.issueDate,
          invoiceData.dueDate,
          notes || `Purchase invoice ${invoiceData.invoiceNumber} from ${supplier.name}`
        ]);

        // Delete existing invoice lines
        await client.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [invoiceId]);

        // Insert updated invoice items
        for (const item of items) {
          await client.query(`
            INSERT INTO invoice_lines (
              invoice_id, product_name, description, quantity,
              unit_price, net_amount, vat_rate, vat_amount, gross_amount, total_amount
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            invoiceId,
            item.productName || null,
            item.description || null,
            Number(item.quantity),
            Number(item.unitPrice),
            Number(item.netAmount),
            Number(item.vatRate),
            Number(item.vatAmount),
            Number(item.grossAmount),
            Number(item.grossAmount)
          ]);
        }

        // Update supplier details
        await client.query(`
          UPDATE invoice_details SET
            partner_name = $2, partner_fiscal_code = $3, partner_registration_number = $4,
            partner_address = $5, partner_city = $6, partner_country = $7,
            payment_method = $8, payment_due_days = $9, notes = $10
          WHERE invoice_id = $1
        `, [
          invoiceId,
          supplier.name || 'Furnizor necunoscut',
          supplier.fiscalCode || 'N/A',
          supplier.registrationNumber || null,
          supplier.address || 'Adresă necunoscută',
          supplier.city || 'Oraș necunoscut',
          supplier.country || 'Romania',
          paymentTerms?.method || 'bank_transfer',
          paymentTerms?.dueDays || 30,
          notes || null
        ]);

        // Commit transaction
        await client.query('COMMIT');

        console.log('Successfully updated purchase invoice with supplier details');
        return invoiceId;

      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database error:', error);
        throw error;
      } finally {
        await client.end();
      }
    } catch (error) {
      console.error('Error updating supplier invoice:', error);
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
  public async deleteSupplierInvoice(invoiceId: string, companyId: string): Promise<boolean> {
    try {
      const db = getDrizzle();

      // Delete in correct order due to foreign keys
      await db.delete(invoiceDetails).where(eq(invoiceDetails.invoiceId, invoiceId));
      await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId));
      await db.delete(invoices).where(eq(invoices.id, invoiceId));

      console.log('Successfully deleted purchase invoice');
      return true;
    } catch (error) {
      console.error('Error deleting supplier invoice:', error);
      throw new Error(`Failed to delete supplier invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Record invoice payment
   *
   * @param paymentData Payment data
   * @returns Created payment ID
   */
  public async recordInvoicePayment(paymentData: any): Promise<string> {
    try {
      const db = getDrizzle();

      const [insertedPayment] = await db.insert(invoicePayments).values({
        invoiceId: paymentData.invoiceId,
        companyId: paymentData.companyId,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount.toString(),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.reference,
        notes: paymentData.notes
      }).returning({ id: invoicePayments.id });

      console.log('Successfully recorded invoice payment');
      return insertedPayment.id;
    } catch (error) {
      console.error('Error recording invoice payment:', error);
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
  public async getInvoicePayment(paymentId: string, companyId: string): Promise<any> {
    try {
      const db = getDrizzle();

      const payment = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.id, paymentId),
          eq(invoicePayments.companyId, companyId)
        ))
        .limit(1);

      return payment[0] || null;
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
  public async getInvoicePayments(invoiceId: string, companyId: string): Promise<any[]> {
    try {
      const db = getDrizzle();

      return await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.invoiceId, invoiceId),
          eq(invoicePayments.companyId, companyId)
        ))
        .orderBy(desc(invoicePayments.paymentDate));
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

      console.log('Successfully deleted invoice payment');
      return true;
    } catch (error) {
      console.error('Error deleting invoice payment:', error);
      throw new Error(`Failed to delete invoice payment: ${(error as Error).message}`);
    }
  }

  /**
   * Create purchase ledger entry
   *
   * @param data Ledger entry data
   * @returns Created entry
   */
  public async createPurchaseLedgerEntry(data: any): Promise<any> {
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
  public async getPurchaseLedgerEntry(entryId: string, companyId: string): Promise<any> {
    try {
      const db = getDrizzle();

      // This would need to be implemented based on the actual ledger entry table
      // For now, return a placeholder
      console.log('getPurchaseLedgerEntry not fully implemented');
      return null;
    } catch (error) {
      console.error('Error getting purchase ledger entry:', error);
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
    companyId: string,
    page?: number,
    limit?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      // This would need to be implemented based on the actual ledger entry table
      // For now, return empty array
      console.log('getPurchaseLedgerEntries not fully implemented');
      return [];
    } catch (error) {
      console.error('Error getting purchase ledger entries:', error);
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
  public async getSupplier(supplierId: string, companyId: string): Promise<any> {
    try {
      const db = getDrizzle();

      const supplier = await db.$client.unsafe(`
        SELECT id, name, fiscal_code as "fiscalCode", registration_number as "registrationNumber",
               address, city, county, country
        FROM crm_companies
        WHERE id = $1 AND company_id = $2 AND is_supplier = true
        LIMIT 1
      `, [supplierId, companyId]);

      return supplier[0] || null;
    } catch (error) {
      console.error('Error getting supplier:', error);
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
  ): Promise<any> {
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
      const invoiceIds = invoiceList.map((inv: any) => inv.id);
      let payments: any[] = [];
      if (invoiceIds.length > 0) {
        payments = await db
          .select()
          .from(invoicePayments)
          .where(and(
            eq(invoicePayments.companyId, companyId),
            sql`${invoicePayments.invoiceId} IN (${invoiceIds.join(',')})`
          ))
          .orderBy(invoicePayments.paymentDate);
      }

      return {
        supplier,
        period: { startDate, endDate },
        invoices: invoiceList,
        payments,
        summary: {
          totalInvoiced: invoiceList.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0),
          totalPaid: payments.reduce((sum: number, pay: any) => sum + Number(pay.amount), 0)
        }
      };
    } catch (error) {
      console.error('Error generating supplier account statement:', error);
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
  ): Promise<any> {
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
      const payments = await db
        .select()
        .from(invoicePayments)
        .where(and(
          eq(invoicePayments.companyId, companyId),
          lte(invoicePayments.paymentDate, asOfDate),
          sql`EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_payments.invoice_id
            AND i.customer_id = $1
            AND i.company_id = $2
            AND i.type = 'PURCHASE'
          )`,
          sql`${supplierId}`,
          sql`${companyId}`
        ));

      const totalInvoiced = invoiceList.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
      const totalPaid = payments.reduce((sum: number, pay: any) => sum + Number(pay.amount), 0);
      const balance = totalInvoiced - totalPaid;

      return {
        supplierId,
        asOfDate,
        totalInvoiced,
        totalPaid,
        balance,
        currency: 'RON'
      };
    } catch (error) {
      console.error('Error getting supplier balance:', error);
      throw new Error(`Failed to get supplier balance: ${(error as Error).message}`);
    }
  }
}

export default PurchaseJournalService;