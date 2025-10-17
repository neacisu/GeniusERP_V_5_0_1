/**
 * Invoice Service
 * 
 * Provides business logic for Romanian-compliant invoice management,
 * including invoice generation, numbering, and status transitions.
 * Leverages currency service for currency conversion functionality.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { Invoice, InvoiceDetail, InvoiceLine, InsertInvoice, InsertInvoiceDetail, InsertInvoiceLine } from '@shared/schema';
import { ENTITY_NAME } from '../index';
import { AuditService } from '../../audit/services/audit.service';
import { AuditActionType } from '../../../common/enums/audit-action.enum';
import { CurrencyService } from '../../integrations/services/currency.service';
import { eq } from 'drizzle-orm';
import { invoices, invoiceDetails, invoiceLines } from '@shared/schema';

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
    lines: InsertInvoiceLine[],
    userId?: string
  ): Promise<Invoice> {
    // Force draft status
    invoice.status = 'draft';
    
    // Calculate total amount from lines
    invoice.totalAmount = lines.reduce((sum, line) => sum + Number(line.totalAmount), 0).toString();
    
    // Create the invoice using DrizzleService
    const transaction = await this.drizzle.transaction(async (tx) => {
      // Insert invoice
      const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
      
      // Insert invoice details
      await tx.insert(invoiceDetails).values({
        ...details,
        invoiceId: newInvoice.id
      });
      
      // Insert invoice lines
      for (const line of lines) {
        await tx.insert(invoiceLines).values({
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
    
    // Update status to issued
    const updateQuery = `
      UPDATE invoices
      SET 
        status = 'issued',
        number = $1,
        issued_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await this.drizzle.base.executeQuery(updateQuery, [nextNumber, invoiceId]);
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
    
    // Update status to sent
    const updateQuery = `
      UPDATE invoices
      SET 
        status = 'sent',
        sent_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const updateResult = await this.drizzle.base.executeQuery(updateQuery, [invoiceId]);
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
    
    // Update status to canceled
    const updateQuery = `
      UPDATE invoices
      SET 
        status = 'canceled',
        canceled_at = NOW(),
        cancel_reason = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const updateResult = await this.drizzle.base.executeQuery(updateQuery, [reason || null, invoiceId]);
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
      // Check if this is the last invoice of its series
      const query = `
        SELECT *
        FROM invoices
        WHERE series = $1
        ORDER BY number DESC
        LIMIT 1
      `;
      
      const results = await this.drizzle.base.executeQuery(query, [invoice.series || '']);
      const lastInvoice = results.length > 0 ? results[0] : null;
      
      if (!lastInvoice || lastInvoice.id !== invoice.id) {
        throw new Error('Only draft invoices or the last invoice in a series can be deleted');
      }
    }
    
    // Delete the invoice and its related records using direct SQL for reliability
    try {
      await this.drizzle.base.transaction(async (client) => {
        // Delete invoice items
        const deleteLinesQuery = `
          DELETE FROM invoice_items 
          WHERE invoice_id = $1
        `;
        
        // Delete invoice details
        const deleteDetailsQuery = `
          DELETE FROM invoice_details
          WHERE invoice_id = $1
        `;
        
        // Delete invoice
        const deleteInvoiceQuery = `
          DELETE FROM invoices
          WHERE id = $1
        `;
        
        // Execute queries in sequence
        await client.$client.unsafe(deleteLinesQuery, [invoiceId]);
        await client.$client.unsafe(deleteDetailsQuery, [invoiceId]);
        await client.$client.unsafe(deleteInvoiceQuery, [invoiceId]);
      }, 'deleteInvoice');
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
    
    // Delegate to internal method
    await this._deleteInvoiceInternal(invoiceId, invoice, userId);
  }
  
  /**
   * Get invoice by ID with optional related data
   */
  static async getInvoice(invoiceId: string): Promise<Invoice | undefined> {
    try {
      // Get the invoice with all related data
      const query = `
        SELECT i.* 
        FROM invoices i
        WHERE i.id = $1
        LIMIT 1
      `;
      
      const results = await this.drizzle.base.executeQuery(query, [invoiceId]);
      
      if (!results || results.length === 0) {
        return undefined;
      }
      
      const invoice = results[0] as Invoice;
      
      // Get invoice details
      const detailsQuery = `
        SELECT * FROM invoice_details
        WHERE invoice_id = $1
      `;
      
      const linesQuery = `
        SELECT * FROM invoice_items
        WHERE invoice_id = $1
        ORDER BY sequence ASC
      `;
      
      const [details, lines] = await Promise.all([
        this.drizzle.base.executeQuery(detailsQuery, [invoiceId]),
        this.drizzle.base.executeQuery(linesQuery, [invoiceId])
      ]);
      
      // Add related data to invoice
      invoice.details = details.length > 0 ? details[0] : null;
      invoice.lines = lines;
      
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
      // Find the highest invoice number for the given series
      const query = `
        SELECT number
        FROM invoices
        WHERE series = $1
        ORDER BY number DESC
        LIMIT 1
      `;
      
      const results = await this.drizzle.base.executeQuery(query, [series]);
      
      // Return next number or start at 1
      if (results && results.length > 0 && results[0].number) {
        return Number(results[0].number) + 1;
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
      // Build a SQL query with sorting and pagination
      let orderField = "created_at";
      switch (sortBy) {
        case 'issueDate': orderField = "created_at"; break; // We use created_at for issue date
        case 'dueDate': orderField = "payment_due_date"; break;
        case 'amount': orderField = "total_amount"; break;
        case 'status': orderField = "status"; break;
        case 'number': orderField = "number"; break;
        default: orderField = "created_at";
      }
      
      // Get the invoices with pagination, joining with invoice_details to get partner information
      const query = `
        SELECT i.*, 
               d.partner_name as customer_name,
               d.partner_id as customer_id,
               d.partner_fiscal_code as customer_fiscal_code,
               d.payment_method,
               i.created_at as issued_at,
               d.payment_due_date as due_date
        FROM invoices i
        LEFT JOIN invoice_details d ON i.id = d.invoice_id
        WHERE i.company_id = '${companyId}'
        ORDER BY ${orderField === 'payment_due_date' ? 'd.payment_due_date' : 'i.' + orderField} ${sortDir === 'asc' ? 'ASC' : 'DESC'}
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const results = await this.drizzle.base.executeQuery(query);
      
      // Count total invoices (we only count from invoices table, not affected by the JOIN)
      const countQuery = `
        SELECT COUNT(*) AS count 
        FROM invoices 
        WHERE company_id = '${companyId}'
      `;
      
      const countResult = await this.drizzle.base.executeQuery(countQuery);
      const total = Number(countResult[0]?.count || 0);

      return {
        invoices: results as Invoice[],
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
      const query = `
        SELECT i.*, 
               d.partner_name as customer_name,
               d.partner_id as customer_id,
               d.partner_fiscal_code as customer_fiscal_code,
               d.payment_method,
               i.created_at as issued_at,
               d.payment_due_date as due_date
        FROM invoices i
        LEFT JOIN invoice_details d ON i.id = d.invoice_id
        WHERE i.company_id = '${companyId}' AND (d.partner_id = '${customerId}' OR i.customer_id = '${customerId}')
        ORDER BY i.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const results = await this.drizzle.base.executeQuery(query);
      
      // Count total invoices for this customer - consider both the invoices.customer_id field
      // and the invoice_details.partner_id field to match the new JOIN query
      const countQuery = `
        SELECT COUNT(*) AS count 
        FROM invoices i
        LEFT JOIN invoice_details d ON i.id = d.invoice_id
        WHERE i.company_id = '${companyId}' AND (d.partner_id = '${customerId}' OR i.customer_id = '${customerId}')
      `;
      
      const countResult = await this.drizzle.base.executeQuery(countQuery);
      const total = Number(countResult[0]?.count || 0);

      return {
        invoices: results as Invoice[],
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
  static async getInvoiceById(id: string, companyId: string): Promise<Invoice | null> {
    try {
      // Get the invoice with customer information
      const query = `
        SELECT i.*, 
               d.partner_name as customer_name,
               d.partner_id as customer_id,
               d.partner_fiscal_code as customer_fiscal_code,
               d.payment_method,
               i.created_at as issued_at,
               d.payment_due_date as due_date
        FROM invoices i
        LEFT JOIN invoice_details d ON i.id = d.invoice_id
        WHERE i.id = '${id}' AND i.company_id = '${companyId}'
        LIMIT 1
      `;
      
      const results = await this.drizzle.base.executeQuery(query);
      
      if (!results || results.length === 0) {
        return null;
      }
      
      const invoice = results[0] as Invoice;
      
      // Get invoice details
      const detailsQuery = `
        SELECT * FROM invoice_details
        WHERE invoice_id = '${id}'
      `;
      
      const linesQuery = `
        SELECT * FROM invoice_items
        WHERE invoice_id = '${id}'
        ORDER BY sequence ASC
      `;
      
      const [details, lines] = await Promise.all([
        this.drizzle.base.executeQuery(detailsQuery),
        this.drizzle.base.executeQuery(linesQuery)
      ]);
      
      // Add related data to invoice
      invoice.details = details.length > 0 ? details[0] : null;
      invoice.lines = lines;

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
      // Get counts by status
      const statusQuery = `
        SELECT status, COUNT(*) as count
        FROM invoices
        WHERE company_id = '${companyId}'
        GROUP BY status
      `;
      
      const statusCounts = await this.drizzle.base.executeQuery(statusQuery);
      
      // Get most recent invoices with customer information
      const recentQuery = `
        SELECT i.*, 
               d.partner_name as customer_name,
               d.partner_id as customer_id,
               d.partner_fiscal_code as customer_fiscal_code,
               i.created_at as issued_at,
               d.payment_due_date as due_date
        FROM invoices i
        LEFT JOIN invoice_details d ON i.id = d.invoice_id
        WHERE i.company_id = '${companyId}'
        ORDER BY i.created_at DESC
        LIMIT 5
      `;
      
      const recentInvoices = await this.drizzle.base.executeQuery(recentQuery);
      
      // Convert to more usable format
      const stats = {
        total: 0,
        draft: 0,
        issued: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        canceled: 0,
        recentInvoices: recentInvoices as Invoice[]
      };
      
      // Process counts
      if (statusCounts && statusCounts.length > 0) {
        statusCounts.forEach((item: any) => {
          const count = Number(item.count);
          stats.total += count;
          
          switch (item.status) {
            case 'draft': stats.draft = count; break;
            case 'issued': stats.issued = count; break;
            case 'sent': stats.sent = count; break;
            case 'paid': stats.paid = count; break;
            case 'overdue': stats.overdue = count; break;
            case 'canceled': stats.canceled = count; break;
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
        // Check if it's the last invoice of its series
        const lastInvoiceQuery = `
          SELECT *
          FROM invoices
          WHERE series = '${invoice.series || ''}'
          ORDER BY number DESC
          LIMIT 1
        `;
        
        const lastInvoiceResult = await this.drizzle.base.executeQuery(lastInvoiceQuery);
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
      
      // Use direct SQL for reliable deletion without ORM
      const deleteLinesQuery = `
        DELETE FROM invoice_items 
        WHERE invoice_id = '${id}'
      `;
      
      const deleteDetailsQuery = `
        DELETE FROM invoice_details
        WHERE invoice_id = '${id}'
      `;
      
      const deleteInvoiceQuery = `
        DELETE FROM invoices
        WHERE id = '${id}' AND company_id = '${companyId}'
      `;
      
      // Execute queries in sequence
      await this.drizzle.base.executeQuery(deleteLinesQuery);
      await this.drizzle.base.executeQuery(deleteDetailsQuery);
      await this.drizzle.base.executeQuery(deleteInvoiceQuery);
      
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
      
      // Prepare update fields
      const now = new Date().toISOString();
      const updateFields = [];
      
      // Add each field from updates
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          updateFields.push(`${this.snakeCaseField(key)} = NULL`);
        } else if (typeof value === 'string') {
          updateFields.push(`${this.snakeCaseField(key)} = '${value.replace(/'/g, "''")}'`);
        } else if (typeof value === 'number') {
          updateFields.push(`${this.snakeCaseField(key)} = ${value}`);
        } else if (typeof value === 'boolean') {
          updateFields.push(`${this.snakeCaseField(key)} = ${value ? 'TRUE' : 'FALSE'}`);
        } else if (value instanceof Date) {
          updateFields.push(`${this.snakeCaseField(key)} = '${value.toISOString()}'`);
        }
      }
      
      // Always add updated fields
      updateFields.push(`updated_at = '${now}'`);
      if (userId) {
        updateFields.push(`updated_by = '${userId}'`);
      }
      
      // Create update query
      const updateQuery = `
        UPDATE invoices
        SET ${updateFields.join(', ')}
        WHERE id = '${id}' AND company_id = '${companyId}'
        RETURNING *
      `;
      
      // Execute update
      const result = await this.drizzle.base.executeQuery(updateQuery);
      const updatedInvoice = result && result.length > 0 ? result[0] : null;
      
      return updatedInvoice as Invoice;
    } catch (error) {
      console.error('[InvoiceService] Error updating invoice:', error);
      throw new Error('Failed to update invoice');
    }
  }
  
  /**
   * Helper method to convert camelCase to snake_case
   */
  private static snakeCaseField(field: string): string {
    return field.replace(/([A-Z])/g, '_$1').toLowerCase();
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
}