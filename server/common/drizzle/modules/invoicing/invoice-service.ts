/**
 * Invoice Service
 * 
 * Handles all database operations related to invoices, including creation, 
 * retrieval, and searching of invoices.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';

// Create a logger for invoice operations
const logger = new Logger('InvoiceService');

/**
 * Service for managing invoice data
 */
export class InvoiceService extends BaseDrizzleService {
  /**
   * Get all invoices for a company with optional filters and pagination
   * 
   * @param companyId Company ID
   * @param options Optional filter and pagination options
   * @returns Paginated list of invoices
   */
  async getInvoices(companyId: string, options?: { 
    offset?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ invoices: any[]; total: number }> {
    try {
      logger.debug(`Getting invoices for company ${companyId} with options: ${JSON.stringify(options)}`);
      
      const offset = options?.offset || 0;
      const limit = options?.limit || 20;
      const sortBy = options?.sortBy || 'created_at';
      const sortOrder = options?.sortOrder || 'desc';
      
      // Build the base query
      let query = `
        SELECT 
          i.id,
          i.company_id as "companyId",
          i.franchise_id as "franchiseId",
          i.series,
          i.number,
          i.status,
          i.total_amount as "totalAmount",
          i.currency,
          i.version,
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          i.deleted_at as "deletedAt",
          i.is_validated as "isValidated",
          i.validated_at as "validatedAt",
          i.validated_by as "validatedBy",
          i.ledger_entry_id as "ledgerEntryId"
        FROM invoices i
        WHERE i.company_id = $1 AND i.deleted_at IS NULL
      `;
      
      // Create params array starting with companyId
      const params: any[] = [companyId];
      let paramIndex = 2;
      
      // Add status filter if provided
      if (options?.status) {
        query += ` AND i.status = $${paramIndex++}`;
        params.push(options.status);
      }
      
      // Add date range filters if provided
      if (options?.startDate) {
        query += ` AND i.created_at >= $${paramIndex++}`;
        params.push(options.startDate);
      }
      
      if (options?.endDate) {
        query += ` AND i.created_at <= $${paramIndex++}`;
        params.push(options.endDate);
      }
      
      // Add search query if provided
      if (options?.searchQuery) {
        query += ` AND (
          i.series ILIKE $${paramIndex} OR 
          CAST(i.number AS TEXT) ILIKE $${paramIndex} OR
          i.currency ILIKE $${paramIndex}
        )`;
        params.push(`%${options.searchQuery}%`);
        paramIndex++;
      }
      
      // Count total matching records
      const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
      const countResult = await this.executeQuery(countQuery, params);
      const total = parseInt(countResult[0].count);
      
      // Add sorting and pagination
      query += ` ORDER BY i.${sortBy} ${sortOrder}`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit);
      params.push(offset);
      
      // Execute the final query
      const invoices = await this.executeQuery(query, params);
      
      logger.debug(`Found ${invoices.length} invoices out of ${total} total for company ${companyId}`);
      
      return {
        invoices,
        total
      };
    } catch (error) {
      logger.error(`Failed to get invoices for company ${companyId}`, error);
      throw new Error(`Failed to retrieve invoices for company ${companyId}`);
    }
  }
  
  /**
   * Get invoice by ID
   * 
   * @param id Invoice ID
   * @param companyId Company ID (for security validation)
   * @returns Invoice data or null if not found
   */
  async getInvoiceById(id: string, companyId?: string): Promise<any | null> {
    try {
      logger.debug(`Getting invoice by ID: ${id}${companyId ? ` for company ${companyId}` : ''}`);
      
      let query = `
        SELECT 
          i.id,
          i.company_id as "companyId",
          i.franchise_id as "franchiseId",
          i.series,
          i.number,
          i.status,
          i.total_amount as "totalAmount",
          i.currency,
          i.version,
          i.created_at as "createdAt",
          i.updated_at as "updatedAt",
          i.is_validated as "isValidated",
          i.validated_at as "validatedAt",
          i.validated_by as "validatedBy",
          i.ledger_entry_id as "ledgerEntryId"
        FROM invoices i
        WHERE i.id = $1 AND i.deleted_at IS NULL
      `;
      
      const params: any[] = [id];
      
      // If companyId provided, add it to the query for security
      if (companyId) {
        query += ` AND i.company_id = $2`;
        params.push(companyId);
      }
      
      const results = await this.executeQuery(query, params);
      
      if (!results || results.length === 0) {
        logger.debug(`No invoice found with ID: ${id}`);
        return null;
      }
      
      const invoice = results[0];
      logger.debug(`Successfully retrieved invoice ${id}`);
      
      return invoice;
    } catch (error) {
      logger.error(`Failed to get invoice by ID ${id}`, error);
      throw new Error(`Failed to retrieve invoice with ID: ${id}`);
    }
  }

  /**
   * Get invoice with its details and lines
   * 
   * @param id Invoice ID
   * @param companyId Company ID (for security validation)
   * @returns Complete invoice data including details and lines
   */
  async getInvoiceWithDetails(id: string, companyId?: string): Promise<any | null> {
    try {
      logger.debug(`Getting invoice with details for ID: ${id}`);
      
      // First get the invoice
      const invoice = await this.getInvoiceById(id, companyId);
      
      if (!invoice) {
        return null;
      }
      
      // Get invoice details
      const detailsQuery = `
        SELECT 
          id,
          invoice_id as "invoiceId",
          partner_id as "partnerId",
          partner_name as "partnerName",
          partner_fiscal_code as "partnerFiscalCode",
          partner_registration_number as "partnerRegistrationNumber",
          partner_address as "partnerAddress",
          partner_city as "partnerCity",
          partner_county as "partnerCounty",
          partner_country as "partnerCountry",
          payment_method as "paymentMethod",
          payment_due_days as "paymentDueDays",
          payment_due_date as "paymentDueDate",
          notes
        FROM invoice_details
        WHERE invoice_id = $1
      `;
      
      const details = await this.executeQuery(detailsQuery, [id]);
      
      // Get invoice lines
      const linesQuery = `
        SELECT 
          id,
          invoice_id as "invoiceId",
          product_id as "productId",
          description,
          quantity,
          unit_price as "unitPrice",
          vat_rate as "vatRate",
          total_amount as "totalAmount"
        FROM invoice_lines
        WHERE invoice_id = $1
        ORDER BY id
      `;
      
      const lines = await this.executeQuery(linesQuery, [id]);
      
      // Combine the data
      const result = {
        ...invoice,
        details: details.length > 0 ? details[0] : null,
        lines
      };
      
      logger.debug(`Successfully retrieved invoice ${id} with ${lines.length} lines`);
      return result;
    } catch (error) {
      logger.error(`Failed to get invoice with details for ID ${id}`, error);
      throw new Error(`Failed to retrieve complete invoice data for ID: ${id}`);
    }
  }
}