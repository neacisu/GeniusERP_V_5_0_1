/**
 * Invoicing Drizzle Service
 * 
 * Provides specialized database operations for invoicing-related functionality
 * with proper error handling and logging.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { SQL, sql } from 'drizzle-orm';
import { getPostgresClient } from '../../db';

// Create a logger for invoicing database operations
const logger = new Logger('InvoicingDrizzleService');

/**
 * Service that handles invoicing-related database operations
 */
export class InvoicingDrizzleService extends BaseDrizzleService {
  /**
   * Get all invoice numbering settings
   * 
   * @returns Array of invoice numbering settings
   */
  async getInvoiceNumberingSettings(): Promise<any[]> {
    try {
      logger.debug('Getting all invoice numbering settings');
      
      const query = `
        SELECT 
          id,
          name,
          series,
          start_number as "startNumber",
          current_number as "currentNumber",
          prefix,
          suffix,
          digits,
          company_id as "companyId",
          warehouse_id as "warehouseId",
          type,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM invoice_numbering_settings
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      
      return this.executeQuery(query, []);
    } catch (error) {
      logger.error('Failed to get invoice numbering settings', error);
      throw new Error('Failed to retrieve invoice numbering settings');
    }
  }
  
  /**
   * Get invoice numbering setting by ID
   * 
   * @param id Invoice numbering setting ID
   * @returns Invoice numbering setting or null if not found
   */
  async getInvoiceNumberingSettingById(id: string): Promise<any | null> {
    try {
      logger.debug(`Getting invoice numbering setting by ID: ${id}`);
      
      const query = `
        SELECT 
          id,
          name,
          series,
          start_number as "startNumber",
          current_number as "currentNumber",
          prefix,
          suffix,
          digits,
          company_id as "companyId",
          warehouse_id as "warehouseId",
          type,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM invoice_numbering_settings
        WHERE id = $1 AND deleted_at IS NULL
      `;
      
      const results = await this.executeQuery(query, [id]);
      
      if (!results || results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      logger.error(`Failed to get invoice numbering setting by ID ${id}`, error);
      throw new Error('Failed to retrieve invoice numbering setting');
    }
  }
  
  /**
   * Create a new invoice numbering setting
   * 
   * @param data Invoice numbering setting data
   * @param createdBy User ID of the creator
   * @returns Created invoice numbering setting
   */
  async createInvoiceNumberingSetting(data: any, createdBy: string): Promise<any> {
    try {
      logger.debug(`Creating invoice numbering setting with data: ${JSON.stringify(data)}`);
      
      return await this.transaction(async (tx) => {
        const pgClient = getPostgresClient();
        
        // If this is set as default, unset any other defaults of the same type
        if (data.isDefault) {
          const unsetDefaultQuery = `
            UPDATE invoice_numbering_settings
            SET 
              is_default = FALSE,
              updated_at = NOW(),
              updated_by = $1
            WHERE 
              type = $2 
              AND is_default = TRUE
              AND deleted_at IS NULL
          `;
          
          await pgClient.unsafe(unsetDefaultQuery, [createdBy, data.type]);
        }
        
        // Insert the new setting
        const insertQuery = `
          INSERT INTO invoice_numbering_settings (
            name,
            series,
            start_number,
            current_number,
            prefix,
            suffix,
            digits,
            company_id,
            warehouse_id,
            type,
            is_default,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING 
            id,
            name,
            series,
            start_number as "startNumber",
            current_number as "currentNumber",
            prefix,
            suffix,
            digits,
            company_id as "companyId",
            warehouse_id as "warehouseId",
            type,
            is_default as "isDefault",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
        
        const params = [
          data.name,
          data.series,
          data.startNumber || 1,
          data.currentNumber || data.startNumber || 1,
          data.prefix || '',
          data.suffix || '',
          data.digits || 5,
          data.companyId || null,
          data.warehouseId || null,
          data.type || 'invoice',
          data.isDefault || false,
          createdBy
        ];
        
        const result = await pgClient.unsafe(insertQuery, params);
        
        if (!result || result.length === 0) {
          throw new Error('Failed to create invoice numbering setting');
        }
        
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
      logger.debug(`Updating invoice numbering setting ${id} with data: ${JSON.stringify(data)}`);
      
      // First check if the setting exists
      const setting = await this.getInvoiceNumberingSettingById(id);
      
      if (!setting) {
        logger.warn(`Invoice numbering setting ${id} not found for update`);
        return null;
      }
      
      return await this.transaction(async (tx) => {
        const pgClient = getPostgresClient();
        
        // If this is set as default, unset any other defaults of the same type
        if (data.isDefault) {
          const unsetDefaultQuery = `
            UPDATE invoice_numbering_settings
            SET 
              is_default = FALSE,
              updated_at = NOW(),
              updated_by = $1
            WHERE 
              id != $2
              AND type = $3 
              AND is_default = TRUE
              AND deleted_at IS NULL
          `;
          
          await pgClient.unsafe(unsetDefaultQuery, [
            updatedBy, 
            id, 
            data.type || setting.type
          ]);
        }
        
        // Build update query dynamically based on provided fields
        const updateFields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        // Add fields that need to be updated
        if (data.name !== undefined) {
          updateFields.push(`name = $${paramIndex++}`);
          params.push(data.name);
        }
        
        if (data.series !== undefined) {
          updateFields.push(`series = $${paramIndex++}`);
          params.push(data.series);
        }
        
        if (data.startNumber !== undefined) {
          updateFields.push(`start_number = $${paramIndex++}`);
          params.push(data.startNumber);
        }
        
        if (data.currentNumber !== undefined) {
          updateFields.push(`current_number = $${paramIndex++}`);
          params.push(data.currentNumber);
        }
        
        if (data.prefix !== undefined) {
          updateFields.push(`prefix = $${paramIndex++}`);
          params.push(data.prefix);
        }
        
        if (data.suffix !== undefined) {
          updateFields.push(`suffix = $${paramIndex++}`);
          params.push(data.suffix);
        }
        
        if (data.digits !== undefined) {
          updateFields.push(`digits = $${paramIndex++}`);
          params.push(data.digits);
        }
        
        if (data.companyId !== undefined) {
          updateFields.push(`company_id = $${paramIndex++}`);
          params.push(data.companyId);
        }
        
        if (data.warehouseId !== undefined) {
          updateFields.push(`warehouse_id = $${paramIndex++}`);
          params.push(data.warehouseId);
        }
        
        if (data.type !== undefined) {
          updateFields.push(`type = $${paramIndex++}`);
          params.push(data.type);
        }
        
        if (data.isDefault !== undefined) {
          updateFields.push(`is_default = $${paramIndex++}`);
          params.push(data.isDefault);
        }
        
        // Always add updated_by and updated_at
        updateFields.push(`updated_by = $${paramIndex++}`);
        params.push(updatedBy);
        
        updateFields.push(`updated_at = NOW()`);
        
        // Add setting ID to parameters
        params.push(id);
        
        if (updateFields.length === 0) {
          logger.warn(`No fields to update for invoice numbering setting ${id}`);
          return setting;
        }
        
        const updateQuery = `
          UPDATE invoice_numbering_settings
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND deleted_at IS NULL
          RETURNING 
            id,
            name,
            series,
            start_number as "startNumber",
            current_number as "currentNumber",
            prefix,
            suffix,
            digits,
            company_id as "companyId",
            warehouse_id as "warehouseId",
            type,
            is_default as "isDefault",
            created_at as "createdAt",
            updated_at as "updatedAt"
        `;
        
        const result = await pgClient.unsafe(updateQuery, params);
        
        if (!result || result.length === 0) {
          throw new Error(`Failed to update invoice numbering setting ${id}`);
        }
        
        return result[0];
      }, 'updateInvoiceNumberingSetting');
    } catch (error) {
      logger.error(`Failed to update invoice numbering setting ${id}`, error);
      throw new Error('Failed to update invoice numbering setting');
    }
  }
  
  /**
   * Soft delete an invoice numbering setting
   * 
   * @param id Invoice numbering setting ID
   * @param deletedBy User ID of the person performing the deletion
   * @returns True if successful, false if setting not found
   */
  async deleteInvoiceNumberingSetting(id: string, deletedBy: string): Promise<boolean> {
    try {
      logger.debug(`Soft deleting invoice numbering setting ${id}`);
      
      // First check if the setting exists and is not already deleted
      const setting = await this.getInvoiceNumberingSettingById(id);
      
      if (!setting) {
        logger.warn(`Invoice numbering setting ${id} not found for deletion`);
        return false;
      }
      
      return await this.transaction(async (tx) => {
        const pgClient = getPostgresClient();
        
        const deleteQuery = `
          UPDATE invoice_numbering_settings
          SET 
            deleted_at = NOW(),
            deleted_by = $1,
            updated_at = NOW()
          WHERE id = $2 AND deleted_at IS NULL
        `;
        
        await pgClient.unsafe(deleteQuery, [deletedBy, id]);
        
        return true;
      }, 'deleteInvoiceNumberingSetting');
    } catch (error) {
      logger.error(`Failed to delete invoice numbering setting ${id}`, error);
      throw new Error('Failed to delete invoice numbering setting');
    }
  }
  
  /**
   * Get the next invoice number for a specific setting
   * 
   * @param settingId Invoice numbering setting ID
   * @returns Next formatted invoice number and incremented current number
   */
  async getNextInvoiceNumber(settingId: string): Promise<{ formattedNumber: string; currentNumber: number }> {
    try {
      logger.debug(`Getting next invoice number for setting ${settingId}`);
      
      return await this.transaction(async (tx) => {
        const pgClient = getPostgresClient();
        
        // Get the current setting
        const getSettingQuery = `
          SELECT 
            series,
            current_number as "currentNumber",
            prefix,
            suffix,
            digits
          FROM invoice_numbering_settings
          WHERE id = $1 AND deleted_at IS NULL
          FOR UPDATE
        `;
        
        const settings = await pgClient.unsafe(getSettingQuery, [settingId]);
        
        if (!settings || settings.length === 0) {
          throw new Error(`Invoice numbering setting ${settingId} not found`);
        }
        
        const setting = settings[0];
        const currentNumber = setting.currentNumber;
        const nextNumber = currentNumber + 1;
        
        // Format the number
        const paddedNumber = String(currentNumber).padStart(setting.digits, '0');
        const formattedNumber = `${setting.prefix || ''}${setting.series}${paddedNumber}${setting.suffix || ''}`;
        
        // Update the current number
        const updateQuery = `
          UPDATE invoice_numbering_settings
          SET 
            current_number = $1,
            updated_at = NOW()
          WHERE id = $2
        `;
        
        await pgClient.unsafe(updateQuery, [nextNumber, settingId]);
        
        return {
          formattedNumber,
          currentNumber: nextNumber
        };
      }, 'getNextInvoiceNumber');
    } catch (error) {
      logger.error(`Failed to get next invoice number for setting ${settingId}`, error);
      throw new Error('Failed to get next invoice number');
    }
  }
  
  /**
   * Get default invoice numbering setting for a specific type
   * 
   * @param type Invoice type (invoice, proforma, etc.)
   * @param companyId Optional company ID to filter by
   * @returns Default invoice numbering setting or null if not found
   */
  async getDefaultInvoiceNumberingSetting(type: string, companyId?: string): Promise<any | null> {
    try {
      logger.debug(`Getting default invoice numbering setting for type ${type}${companyId ? ` and company ${companyId}` : ''}`);
      
      let query = `
        SELECT 
          id,
          name,
          series,
          start_number as "startNumber",
          current_number as "currentNumber",
          prefix,
          suffix,
          digits,
          company_id as "companyId",
          warehouse_id as "warehouseId",
          type,
          is_default as "isDefault",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM invoice_numbering_settings
        WHERE type = $1 AND is_default = TRUE AND deleted_at IS NULL
      `;
      
      const params: any[] = [type];
      
      if (companyId) {
        query += ` AND (company_id IS NULL OR company_id = $2)`;
        params.push(companyId);
        query += ` ORDER BY CASE WHEN company_id = $2 THEN 0 ELSE 1 END LIMIT 1`;
      } else {
        query += ` LIMIT 1`;
      }
      
      const results = await this.executeQuery(query, params);
      
      if (!results || results.length === 0) {
        return null;
      }
      
      return results[0];
    } catch (error) {
      logger.error(`Failed to get default invoice numbering setting for type ${type}`, error);
      throw new Error('Failed to retrieve default invoice numbering setting');
    }
  }
}