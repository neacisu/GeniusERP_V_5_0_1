/**
 * Validate Invoice Service
 * 
 * This service handles invoice validation and accounting note generation.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from '../../../common/drizzle';
import { invoices } from '../schema/invoice.schema';
import { eq } from 'drizzle-orm';
import { JournalService } from '../../accounting/services/journal.service';
import { SalesJournalService } from '../../accounting/services/sales-journal.service';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

/**
 * Invoice data interface for type safety
 */
interface InvoiceData {
  id: string;
  companyId: string;
  franchiseId?: string;
  customerId: string;
  invoiceNumber: string;
  currency: string;
  vatRate: number;
  exchangeRate?: number;
  issueDate: string | Date;
  dueDate: string | Date;
  isValidated: boolean;
  items: InvoiceItem[];
  customer?: {
    name?: string;
  };
  company?: any;
  netTotal?: number;
  vatTotal?: number;
  grossTotal?: number;
}

/**
 * Invoice item interface for type safety
 */
interface InvoiceItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  invoiceId: string;
  ledgerEntryId: string;
  validatedAt: string;
  validatedBy: string;
}

/**
 * Service for validating invoices and generating accounting notes
 */
export class ValidateInvoiceService {
  /**
   * Validate an invoice and generate accounting note
   * @param invoiceId Invoice ID
   * @param userId User ID performing the validation
   * @returns Validation result
   */
  static async validateInvoice(invoiceId: string, userId: string): Promise<ValidationResult> {
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const db = getDrizzle();
    
    // Get invoice data
    const invoiceData = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        items: true,
        customer: true,
        company: true
      }
    });
    
    if (!invoiceData) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }
    
    // Check if invoice is already validated
    if (invoiceData.isValidated) {
      throw new Error(`Invoice with ID ${invoiceId} is already validated`);
    }
    
    // Validate invoice data structure
    this.validateInvoiceStructure(invoiceData as unknown as InvoiceData);
    
    try {
      // Get total values for the invoice
      const totalNet = invoiceData.items.reduce((sum: number, line: any) => sum + Number(line.netAmount), 0);
      const totalVat = invoiceData.items.reduce((sum: number, line: any) => sum + Number(line.vatAmount), 0);
      const totalGross = invoiceData.items.reduce((sum: number, line: any) => sum + Number(line.grossAmount), 0);
      
      // Create accounting note (ledger entry)
      const journalService = new JournalService();
      const salesJournal = new SalesJournalService(journalService);
      
      // Generate ledger entry
      const ledgerEntryData = await salesJournal.createSalesInvoiceEntry({
        companyId: invoiceData.companyId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceId: invoiceData.id,
        customerId: invoiceData.customerId,
        customerName: invoiceData.customer?.name || 'Unknown Customer',
        amount: Number(totalGross),
        netAmount: Number(totalNet),
        vatAmount: Number(totalVat),
        vatRate: invoiceData.vatRate,
        currency: invoiceData.currency,
        exchangeRate: invoiceData.exchangeRate || 1,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        description: `Sales invoice ${invoiceData.invoiceNumber} to ${invoiceData.customer?.name || 'customer'}`
      });
      
      // Update invoice validation status
      const now = new Date();
      
      await db.update(invoices)
        .set({
          isValidated: true,
          validatedAt: now,
          validatedBy: userId,
          ledgerEntryId: ledgerEntryData.id,
          updatedAt: now
        })
        .where(eq(invoices.id, invoiceId));
      
      // Log audit event
      await AuditService.log({
        userId,
        companyId: invoiceData.companyId,
        franchiseId: invoiceData.franchiseId,
        action: AuditAction.VALIDATE,
        entity: 'invoice',
        entityId: invoiceId,
        details: {
          invoiceNumber: invoiceData.invoiceNumber,
          ledgerEntryId: ledgerEntryData.id,
          amount: totalGross,
          currency: invoiceData.currency
        }
      });
      
      // Return validation result
      return {
        invoiceId,
        ledgerEntryId: ledgerEntryData.id,
        validatedAt: now.toISOString(),
        validatedBy: userId
      };
    } catch (error) {
      console.error('[ValidateInvoiceService] Error:', error instanceof Error ? error.message : String(error));
      
      throw new Error(`Failed to validate invoice: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Validate invoice data structure
   * @param invoiceData Invoice data
   */
  private static validateInvoiceStructure(invoiceData: InvoiceData): void {
    // Check required fields
    if (!invoiceData.invoiceNumber) {
      throw new Error('Invoice number is required');
    }
    
    if (!invoiceData.companyId) {
      throw new Error('Company ID is required');
    }
    
    if (!invoiceData.customerId) {
      throw new Error('Customer ID is required');
    }
    
    if (!invoiceData.issueDate) {
      throw new Error('Issue date is required');
    }
    
    if (!invoiceData.dueDate) {
      throw new Error('Due date is required');
    }
    
    if (!invoiceData.currency) {
      throw new Error('Currency is required');
    }
    
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      throw new Error('Invoice must have at least one item');
    }
    
    // Check items structure
    for (const item of invoiceData.items) {
      if (!item.productName) {
        throw new Error('Product name is required for all invoice items');
      }
      
      if (!item.quantity || Number(item.quantity) <= 0) {
        throw new Error('Quantity must be positive for all invoice items');
      }
      
      if (!item.unitPrice || Number(item.unitPrice) < 0) {
        throw new Error('Unit price must be non-negative for all invoice items');
      }
      
      if (!item.netAmount || Number(item.netAmount) < 0) {
        throw new Error('Net amount must be non-negative for all invoice items');
      }
      
      if (item.vatAmount === undefined || Number(item.vatAmount) < 0) {
        throw new Error('VAT amount must be non-negative for all invoice items');
      }
      
      if (!item.grossAmount || Number(item.grossAmount) < 0) {
        throw new Error('Gross amount must be non-negative for all invoice items');
      }
      
      // Check calculation consistency
      const calculatedNet = Number(item.quantity) * Number(item.unitPrice);
      if (Math.abs(calculatedNet - Number(item.netAmount)) > 0.01) {
        throw new Error('Net amount does not match quantity × unit price');
      }
      
      const calculatedGross = Number(item.netAmount) + Number(item.vatAmount);
      if (Math.abs(calculatedGross - Number(item.grossAmount)) > 0.01) {
        throw new Error('Gross amount does not match net amount + VAT amount');
      }
    }
    
    // Check invoice totals consistency
    const totalNet = invoiceData.items.reduce((sum: number, line: InvoiceItem) => sum + Number(line.netAmount), 0);
    if (invoiceData.netTotal && Math.abs(Number(invoiceData.netTotal) - totalNet) > 0.01) {
      throw new Error('Invoice net total does not match sum of line net amounts');
    }
    
    const totalVat = invoiceData.items.reduce((sum: number, line: InvoiceItem) => sum + Number(line.vatAmount), 0);
    if (invoiceData.vatTotal && Math.abs(Number(invoiceData.vatTotal) - totalVat) > 0.01) {
      throw new Error('Invoice VAT total does not match sum of line VAT amounts');
    }
    
    const totalGross = invoiceData.items.reduce((sum: number, line: InvoiceItem) => sum + Number(line.grossAmount), 0);
    if (invoiceData.grossTotal && Math.abs(Number(invoiceData.grossTotal) - totalGross) > 0.01) {
      throw new Error('Invoice gross total does not match sum of line gross amounts');
    }
  }
}

export default ValidateInvoiceService;