/**
 * Purchase Journal Service
 * 
 * Specialized journal service for purchase-related accounting operations.
 * Handles creating and managing purchase invoice entries according to Romanian accounting standards.
 */

import { JournalService, LedgerEntryType, LedgerEntryData } from './journal.service';

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
}

/**
 * Romanian accounts for purchase transactions
 * These would typically come from a database, but are hardcoded for this example
 */
export const PURCHASE_ACCOUNTS = {
  // Class 4 - Third Party Accounts
  SUPPLIER: '401', // Suppliers
  VAT_DEDUCTIBLE: '4426', // VAT deductible
  
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
      deductibleVat
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
    
    // Debit VAT deductible account (Asset +) if VAT is deductible
    if (vatAmount > 0 && deductibleVat) {
      ledgerLines.push({
        accountId: PURCHASE_ACCOUNTS.VAT_DEDUCTIBLE,
        debitAmount: vatAmount,
        creditAmount: 0,
        description: `VAT ${vatRate}%: ${invoiceNumber}`
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
}

export default PurchaseJournalService;