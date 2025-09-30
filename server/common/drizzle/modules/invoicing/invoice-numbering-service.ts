/**
 * Invoice Numbering Service
 * 
 * Handles all database operations related to invoice numbering settings
 * including creating, updating, and retrieving numbering sequences.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';

// Create a logger for invoice numbering operations
const logger = new Logger('InvoiceNumberingService');

/**
 * Service for managing invoice numbering settings
 */
export class InvoiceNumberingService extends BaseDrizzleService {
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
        FROM invoice_numbering_settings
        WHERE is_active = TRUE
        ORDER BY created_at DESC
      `;
      
      return this.executeQuery(query, [], 'getInvoiceNumberingSettings');
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
        FROM invoice_numbering_settings
        WHERE id = $1 AND is_active = TRUE
      `;
      
      const results = await this.executeQuery(query, [id], 'getInvoiceNumberingSettingById');
      
      if (!results || results.length === 0) {
        logger.debug(`No invoice numbering setting found with ID: ${id}`);
        return null;
      }
      
      return results[0];
    } catch (error) {
      logger.error(`Failed to get invoice numbering setting by ID ${id}`, error);
      throw new Error(`Failed to retrieve invoice numbering setting with ID: ${id}`);
    }
  }
  
  /**
   * Get the default invoice numbering setting for a specific type
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
        FROM invoice_numbering_settings
        WHERE is_default = TRUE AND is_active = TRUE
      `;
      
      const params: any[] = [];
      
      if (companyId) {
        query += ` AND (company_id IS NULL OR company_id = $1)`;
        params.push(companyId);
        query += ` ORDER BY CASE WHEN company_id = $1 THEN 0 ELSE 1 END LIMIT 1`;
      } else {
        query += ` LIMIT 1`;
      }
      
      const results = await this.executeQuery(query, params, 'getDefaultInvoiceNumberingSetting');
      
      if (!results || results.length === 0) {
        logger.debug(`No default invoice numbering setting found for type ${type}`);
        return null;
      }
      
      return results[0];
    } catch (error) {
      logger.error(`Failed to get default invoice numbering setting for type ${type}`, error);
      throw new Error('Failed to retrieve default invoice numbering setting');
    }
  }
  
  /**
   * Get the next invoice number for a specific setting
   * 
   * @param settingId Invoice numbering setting ID
   * @returns Next formatted invoice number and incremented current number
   */
  async getNextInvoiceNumber(settingId: string): Promise<{ formattedNumber: string; nextNumber: number }> {
    try {
      logger.debug(`Getting next invoice number for setting ${settingId}`);
      
      return await this.transaction(async (tx) => {
        // Get the current setting with a row lock to prevent race conditions
        const getSettingQuery = `
          SELECT 
            series,
            next_number as "nextNumber",
            prefix,
            suffix,
            year
          FROM invoice_numbering_settings
          WHERE id = $1 AND is_active = TRUE
          FOR UPDATE
        `;
        
        const settings = await tx.$client.unsafe(getSettingQuery, [settingId]);
        
        if (!settings || settings.length === 0) {
          const errMsg = `Invoice numbering setting ${settingId} not found or inactive`;
          logger.error(errMsg);
          throw new Error(errMsg);
        }
        
        const setting = settings[0];
        const currentNumber = setting.nextNumber;
        const nextNumber = currentNumber + 1;
        
        // Format the invoice number according to Romanian standards
        const year = setting.year || new Date().getFullYear();
        const series = setting.series || '';
        const formattedNumber = `${setting.prefix || ''}${series}${currentNumber}${setting.suffix || ''}/${year}`;
        
        // Update the sequence with the next number
        const updateQuery = `
          UPDATE invoice_numbering_settings
          SET 
            last_number = $1,
            next_number = $2,
            updated_at = NOW()
          WHERE id = $3
        `;
        
        await tx.$client.unsafe(updateQuery, [currentNumber, nextNumber, settingId]);
        
        logger.debug(`Generated invoice number ${formattedNumber} for setting ${settingId}, next number is ${nextNumber}`);
        
        return {
          formattedNumber,
          nextNumber
        };
      }, 'getNextInvoiceNumber');
    } catch (error) {
      logger.error(`Failed to get next invoice number for setting ${settingId}`, error);
      throw new Error('Failed to generate next invoice number');
    }
  }
}