/**
 * Invoice Service
 * 
 * Provides business logic for Romanian-compliant invoice management,
 * including invoice generation, numbering, and status transitions.
 * Leverages currency service for currency conversion functionality.
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { Invoice, InvoiceDetail, InsertInvoice, InsertInvoiceDetail } from '@geniuserp/shared';
import { InvoiceItem, InsertInvoiceItem, InvoiceWithRelations } from '../schema/invoice.schema';
import { ENTITY_NAME } from '../index';
import { AuditService } from '@geniuserp/audit';
import { AuditActionType } from "@common/enums/audit-action.enum";
import { CurrencyService } from '@geniuserp/integrations/services/currency.service';
import { eq, desc, and, sql, count, sum, avg } from 'drizzle-orm';
import { invoices, invoiceDetails } from '@geniuserp/shared';
import { invoiceItems } from '../schema/invoice.schema';

export class InvoiceService {
  private static drizzle = new DrizzleService();

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
    lines: InsertInvoiceItem[],
    userId?: string
  ): Promise<Invoice> {
    // Force draft status
    invoice.status = 'draft';
    
    // Calculate total amount from lines
    invoice.totalAmount = lines.reduce((sum, line) => sum + Number(line.grossAmount), 0).toString();
    
    // Create the invoice using DrizzleService
    const transaction = await this.drizzle.transaction(async (tx) => {
      // Insert invoice
      const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
      
      // Insert invoice details
      await tx.insert(invoiceDetails).values({
        ...details,
        invoiceId: newInvoice.id
      });
      
      // Insert invoice items
      for (const line of lines) {
        await tx.insert(invoiceItems).values({
          ...line,
          invoiceId: newInvoice.id
        });
      }
      
      return newInvoice;
    });
    
    // Audit log if user is provided
    if (userId) {
      await AuditService.log({
        userId,
        companyId: invoice.companyId,
        action: AuditActionType.CREATE,
        entity: ENTITY_NAME,
        entityId: transaction.id,
        details: {
          invoice: {
            series: invoice.series,
            totalAmount: invoice.totalAmount
          }
        }
      });
    }
    
    return transaction;
  }
  
  /**
   * Issue a draft invoice (allocates invoice number)
   */
  static async issueInvoice(invoiceId: string, userId?: string): Promise<Invoice> {
    // Get the invoice
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Get next invoice number for the series
    const nextNumber = await this.getNextInvoiceNumber(invoice.series || 'INV');
    
    // Update status to issued using Drizzle ORM
    const updateResult = await this.drizzle.query(async (db) => {
      return await db
        .update(invoices)
        .set({
          status: 'issued',
          number: nextNumber,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))
        .returning();
    });
    
    const updatedInvoice = updateResult.length > 0 ? updateResult[0] : null;
    
    if (!updatedInvoice) {
      throw new Error('Failed to update invoice status to issued');
    }
    
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
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Update status to sent using Drizzle ORM
    const updateResult = await this.drizzle.query(async (db) => {
      return await db
        .update(invoices)
        .set({
          status: 'sent',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))
        .returning();
    });
    
    const updatedInvoice = updateResult.length > 0 ? updateResult[0] : null;
    
    if (!updatedInvoice) {
      throw new Error('Failed to update invoice status to sent');
    }
    
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
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Update status to canceled using Drizzle ORM
    const updateResult = await this.drizzle.query(async (db) => {
      return await db
        .update(invoices)
        .set({
          status: 'canceled',
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId))
        .returning();
    });
    
    const updatedInvoice = updateResult.length > 0 ? updateResult[0] : null;
    
    if (!updatedInvoice) {
      throw new Error('Failed to update invoice status to canceled');
    }
    
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
   * Delete an invoice (internal method)
   * Only draft invoices can be deleted, or the last issued invoice
   * @private
   */
  private static async _deleteInvoiceInternal(invoiceId: string, invoice: Invoice, userId?: string): Promise<void> {
    // Enforce business rules - only draft or last invoice of a series can be deleted
    if (invoice.status !== 'draft') {
      // Check if this is the last invoice of its series using Drizzle ORM
      const lastInvoiceResult = await this.drizzle.query(async (db) => {
        return await db
          .select()
          .from(invoices)
          .where(eq(invoices.series, invoice.series || ''))
          .orderBy(desc(invoices.number))
          .limit(1);
      });
      
      const lastInvoice = lastInvoiceResult.length > 0 ? lastInvoiceResult[0] : null;
      
      if (!lastInvoice || lastInvoice.id !== invoice.id) {
        throw new Error('Only draft invoices or the last invoice in a series can be deleted');
      }
    }
    
    // Delete the invoice using Drizzle ORM (cascade will handle related records)
    try {
      await this.drizzle.transaction(async (tx) => {
        // Delete invoice details first (not cascade)
        await tx.delete(invoiceDetails).where(eq(invoiceDetails.invoiceId, invoiceId));
        
        // Delete invoice (items will be deleted by cascade)
        await tx.delete(invoices).where(eq(invoices.id, invoiceId));
      });
    } catch (error) {
      console.error('[InvoiceService] Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
    
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
   * Delete an invoice
   * Only draft invoices can be deleted, or the last issued invoice
   */
  static async deleteInvoice(invoiceId: string, userId?: string): Promise<void> {
    // Get the invoice
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Delegate to internal method - cast to Invoice for method signature
    await this._deleteInvoiceInternal(invoiceId, invoice as any, userId);
  }
  
  /**
   * Get invoice by ID with optional related data
   */
  static async getInvoice(invoiceId: string): Promise<InvoiceWithRelations | undefined> {
    try {
      // Get the invoice with all related data using Drizzle ORM
      const results = await this.drizzle.query(async (db) => {
        return await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceId))
          .limit(1);
      });
      
      if (!results || results.length === 0) {
        return undefined;
      }
      
      const invoice = results[0] as InvoiceWithRelations;
      
      // Get invoice details and items using Drizzle ORM
      const [details, lines] = await Promise.all([
        this.drizzle.query(async (db) => {
          return await db
            .select()
            .from(invoiceDetails)
            .where(eq(invoiceDetails.invoiceId, invoiceId));
        }),
        this.drizzle.query(async (db) => {
          return await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, invoiceId));
        })
      ]);
      
      // Add related data to invoice
      invoice.details = details.length > 0 ? details[0] : null;
      invoice.lines = lines;
      invoice.items = lines;
      
      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice by ID:', error);
      return undefined;
    }
  }
  
  /**
   * Generate a fiscal compliant invoice number
   */
  static async getNextInvoiceNumber(series: string): Promise<number> {
    try {
      // Find the highest invoice number for the given series using Drizzle ORM
      const result = await this.drizzle.query(async (db) => {
        return await db
          .select({ number: invoices.number })
          .from(invoices)
          .where(eq(invoices.series, series))
          .orderBy(desc(invoices.number))
          .limit(1);
      });
      
      // Return next number or start at 1
      if (result && result.length > 0 && result[0].number) {
        return Number(result[0].number) + 1;
      }
      
      return 1;
    } catch (error) {
      console.error('[InvoiceService] Error getting next invoice number:', error);
      return 1; // Fallback to 1 in case of error
    }
  }

  /**
   * Get all invoices for a company with pagination and sorting
   */
  static async getInvoicesForCompany(
    companyId: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: string = 'issueDate',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Promise<{ invoices: Invoice[]; total: number; hasMore: boolean }> {
    try {
      // Determine the sort field
      let orderField;
      switch (sortBy) {
        case 'issueDate': 
          orderField = invoices.createdAt;
          break;
        case 'dueDate': 
          orderField = invoiceDetails.paymentDueDate;
          break;
        case 'amount': 
          orderField = invoices.totalAmount;
          break;
        case 'status': 
          orderField = invoices.status;
          break;
        case 'number': 
          orderField = invoices.number;
          break;
        default: 
          orderField = invoices.createdAt;
      }
      
      // Get the invoices with pagination, joining with invoice_details to get partner information
      const results = await this.drizzle.query(async (db) => {
        const query = db
          .select({
            // Select all fields from invoices
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
            netTotal: invoices.netTotal,
            vatTotal: invoices.vatTotal,
            grossTotal: invoices.grossTotal,
            currency: invoices.currency,
            exchangeRate: invoices.exchangeRate,
            status: invoices.status,
            type: invoices.type,
            isCashVAT: invoices.isCashVAT,
            relatedInvoiceId: invoices.relatedInvoiceId,
            description: invoices.description,
            notes: invoices.notes,
            version: invoices.version,
            isValidated: invoices.isValidated,
            validatedAt: invoices.validatedAt,
            validatedBy: invoices.validatedBy,
            ledgerEntryId: invoices.ledgerEntryId,
            createdBy: invoices.createdBy,
            updatedBy: invoices.updatedBy,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            deletedAt: invoices.deletedAt,
            // Select fields from invoice_details with aliases
            partner_name: invoiceDetails.partnerName,
            partner_id: invoiceDetails.partnerId,
            partner_fiscal_code: invoiceDetails.partnerFiscalCode,
            payment_method: invoiceDetails.paymentMethod,
            payment_due_date: invoiceDetails.paymentDueDate,
          })
          .from(invoices)
          .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
          .where(eq(invoices.companyId, companyId))
          .limit(limit)
          .offset(offset);
        
        // Apply ordering
        if (sortDir === 'asc') {
          return query.orderBy(orderField);
        } else {
          return query.orderBy(desc(orderField));
        }
      });
      
      // Count total invoices
      const countResult = await this.drizzle.query(async (db) => {
        return await db
          .select({ count: count() })
          .from(invoices)
          .where(eq(invoices.companyId, companyId));
      });
      
      const total = Number(countResult[0]?.count || 0);

      return {
        invoices: results as any as Invoice[],
        total,
        hasMore: offset + results.length < total
      };
    } catch (error) {
      console.error('[InvoiceService] Error getting invoices for company:', error);
      throw new Error('Failed to retrieve invoices');
    }
  }

  /**
   * Get invoices for a specific customer within a company
   */
  static async getCustomerInvoices(
    customerId: string,
    companyId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ invoices: Invoice[]; total: number; hasMore: boolean }> {
    try {
      // Get the invoices with pagination, joining with invoice_details
      const results = await this.drizzle.query(async (db) => {
        return await db
          .select({
            // Select all fields from invoices
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
            netTotal: invoices.netTotal,
            vatTotal: invoices.vatTotal,
            grossTotal: invoices.grossTotal,
            currency: invoices.currency,
            exchangeRate: invoices.exchangeRate,
            status: invoices.status,
            type: invoices.type,
            isCashVAT: invoices.isCashVAT,
            relatedInvoiceId: invoices.relatedInvoiceId,
            description: invoices.description,
            notes: invoices.notes,
            version: invoices.version,
            isValidated: invoices.isValidated,
            validatedAt: invoices.validatedAt,
            validatedBy: invoices.validatedBy,
            ledgerEntryId: invoices.ledgerEntryId,
            createdBy: invoices.createdBy,
            updatedBy: invoices.updatedBy,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            deletedAt: invoices.deletedAt,
            // Select fields from invoice_details with aliases
            partner_name: invoiceDetails.partnerName,
            partner_id: invoiceDetails.partnerId,
            partner_fiscal_code: invoiceDetails.partnerFiscalCode,
            payment_method: invoiceDetails.paymentMethod,
            payment_due_date: invoiceDetails.paymentDueDate,
          })
          .from(invoices)
          .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
          .where(
            and(
              eq(invoices.companyId, companyId),
              sql`(${invoiceDetails.partnerId} = ${customerId} OR ${invoices.customerId} = ${customerId})`
            )
          )
          .orderBy(desc(invoices.createdAt))
          .limit(limit)
          .offset(offset);
      });
      
      // Count total invoices for this customer
      const countResult = await this.drizzle.query(async (db) => {
        return await db
          .select({ count: count() })
          .from(invoices)
          .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
          .where(
            and(
              eq(invoices.companyId, companyId),
              sql`(${invoiceDetails.partnerId} = ${customerId} OR ${invoices.customerId} = ${customerId})`
            )
          );
      });
      
      const total = Number(countResult[0]?.count || 0);

      return {
        invoices: results as any as Invoice[],
        total,
        hasMore: offset + results.length < total
      };
    } catch (error) {
      console.error('[InvoiceService] Error getting customer invoices:', error);
      throw new Error('Failed to retrieve customer invoices');
    }
  }

  /**
   * Get invoice by ID with company check
   */
  static async getInvoiceById(id: string, companyId: string): Promise<InvoiceWithRelations | null> {
    try {
      // Get the invoice with customer information using Drizzle ORM
      const results = await this.drizzle.query(async (db) => {
        return await db
          .select({
            // Select all fields from invoices
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
            netTotal: invoices.netTotal,
            vatTotal: invoices.vatTotal,
            grossTotal: invoices.grossTotal,
            currency: invoices.currency,
            exchangeRate: invoices.exchangeRate,
            status: invoices.status,
            type: invoices.type,
            isCashVAT: invoices.isCashVAT,
            relatedInvoiceId: invoices.relatedInvoiceId,
            description: invoices.description,
            notes: invoices.notes,
            version: invoices.version,
            isValidated: invoices.isValidated,
            validatedAt: invoices.validatedAt,
            validatedBy: invoices.validatedBy,
            ledgerEntryId: invoices.ledgerEntryId,
            createdBy: invoices.createdBy,
            updatedBy: invoices.updatedBy,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            deletedAt: invoices.deletedAt,
            // Select fields from invoice_details with aliases
            partner_name: invoiceDetails.partnerName,
            partner_id: invoiceDetails.partnerId,
            partner_fiscal_code: invoiceDetails.partnerFiscalCode,
            payment_method: invoiceDetails.paymentMethod,
            payment_due_date: invoiceDetails.paymentDueDate,
          })
          .from(invoices)
          .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
          .where(
            and(
              eq(invoices.id, id),
              eq(invoices.companyId, companyId)
            )
          )
          .limit(1);
      });
      
      if (!results || results.length === 0) {
        return null;
      }
      
      const invoice = results[0] as InvoiceWithRelations;
      
      // Get invoice details and items using Drizzle ORM
      const [details, lines] = await Promise.all([
        this.drizzle.query(async (db) => {
          return await db
            .select()
            .from(invoiceDetails)
            .where(eq(invoiceDetails.invoiceId, id));
        }),
        this.drizzle.query(async (db) => {
          return await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, id));
        })
      ]);
      
      // Add related data to invoice
      invoice.details = details.length > 0 ? details[0] : null;
      invoice.lines = lines;
      invoice.items = lines;

      return invoice;
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice by ID:', error);
      throw new Error('Failed to retrieve invoice details');
    }
  }

  /**
   * Get invoice statistics for a company
   */
  static async getInvoiceStats(companyId: string): Promise<any> {
    try {
      // Get counts by status using Drizzle ORM
      const statusCounts = await this.drizzle.query(async (db) => {
        return await db
          .select({
            status: invoices.status,
            count: count()
          })
          .from(invoices)
          .where(eq(invoices.companyId, companyId))
          .groupBy(invoices.status);
      });
      
      // Get most recent invoices with customer information using Drizzle ORM
      const recentInvoices = await this.drizzle.query(async (db) => {
        return await db
          .select({
            // Select all fields from invoices
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
            netTotal: invoices.netTotal,
            vatTotal: invoices.vatTotal,
            grossTotal: invoices.grossTotal,
            currency: invoices.currency,
            exchangeRate: invoices.exchangeRate,
            status: invoices.status,
            type: invoices.type,
            isCashVAT: invoices.isCashVAT,
            relatedInvoiceId: invoices.relatedInvoiceId,
            description: invoices.description,
            notes: invoices.notes,
            version: invoices.version,
            isValidated: invoices.isValidated,
            validatedAt: invoices.validatedAt,
            validatedBy: invoices.validatedBy,
            ledgerEntryId: invoices.ledgerEntryId,
            createdBy: invoices.createdBy,
            updatedBy: invoices.updatedBy,
            createdAt: invoices.createdAt,
            updatedAt: invoices.updatedAt,
            deletedAt: invoices.deletedAt,
            // Select fields from invoice_details
            partner_name: invoiceDetails.partnerName,
            partner_id: invoiceDetails.partnerId,
            partner_fiscal_code: invoiceDetails.partnerFiscalCode,
            payment_due_date: invoiceDetails.paymentDueDate,
          })
          .from(invoices)
          .leftJoin(invoiceDetails, eq(invoices.id, invoiceDetails.invoiceId))
          .where(eq(invoices.companyId, companyId))
          .orderBy(desc(invoices.createdAt))
          .limit(5);
      });
      
      // Convert to more usable format
      const stats = {
        total: 0,
        draft: 0,
        issued: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        canceled: 0,
        recentInvoices: recentInvoices as any as Invoice[]
      };
      
      // Process counts
      if (statusCounts && statusCounts.length > 0) {
        statusCounts.forEach((item: any) => {
          const countValue = Number(item.count);
          stats.total += countValue;
          
          switch (item.status) {
            case 'draft': stats.draft = countValue; break;
            case 'issued': stats.issued = countValue; break;
            case 'sent': stats.sent = countValue; break;
            case 'paid': stats.paid = countValue; break;
            case 'overdue': stats.overdue = countValue; break;
            case 'canceled': stats.canceled = countValue; break;
          }
        });
      }
      
      return stats;
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice stats:', error);
      throw new Error('Failed to retrieve invoice statistics');
    }
  }

  /**
   * Check if an invoice can be deleted
   */
  static async canDeleteInvoice(id: string, companyId: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const invoice = await this.getInvoiceById(id, companyId);
      
      if (!invoice) {
        return { canDelete: false, reason: 'Invoice not found' };
      }
      
      // Only draft invoices can be deleted
      if (invoice.status !== 'draft') {
        // Check if it's the last invoice of its series using Drizzle ORM
        const lastInvoiceResult = await this.drizzle.query(async (db) => {
          return await db
            .select()
            .from(invoices)
            .where(eq(invoices.series, invoice.series || ''))
            .orderBy(desc(invoices.number))
            .limit(1);
        });
        
        const lastInvoice = lastInvoiceResult && lastInvoiceResult.length > 0 ? lastInvoiceResult[0] : null;
        
        if (!lastInvoice || lastInvoice.id !== invoice.id) {
          return {
            canDelete: false,
            reason: 'Only draft invoices or the last invoice in a series can be deleted'
          };
        }
      }
      
      return { canDelete: true };
    } catch (error) {
      console.error('[InvoiceService] Error checking if invoice can be deleted:', error);
      throw new Error('Failed to check if invoice can be deleted');
    }
  }

  /**
   * Delete an invoice with company check
   */
  static async deleteInvoiceForCompany(id: string, companyId: string, userId?: string): Promise<boolean> {
    try {
      // Check if invoice exists and belongs to company
      const invoice = await this.getInvoiceById(id, companyId);
      
      if (!invoice) {
        return false;
      }
      
      // Use Drizzle ORM for deletion in transaction
      await this.drizzle.transaction(async (tx) => {
        // Delete invoice items first
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        
        // Delete invoice details
        await tx.delete(invoiceDetails).where(eq(invoiceDetails.invoiceId, id));
        
        // Delete invoice
        await tx.delete(invoices).where(
          and(
            eq(invoices.id, id),
            eq(invoices.companyId, companyId)
          )
        );
      });
      
      // Audit log if user is provided
      if (userId) {
        await AuditService.log({
          userId,
          companyId,
          action: 'DELETE',
          entity: ENTITY_NAME,
          entityId: id,
          details: {
            invoice: {
              series: invoice.series,
              number: invoice.number,
              status: invoice.status
            }
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('[InvoiceService] Error deleting invoice:', error);
      throw new Error('Failed to delete invoice');
    }
  }

  /**
   * Update an invoice with company check
   */
  static async updateInvoice(
    id: string,
    companyId: string,
    updates: any,
    userId?: string
  ): Promise<Invoice | null> {
    try {
      // Check if invoice exists and belongs to company
      const invoice = await this.getInvoiceById(id, companyId);
      
      if (!invoice) {
        return null;
      }
      
      // Only allow updating draft invoices
      if (invoice.status !== 'draft') {
        throw new Error('Only draft invoices can be updated');
      }
      
      // Prepare update object - always add updatedAt and optionally updatedBy
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (userId) {
        updateData.updatedBy = userId;
      }
      
      // Execute update using Drizzle ORM
      const result = await this.drizzle.query(async (db) => {
        return await db
          .update(invoices)
          .set(updateData)
          .where(
            and(
              eq(invoices.id, id),
              eq(invoices.companyId, companyId)
            )
          )
          .returning();
      });
      
      const updatedInvoice = result && result.length > 0 ? result[0] : null;
      
      return updatedInvoice as Invoice;
    } catch (error) {
      console.error('[InvoiceService] Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }

  /**
   * Generate an invoice PDF
   */
  static async generateInvoicePdf(id: string, companyId: string): Promise<Buffer | null> {
    try {
      // Get invoice with details
      const invoice = await this.getInvoiceById(id, companyId);
      
      if (!invoice) {
        return null;
      }
      
      // TODO: Implement actual PDF generation
      // This is just a placeholder
      const pdfContent = `Invoice ${invoice.series}${invoice.number || ''} - Generated ${new Date().toISOString()}`;
      return Buffer.from(pdfContent);
    } catch (error) {
      console.error('[InvoiceService] Error generating invoice PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  /**
   * Get invoice statistics for a company
   * Returns aggregated data about invoices grouped by status
   */
  static async getInvoiceStatistics(companyId: string): Promise<any> {
    try {
      // Build aggregation query using Drizzle ORM with SQL helpers
      const result = await this.drizzle.query(async (db) => {
        return await db
          .select({
            total_drafts: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'draft')`,
            total_issued: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'issued')`,
            total_sent: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'sent')`,
            total_paid: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
            total_canceled: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'canceled')`,
            total_pending: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} IN ('issued', 'sent'))`,
            total_validated: sql<number>`COUNT(*) FILTER (WHERE ${invoices.isValidated} = true)`,
            total_overdue: sql<number>`COUNT(*) FILTER (WHERE ${invoices.dueDate} < NOW() AND ${invoices.status} NOT IN ('paid', 'canceled'))`,
            total_invoices: count(),
            total_invoice_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} IN ('issued', 'sent', 'paid')), 0)`,
            total_paid_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} = 'paid'), 0)`,
            total_outstanding_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} IN ('issued', 'sent')), 0)`,
            pending_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.status} IN ('issued', 'sent')), 0)`,
            overdue_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}) FILTER (WHERE ${invoices.dueDate} < NOW() AND ${invoices.status} NOT IN ('paid', 'canceled')), 0)`,
            total_amount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
            total_vat: sql<number>`COALESCE(SUM(${invoices.vatAmount}), 0)`,
            avg_payment_delay: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.updatedAt} ELSE NOW() END) - ${invoices.issueDate}) / 86400), 0)`,
            currency: sql<string>`COALESCE(MAX(${invoices.currency}), 'RON')`
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.companyId, companyId),
              sql`${invoices.deletedAt} IS NULL`
            )
          );
      });
      
      if (!result || result.length === 0) {
        return {
          totalInvoices: 0,
          totalPending: 0,
          totalValidated: 0,
          totalIssued: 0,
          totalPaid: 0,
          totalOverdue: 0,
          totalAmount: 0,
          totalVat: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          avgPaymentDelay: 0,
          totalDrafts: 0,
          totalSent: 0,
          totalCanceled: 0,
          totalInvoiceAmount: 0,
          totalPaidAmount: 0,
          totalOutstandingAmount: 0,
          currency: 'RON'
        };
      }
      
      const stats = result[0];
      
      return {
        totalInvoices: Number(stats.total_invoices) || 0,
        totalPending: Number(stats.total_pending) || 0,
        totalValidated: Number(stats.total_validated) || 0,
        totalIssued: Number(stats.total_issued) || 0,
        totalPaid: Number(stats.total_paid) || 0,
        totalOverdue: Number(stats.total_overdue) || 0,
        totalAmount: Number(stats.total_amount) || 0,
        totalVat: Number(stats.total_vat) || 0,
        pendingAmount: Number(stats.pending_amount) || 0,
        overdueAmount: Number(stats.overdue_amount) || 0,
        avgPaymentDelay: Math.round(Number(stats.avg_payment_delay) || 0),
        totalDrafts: Number(stats.total_drafts) || 0,
        totalSent: Number(stats.total_sent) || 0,
        totalCanceled: Number(stats.total_canceled) || 0,
        totalInvoiceAmount: Number(stats.total_invoice_amount) || 0,
        totalPaidAmount: Number(stats.total_paid_amount) || 0,
        totalOutstandingAmount: Number(stats.total_outstanding_amount) || 0,
        currency: stats.currency || 'RON'
      };
    } catch (error) {
      console.error('[InvoiceService] Error getting invoice statistics:', error);
      throw new Error('Failed to get invoice statistics');
    }
  }
}