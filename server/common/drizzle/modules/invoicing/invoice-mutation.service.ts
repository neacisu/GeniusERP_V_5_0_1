/**
 * Invoice Mutation Service
 * 
 * Handles database operations for creating, updating, and deleting invoices,
 * invoice details, and invoice lines.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { sql } from 'drizzle-orm';
import { getPostgresClient } from '../../db';

// Create a logger for invoice mutation operations
const logger = new Logger('InvoiceMutationService');

/**
 * Service for managing invoice mutations (create, update, delete)
 */
export class InvoiceMutationService extends BaseDrizzleService {
  /**
   * Create a new invoice with details and lines
   * 
   * @param data Invoice data with details and lines
   * @param createdBy User ID of the creator
   * @returns Created invoice with ID and timestamps
   */
  async createInvoice(data: any, createdBy: string): Promise<any> {
    try {
      logger.debug(`Creating new invoice - companyId: ${data.companyId}, series: ${data.series}, status: ${data.status}`);
      
      const pgClient = getPostgresClient();
      
      return await this.transaction(async (tx) => {
        // First, insert the main invoice
        const insertInvoiceQuery = `
          INSERT INTO invoices (
            company_id,
            franchise_id,
            series,
            number,
            status,
            total_amount,
            currency,
            version,
            created_at,
            updated_at,
            created_by,
            updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, 
            NOW(), NOW(), $9, $9
          )
          RETURNING 
            id,
            company_id as "companyId",
            franchise_id as "franchiseId",
            series,
            number,
            status,
            total_amount as "totalAmount",
            currency,
            version,
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
        
        const invoiceParams = [
          data.companyId,
          data.franchiseId || null,
          data.series,
          data.number || null,
          data.status || 'draft',
          data.totalAmount || 0,
          data.currency || 'RON',
          data.version || 1,
          createdBy
        ];
        
        const invoiceResult = await pgClient.unsafe(insertInvoiceQuery, invoiceParams);
        
        if (!invoiceResult || invoiceResult.length === 0) {
          const errMsg = 'Failed to create invoice - no rows returned';
          logger.error(errMsg);
          throw new Error(errMsg);
        }
        
        const invoice = invoiceResult[0];
        const invoiceId = invoice.id;
        
        // If details are provided, insert invoice details
        if (data.details) {
          const detailsQuery = `
            INSERT INTO invoice_details (
              invoice_id,
              partner_id,
              partner_name,
              partner_fiscal_code,
              partner_registration_number,
              partner_address,
              partner_city,
              partner_county,
              partner_country,
              payment_method,
              payment_due_days,
              payment_due_date,
              notes
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING id
          `;
          
          const detailsParams = [
            invoiceId,
            data.details.partnerId || null,
            data.details.partnerName || null,
            data.details.partnerFiscalCode || null,
            data.details.partnerRegistrationNumber || null,
            data.details.partnerAddress || null,
            data.details.partnerCity || null,
            data.details.partnerCounty || null,
            data.details.partnerCountry || null,
            data.details.paymentMethod || null,
            data.details.paymentDueDays || null,
            data.details.paymentDueDate || null,
            data.details.notes || null
          ];
          
          await pgClient.unsafe(detailsQuery, detailsParams);
        }
        
        // If lines are provided, insert invoice lines
        if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
          for (const line of data.lines) {
            const lineQuery = `
              INSERT INTO invoice_lines (
                invoice_id,
                product_id,
                description,
                quantity,
                unit_price,
                vat_rate,
                total_amount
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
              )
              RETURNING id
            `;
            
            const lineParams = [
              invoiceId,
              line.productId || null,
              line.description || null,
              line.quantity || 0,
              line.unitPrice || 0,
              line.vatRate || 0,
              line.totalAmount || 0
            ];
            
            await pgClient.unsafe(lineQuery, lineParams);
          }
        }
        
        logger.info(`Successfully created invoice with ID: ${invoiceId}`);
        
        // Return the created invoice with any additional data
        return {
          ...invoice,
          details: data.details || null,
          lines: data.lines || []
        };
      }, 'createInvoice');
    } catch (error) {
      logger.error('Failed to create invoice', error);
      throw new Error('Failed to create invoice');
    }
  }
  
  /**
   * Update an existing invoice
   * 
   * @param id Invoice ID to update
   * @param data Updated invoice data
   * @param updatedBy User ID performing the update
   * @returns Updated invoice or null if not found
   */
  async updateInvoice(id: string, data: any, updatedBy: string): Promise<any | null> {
    try {
      logger.debug(`Updating invoice ${id} - status: ${data.status}, totalAmount: ${data.totalAmount}`);
      
      const pgClient = getPostgresClient();
      
      return await this.transaction(async (tx) => {
        // First check if the invoice exists
        const checkQuery = `
          SELECT id, company_id, status 
          FROM invoices
          WHERE id = $1 AND deleted_at IS NULL
        `;
        
        const invoiceCheck = await pgClient.unsafe(checkQuery, [id]);
        
        if (!invoiceCheck || invoiceCheck.length === 0) {
          logger.warn(`Invoice ${id} not found for update`);
          return null;
        }
        
        // Check if invoice is in a state that can be updated
        const currentStatus = invoiceCheck[0].status;
        if (['issued', 'canceled'].includes(currentStatus) && !data.forceUpdate) {
          const errMsg = `Invoice ${id} cannot be updated because it has status: ${currentStatus}`;
          logger.warn(errMsg);
          throw new Error(errMsg);
        }
        
        // Build update fields for invoice update
        const updateFields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        // Add fields that need to be updated
        if (data.franchiseId !== undefined) {
          updateFields.push(`franchise_id = $${paramIndex++}`);
          params.push(data.franchiseId);
        }
        
        if (data.series !== undefined) {
          updateFields.push(`series = $${paramIndex++}`);
          params.push(data.series);
        }
        
        if (data.number !== undefined) {
          updateFields.push(`number = $${paramIndex++}`);
          params.push(data.number);
        }
        
        if (data.status !== undefined) {
          updateFields.push(`status = $${paramIndex++}`);
          params.push(data.status);
        }
        
        if (data.totalAmount !== undefined) {
          updateFields.push(`total_amount = $${paramIndex++}`);
          params.push(data.totalAmount);
        }
        
        if (data.currency !== undefined) {
          updateFields.push(`currency = $${paramIndex++}`);
          params.push(data.currency);
        }
        
        if (data.isValidated !== undefined) {
          updateFields.push(`is_validated = $${paramIndex++}`);
          params.push(data.isValidated);
        }
        
        if (data.validatedAt !== undefined) {
          updateFields.push(`validated_at = $${paramIndex++}`);
          params.push(data.validatedAt);
        }
        
        if (data.validatedBy !== undefined) {
          updateFields.push(`validated_by = $${paramIndex++}`);
          params.push(data.validatedBy);
        }
        
        if (data.ledgerEntryId !== undefined) {
          updateFields.push(`ledger_entry_id = $${paramIndex++}`);
          params.push(data.ledgerEntryId);
        }
        
        // Always update version, updated_by and updated_at
        updateFields.push(`version = version + 1`);
        updateFields.push(`updated_by = $${paramIndex++}`);
        params.push(updatedBy);
        
        updateFields.push(`updated_at = NOW()`);
        
        // Add invoice ID to parameters
        params.push(id);
        
        if (updateFields.length === 0) {
          logger.warn(`No fields to update for invoice ${id}`);
          return null;
        }
        
        const updateQuery = `
          UPDATE invoices
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND deleted_at IS NULL
          RETURNING 
            id,
            company_id as "companyId",
            franchise_id as "franchiseId",
            series,
            number,
            status,
            total_amount as "totalAmount",
            currency,
            version,
            created_at as "createdAt",
            updated_at as "updatedAt",
            is_validated as "isValidated",
            validated_at as "validatedAt",
            validated_by as "validatedBy",
            ledger_entry_id as "ledgerEntryId"
        `;
        
        const result = await pgClient.unsafe(updateQuery, params);
        
        if (!result || result.length === 0) {
          const errMsg = `Failed to update invoice ${id}`;
          logger.error(errMsg);
          throw new Error(errMsg);
        }
        
        const updatedInvoice = result[0];
        
        // Update invoice details if provided
        if (data.details) {
          const detailsUpdateQuery = `
            UPDATE invoice_details
            SET 
              partner_id = $1,
              partner_name = $2,
              partner_fiscal_code = $3,
              partner_registration_number = $4,
              partner_address = $5,
              partner_city = $6,
              partner_county = $7,
              partner_country = $8,
              payment_method = $9,
              payment_due_days = $10,
              payment_due_date = $11,
              notes = $12
            WHERE invoice_id = $13
          `;
          
          const detailsParams = [
            data.details.partnerId || null,
            data.details.partnerName || null,
            data.details.partnerFiscalCode || null,
            data.details.partnerRegistrationNumber || null,
            data.details.partnerAddress || null,
            data.details.partnerCity || null,
            data.details.partnerCounty || null,
            data.details.partnerCountry || null,
            data.details.paymentMethod || null,
            data.details.paymentDueDays || null,
            data.details.paymentDueDate || null,
            data.details.notes || null,
            id
          ];
          
          await pgClient.unsafe(detailsUpdateQuery, detailsParams);
        }
        
        // Update invoice lines if provided
        if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
          // First, delete all existing lines for this invoice
          await pgClient.unsafe('DELETE FROM invoice_lines WHERE invoice_id = $1', [id]);
          
          // Then insert new lines
          for (const line of data.lines) {
            const lineQuery = `
              INSERT INTO invoice_lines (
                invoice_id,
                product_id,
                description,
                quantity,
                unit_price,
                vat_rate,
                total_amount
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
              )
            `;
            
            const lineParams = [
              id,
              line.productId || null,
              line.description || null,
              line.quantity || 0,
              line.unitPrice || 0,
              line.vatRate || 0,
              line.totalAmount || 0
            ];
            
            await pgClient.unsafe(lineQuery, lineParams);
          }
        }
        
        logger.info(`Successfully updated invoice ${id}`);
        return updatedInvoice;
      }, 'updateInvoice');
    } catch (error) {
      logger.error(`Failed to update invoice ${id}`, error);
      throw new Error(`Failed to update invoice ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Soft delete an invoice (mark as deleted)
   * 
   * @param id Invoice ID
   * @param deletedBy User ID performing the deletion
   * @returns True if successful, false if invoice not found
   */
  async deleteInvoice(id: string, deletedBy: string): Promise<boolean> {
    try {
      logger.debug(`Soft deleting invoice ${id}`);
      
      const pgClient = getPostgresClient();
      
      return await this.transaction(async (tx) => {
        // First check if the invoice exists and is not already deleted
        const checkQuery = `
          SELECT id, status FROM invoices
          WHERE id = $1 AND deleted_at IS NULL
        `;
        
        const invoiceCheck = await pgClient.unsafe(checkQuery, [id]);
        
        if (!invoiceCheck || invoiceCheck.length === 0) {
          logger.warn(`Invoice ${id} not found or already deleted`);
          return false;
        }
        
        // Check if invoice is in a state that can be deleted
        const currentStatus = invoiceCheck[0].status;
        if (['issued', 'sent'].includes(currentStatus)) {
          const errMsg = `Invoice ${id} cannot be deleted because it has status: ${currentStatus}`;
          logger.warn(errMsg);
          throw new Error(errMsg);
        }
        
        const deleteQuery = `
          UPDATE invoices
          SET 
            deleted_at = NOW(),
            updated_at = NOW(),
            updated_by = $1
          WHERE id = $2 AND deleted_at IS NULL
        `;
        
        await pgClient.unsafe(deleteQuery, [deletedBy, id]);
        
        logger.info(`Successfully marked invoice ${id} as deleted`);
        return true;
      }, 'deleteInvoice');
    } catch (error) {
      logger.error(`Failed to delete invoice ${id}`, error);
      throw new Error(`Failed to delete invoice ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}