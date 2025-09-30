/**
 * Invoice Service
 * 
 * Provides business logic for Romanian-compliant invoice management,
 * including invoice generation, numbering, and status transitions.
 * Leverages currency service for currency conversion functionality.
 */

import { storage } from '../../../storage';
import { Invoice, InvoiceDetail, InvoiceLine, InsertInvoice, InsertInvoiceDetail, InsertInvoiceLine } from '@shared/schema';
import { ENTITY_NAME } from '../index';
import { AuditService } from '../../audit/services/audit.service';
import { AuditActionType } from '../../../common/enums/audit-action.enum';
import { CurrencyService } from '../../integrations/services/currency.service';

export class InvoiceService {
  /**
   * Convert an amount from one currency to another using the CurrencyService
   * which uses locally stored BNR rates
   */
  static async convertCurrency(amount: number, fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    return CurrencyService.convert(amount, fromCurrency, toCurrency);
  }
  /**
   * Create a new draft invoice
   */
  static async createDraftInvoice(
    invoice: InsertInvoice,
    details: InsertInvoiceDetail,
    lines: InsertInvoiceLine[],
    userId?: string
  ): Promise<Invoice> {
    // Force draft status
    invoice.status = 'draft';
    
    // Calculate total amount from lines
    invoice.totalAmount = lines.reduce((sum, line) => sum + Number(line.totalAmount), 0).toString();
    
    // Create the invoice using storage
    const newInvoice = await storage.createInvoice(invoice, details, lines);
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.CREATE,
        entity: ENTITY_NAME,
        entityId: newInvoice.id,
        details: {
          invoice: {
            series: invoice.series,
            totalAmount: invoice.totalAmount
          }
        }
      });
    }
    
    return newInvoice;
  }
  
  /**
   * Issue a draft invoice (allocates invoice number)
   */
  static async issueInvoice(invoiceId: string, userId?: string): Promise<Invoice> {
    // Get the invoice
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Update status to issued (storage implementation handles number allocation)
    const updatedInvoice = await storage.updateInvoiceStatus(invoiceId, 'issued');
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.UPDATE,
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          statusChange: {
            from: 'draft',
            to: 'issued',
            number: updatedInvoice.number
          }
        }
      });
    }
    
    return updatedInvoice;
  }
  
  /**
   * Mark an issued invoice as sent
   */
  static async markAsSent(invoiceId: string, userId?: string): Promise<Invoice> {
    // Get the invoice
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Update status to sent
    const updatedInvoice = await storage.updateInvoiceStatus(invoiceId, 'sent');
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.UPDATE,
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          statusChange: {
            from: invoice.status,
            to: 'sent'
          }
        }
      });
    }
    
    return updatedInvoice;
  }
  
  /**
   * Cancel an invoice
   */
  static async cancelInvoice(invoiceId: string, userId?: string, reason?: string): Promise<Invoice> {
    // Get the invoice
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Update status to canceled
    const updatedInvoice = await storage.updateInvoiceStatus(invoiceId, 'canceled');
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.UPDATE,
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          statusChange: {
            from: invoice.status,
            to: 'canceled',
            reason
          }
        }
      });
    }
    
    return updatedInvoice;
  }
  
  /**
   * Delete an invoice
   * Only draft invoices can be deleted, or the last issued invoice
   */
  static async deleteInvoice(invoiceId: string, userId?: string): Promise<void> {
    // Get the invoice
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Try to delete (storage implementation enforces business rules)
    await storage.deleteInvoice(invoiceId);
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.DELETE,
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          invoice: {
            series: invoice.series,
            number: invoice.number,
            status: invoice.status
          }
        }
      });
    }
  }
  
  /**
   * Generate a fiscal compliant invoice number
   */
  static async getNextInvoiceNumber(series: string): Promise<number> {
    return storage.getNextInvoiceNumber(series);
  }
}