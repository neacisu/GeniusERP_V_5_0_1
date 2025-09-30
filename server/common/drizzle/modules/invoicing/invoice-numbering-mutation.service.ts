/**
 * Invoice Numbering Mutation Service
 * 
 * Handles database operations for creating, updating, and deleting invoice numbering settings.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';

// Create a logger for invoice numbering operations
const logger = new Logger('InvoiceNumberingMutationService');

/**
 * Service for managing invoice numbering settings mutations
 */
export class InvoiceNumberingMutationService extends BaseDrizzleService {
  /**
   * Create a new invoice numbering setting
   * 
   * @param data Invoice numbering setting data
   * @param createdBy User ID of the creator
   * @returns Created invoice numbering setting
   */
  async createInvoiceNumberingSetting(data: any, createdBy: string): Promise<any> {
    try {
      logger.debug('Creating invoice numbering setting with data:', {
        series: data.series,
        isDefault: data.isDefault,
        companyId: data.companyId
      });
      
      return await this.transaction(async (tx) => {
        // If this is set as default, unset any other defaults
        if (data.isDefault) {
          logger.debug(`Setting ${data.series} as default - unsetting any previous defaults`);
          
          const unsetDefaultQuery = `
            UPDATE invoice_numbering_settings
            SET 
              is_default = FALSE,
              updated_at = NOW(),
              updated_by = $1
            WHERE 
              is_default = TRUE
              AND is_active = TRUE
              ${data.companyId ? 'AND company_id = $2' : ''}
          `;
          
          const unsetParams = data.companyId ? [createdBy, data.companyId] : [createdBy];
          await tx.$client.unsafe(unsetDefaultQuery, unsetParams);
        }
        
        // Insert the new setting
        const insertQuery = `
          INSERT INTO invoice_numbering_settings (
            company_id,
            series,
            description,
            last_number,
            next_number,
            prefix,
            suffix,
            year,
            is_default,
            is_active,
            created_at,
            updated_at,
            created_by,
            updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            NOW(), NOW(), $11, $11
          )
          RETURNING 
            id,
            company_id as "companyId",
            series,
            description,
            last_number as "lastNumber",
            next_number as "nextNumber",
            prefix,
            suffix,
            year,
            is_default as "isDefault",
            is_active as "isActive",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
        
        const params = [
          data.companyId || null,
          data.series,
          data.description || null,
          data.lastNumber || 0,
          data.nextNumber || 1,
          data.prefix || '',
          data.suffix || '',
          data.year || new Date().getFullYear(),
          data.isDefault || false,
          true, // is_active
          createdBy
        ];
        
        const result = await tx.$client.unsafe(insertQuery, params);
        
        if (!result || result.length === 0) {
          const errMsg = 'Failed to create invoice numbering setting - no rows returned';
          logger.error(errMsg);
          throw new Error(errMsg);
        }
        
        logger.info(`Successfully created invoice numbering setting with ID: ${result[0].id}`);
        return result[0];
      }, 'createInvoiceNumberingSetting');
    } catch (error) {
      logger.error('Failed to create invoice numbering setting', error);
      throw new Error('Failed to create invoice numbering setting');
    }
  }
  
  /**
   * Update an existing invoice numbering setting
   * 
   * @param id Invoice numbering setting ID
   * @param data Data to update
   * @param updatedBy User ID of the updater
   * @returns Updated invoice numbering setting or null if not found
   */
  async updateInvoiceNumberingSetting(id: string, data: any, updatedBy: string): Promise<any | null> {
    try {
      logger.debug(`Updating invoice numbering setting ${id}`, {
        updateData: {
          series: data.series,
          isDefault: data.isDefault,
          isActive: data.isActive
        }
      });
      
      return await this.transaction(async (tx) => {
        // First check if the setting exists
        const checkQuery = `
          SELECT id, company_id, is_default 
          FROM invoice_numbering_settings
          WHERE id = $1 AND is_active = TRUE
        `;
        
        const settingCheck = await tx.$client.unsafe(checkQuery, [id]);
        
        if (!settingCheck || settingCheck.length === 0) {
          logger.warn(`Invoice numbering setting ${id} not found for update`);
          return null;
        }
        
        const companyId = settingCheck[0].company_id;
        
        // If setting as default, unset others 
        if (data.isDefault) {
          logger.debug(`Setting numbering setting ${id} as default - unsetting others`);
          
          const unsetQuery = `
            UPDATE invoice_numbering_settings
            SET 
              is_default = FALSE,
              updated_at = NOW(),
              updated_by = $1
            WHERE 
              id != $2
              AND is_default = TRUE
              AND is_active = TRUE
              ${companyId ? 'AND company_id = $3' : ''}
          `;
          
          const unsetParams = companyId ? [updatedBy, id, companyId] : [updatedBy, id];
          await tx.$client.unsafe(unsetQuery, unsetParams);
        }
        
        // Build update query dynamically based on provided fields
        const updateFields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        // Add fields that need to be updated
        if (data.series !== undefined) {
          updateFields.push(`series = $${paramIndex++}`);
          params.push(data.series);
        }
        
        if (data.description !== undefined) {
          updateFields.push(`description = $${paramIndex++}`);
          params.push(data.description);
        }
        
        if (data.lastNumber !== undefined) {
          updateFields.push(`last_number = $${paramIndex++}`);
          params.push(data.lastNumber);
        }
        
        if (data.nextNumber !== undefined) {
          updateFields.push(`next_number = $${paramIndex++}`);
          params.push(data.nextNumber);
        }
        
        if (data.prefix !== undefined) {
          updateFields.push(`prefix = $${paramIndex++}`);
          params.push(data.prefix);
        }
        
        if (data.suffix !== undefined) {
          updateFields.push(`suffix = $${paramIndex++}`);
          params.push(data.suffix);
        }
        
        if (data.year !== undefined) {
          updateFields.push(`year = $${paramIndex++}`);
          params.push(data.year);
        }
        
        if (data.isDefault !== undefined) {
          updateFields.push(`is_default = $${paramIndex++}`);
          params.push(data.isDefault);
        }
        
        if (data.isActive !== undefined) {
          updateFields.push(`is_active = $${paramIndex++}`);
          params.push(data.isActive);
        }
        
        // Always add updated_by and updated_at
        updateFields.push(`updated_by = $${paramIndex++}`);
        params.push(updatedBy);
        
        updateFields.push(`updated_at = NOW()`);
        
        // Add setting ID to parameters
        params.push(id);
        
        if (updateFields.length === 0) {
          logger.warn(`No fields to update for invoice numbering setting ${id}`);
          return null;
        }
        
        const updateQuery = `
          UPDATE invoice_numbering_settings
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND is_active = TRUE
          RETURNING 
            id,
            company_id as "companyId",
            series,
            description,
            last_number as "lastNumber",
            next_number as "nextNumber",
            prefix,
            suffix,
            year,
            is_default as "isDefault",
            is_active as "isActive",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
        
        const result = await tx.$client.unsafe(updateQuery, params);
        
        if (!result || result.length === 0) {
          const errMsg = `Failed to update invoice numbering setting ${id}`;
          logger.error(errMsg);
          throw new Error(errMsg);
        }
        
        logger.info(`Successfully updated invoice numbering setting ${id}`);
        return result[0];
      }, 'updateInvoiceNumberingSetting');
    } catch (error) {
      logger.error(`Failed to update invoice numbering setting ${id}`, error);
      throw new Error(`Failed to update invoice numbering setting ${id}`);
    }
  }
  
  /**
   * Soft delete an invoice numbering setting (mark as inactive)
   * 
   * @param id Invoice numbering setting ID
   * @param deletedBy User ID performing the deletion
   * @returns True if successful, false if setting not found
   */
  async deleteInvoiceNumberingSetting(id: string, deletedBy: string): Promise<boolean> {
    try {
      logger.debug(`Marking invoice numbering setting ${id} as inactive`);
      
      return await this.transaction(async (tx) => {
        // First check if the setting exists and is active
        const checkQuery = `
          SELECT id FROM invoice_numbering_settings
          WHERE id = $1 AND is_active = TRUE
        `;
        
        const settingCheck = await tx.$client.unsafe(checkQuery, [id]);
        
        if (!settingCheck || settingCheck.length === 0) {
          logger.warn(`Invoice numbering setting ${id} not found or already inactive`);
          return false;
        }
        
        const deleteQuery = `
          UPDATE invoice_numbering_settings
          SET 
            is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1
          WHERE id = $2 AND is_active = TRUE
        `;
        
        await tx.$client.unsafe(deleteQuery, [deletedBy, id]);
        
        logger.info(`Successfully marked invoice numbering setting ${id} as inactive`);
        return true;
      }, 'deleteInvoiceNumberingSetting');
    } catch (error) {
      logger.error(`Failed to delete invoice numbering setting ${id}`, error);
      throw new Error(`Failed to delete invoice numbering setting ${id}`);
    }
  }
}