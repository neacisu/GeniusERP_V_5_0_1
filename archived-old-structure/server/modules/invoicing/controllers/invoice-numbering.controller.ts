/**
 * Invoice Numbering Controller
 * 
 * Handles API endpoints for managing invoice numbering settings.
 */

import { Request, Response } from 'express';
import { InvoiceNumberingService } from '../services/invoice-numbering.service';
import { insertInvoiceNumberingSettingsSchema, updateInvoiceNumberingSettingsSchema } from '@shared/schema/invoice-numbering.schema';
import { zodValidate } from '../../../common/validators/zod-validator';
import { getUserCompanyId } from '../../../common/utils/company-utils';
import { getUserId } from '../../../common/utils/auth-utils';

export class InvoiceNumberingController {
  private invoiceNumberingService: InvoiceNumberingService;

  constructor() {
    this.invoiceNumberingService = new InvoiceNumberingService();
  }

  /**
   * Get all invoice numbering settings for the user's company
   */
  async getAll(req: Request, res: Response) {
    try {
      const companyId = await getUserCompanyId(req);
      
      const settings = await this.invoiceNumberingService.getInvoiceNumberingSettings(companyId);
      
      return res.json(settings);
    } catch (error: any) {
      console.error('Error getting invoice numbering settings:', error);
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la obținerea setărilor de numerotare' 
      });
    }
  }

  /**
   * Get an invoice numbering setting by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const setting = await this.invoiceNumberingService.getInvoiceNumberingSettingById(id);
      
      return res.json(setting);
    } catch (error: any) {
      console.error('Error getting invoice numbering setting:', error);
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la obținerea setării de numerotare' 
      });
    }
  }

  /**
   * Create a new invoice numbering setting
   */
  async create(req: Request, res: Response) {
    try {
      const companyId = await getUserCompanyId(req);
      const userId = getUserId(req);
      
      // Validate the request body
      const validatedData = zodValidate(insertInvoiceNumberingSettingsSchema, req.body);
      
      // Set the company ID from the user session
      validatedData.companyId = companyId;
      
      // Create the setting
      const newSetting = await this.invoiceNumberingService.createInvoiceNumberingSetting(validatedData, userId);
      
      return res.status(201).json(newSetting);
    } catch (error: any) {
      console.error('Error creating invoice numbering setting:', error);
      
      // Handle validation errors specifically
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(400).json({ 
          error: 'VALIDATION_ERROR',
          message: 'Datele introduse nu sunt valide', 
          details: error.details
        });
      }
      
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la crearea setării de numerotare' 
      });
    }
  }

  /**
   * Update an existing invoice numbering setting
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      // Validate the request body
      const validatedData = zodValidate(updateInvoiceNumberingSettingsSchema, req.body);
      
      // Update the setting
      const updatedSetting = await this.invoiceNumberingService.updateInvoiceNumberingSetting(id, validatedData, userId);
      
      return res.json(updatedSetting);
    } catch (error: any) {
      console.error('Error updating invoice numbering setting:', error);
      
      // Handle validation errors specifically
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(400).json({ 
          error: 'VALIDATION_ERROR',
          message: 'Datele introduse nu sunt valide', 
          details: error.details
        });
      }
      
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la actualizarea setării de numerotare' 
      });
    }
  }

  /**
   * Delete an invoice numbering setting
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await this.invoiceNumberingService.deleteInvoiceNumberingSetting(id);
      
      return res.json(result);
    } catch (error: any) {
      console.error('Error deleting invoice numbering setting:', error);
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la ștergerea setării de numerotare' 
      });
    }
  }

  /**
   * Generate a new invoice number
   */
  async generateNumber(req: Request, res: Response) {
    try {
      const companyId = await getUserCompanyId(req);
      const { series } = req.body;
      
      if (!series) {
        return res.status(400).json({
          error: 'MISSING_SERIES',
          message: 'Seria facturilor este obligatorie'
        });
      }
      
      const result = await this.invoiceNumberingService.generateInvoiceNumber(companyId, series);
      
      return res.json(result);
    } catch (error: any) {
      console.error('Error generating invoice number:', error);
      return res.status(error.status || 500).json({ 
        error: error.code || 'SERVER_ERROR',
        message: error.message || 'Eroare la generarea numărului de factură' 
      });
    }
  }
}