/**
 * Invoice Numbering Service
 * 
 * This service provides functionality for managing invoice numbering settings
 * according to Romanian fiscal regulations and e-factura requirements.
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { eq, and, isNull, sql } from 'drizzle-orm';
import { invoiceNumberingSettings } from '@shared/schema/invoice-numbering.schema';
import { AppError } from "@common/errors/app-error";

export class InvoiceNumberingService {
  private drizzle: DrizzleService;

  constructor() {
    this.drizzle = new DrizzleService();
  }

  /**
   * Get all invoice numbering settings for a company
   */
  async getInvoiceNumberingSettings(companyId: string) {
    const settings = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(eq(invoiceNumberingSettings.companyId, companyId))
      .orderBy(invoiceNumberingSettings.isDefault, invoiceNumberingSettings.series)
    );

    return settings;
  }

  /**
   * Get an invoice numbering setting by ID
   */
  async getInvoiceNumberingSettingById(id: string) {
    const settings = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(eq(invoiceNumberingSettings.id, id))
      .limit(1)
    );

    if (settings.length === 0) {
      throw new AppError('InvoiceNumberingNotFound', 'Setările de numerotare nu au fost găsite', 404);
    }

    return settings[0];
  }

  /**
   * Get the default invoice numbering setting for a company
   */
  async getDefaultInvoiceNumberingSetting(companyId: string, warehouseId?: string, franchiseId?: string) {
    // Query for a setting that matches the company and warehouse/franchise if provided
    // or is the default setting for the company otherwise
    const settings = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(
        and(
          eq(invoiceNumberingSettings.companyId, companyId),
          eq(invoiceNumberingSettings.isActive, true),
          warehouseId 
            ? eq(invoiceNumberingSettings.warehouseId, warehouseId)
            : isNull(invoiceNumberingSettings.warehouseId),
          franchiseId
            ? eq(invoiceNumberingSettings.franchiseId, franchiseId)
            : isNull(invoiceNumberingSettings.franchiseId),
          eq(invoiceNumberingSettings.isDefault, true)
        )
      )
      .limit(1)
    );

    // If no specific setting for warehouse/franchise, try to get the default setting
    if (settings.length === 0 && (warehouseId || franchiseId)) {
      const defaultSettings = await this.drizzle.query((db) => db.select()
        .from(invoiceNumberingSettings)
        .where(
          and(
            eq(invoiceNumberingSettings.companyId, companyId),
            eq(invoiceNumberingSettings.isActive, true),
            isNull(invoiceNumberingSettings.warehouseId),
            isNull(invoiceNumberingSettings.franchiseId),
            eq(invoiceNumberingSettings.isDefault, true)
          )
        )
        .limit(1)
      );

      if (defaultSettings.length > 0) {
        return defaultSettings[0];
      }
    } else if (settings.length > 0) {
      return settings[0];
    }

    // If still no setting found, return the first active setting for the company
    const anySetting = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(
        and(
          eq(invoiceNumberingSettings.companyId, companyId),
          eq(invoiceNumberingSettings.isActive, true)
        )
      )
      .limit(1)
    );

    if (anySetting.length === 0) {
      throw new AppError(
        'NoInvoiceNumberingSetting', 
        'Nu există setări de numerotare pentru această companie. Vă rugăm să adăugați cel puțin una.',
        404
      );
    }

    return anySetting[0];
  }

  /**
   * Create a new invoice numbering setting
   */
  async createInvoiceNumberingSetting(data: any, userId: string) {
    // Check if series already exists for this company
    const existingSeries = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(
        and(
          eq(invoiceNumberingSettings.companyId, data.companyId),
          eq(invoiceNumberingSettings.series, data.series)
        )
      )
      .limit(1)
    );

    if (existingSeries.length > 0) {
      throw new AppError(
        'DuplicateSeries', 
        `Seria "${data.series}" există deja pentru această companie`,
        400
      );
    }

    // If this is the first setting or setting as default, we need to ensure only one is default
    if (data.isDefault) {
      await this.resetDefaultSettings(data.companyId);
    }

    // Create the new setting
    const [newSetting] = await this.drizzle.query((db) => db.insert(invoiceNumberingSettings)
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId
      })
      .returning()
    );

    return newSetting;
  }

  /**
   * Update an invoice numbering setting
   */
  async updateInvoiceNumberingSetting(id: string, data: any, userId: string) {
    // First check if the setting exists
    const setting = await this.getInvoiceNumberingSettingById(id);

    // If setting as default, ensure only one default per company
    if (data.isDefault) {
      await this.resetDefaultSettings(setting.companyId);
    }

    // Update the setting
    const [updatedSetting] = await this.drizzle.query((db) => db.update(invoiceNumberingSettings)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(invoiceNumberingSettings.id, id))
      .returning()
    );

    return updatedSetting;
  }

  /**
   * Delete an invoice numbering setting
   */
  async deleteInvoiceNumberingSetting(id: string) {
    // Check if the setting exists and is not default
    const setting = await this.getInvoiceNumberingSettingById(id);

    if (setting.isDefault) {
      throw new AppError(
        'DeleteDefaultSetting',
        'Nu puteți șterge setarea implicită. Vă rugăm să setați o altă serie ca implicită înainte de ștergere.',
        400
      );
    }

    // Delete the setting
    await this.drizzle.query((db) => db.delete(invoiceNumberingSettings)
      .where(eq(invoiceNumberingSettings.id, id))
    );

    return { message: 'Setarea de numerotare a fost ștearsă cu succes' };
  }

  /**
   * Reset all default settings for a company
   * Makes all settings non-default
   */
  private async resetDefaultSettings(companyId: string) {
    await this.drizzle.query((db) => db.update(invoiceNumberingSettings)
      .set({ isDefault: false })
      .where(
        and(
          eq(invoiceNumberingSettings.companyId, companyId),
          eq(invoiceNumberingSettings.isDefault, true)
        )
      )
    );
  }

  /**
   * Generate a new invoice number for a specific series
   * This method also updates the lastNumber and nextNumber
   */
  async generateInvoiceNumber(companyId: string, series: string) {
    // Get the numbering setting for this series
    const settings = await this.drizzle.query((db) => db.select()
      .from(invoiceNumberingSettings)
      .where(
        and(
          eq(invoiceNumberingSettings.companyId, companyId),
          eq(invoiceNumberingSettings.series, series),
          eq(invoiceNumberingSettings.isActive, true)
        )
      )
      .limit(1)
    );

    if (settings.length === 0) {
      throw new AppError(
        'InvoiceNumberingNotFound',
        `Setările de numerotare pentru seria "${series}" nu au fost găsite sau nu sunt active`,
        404
      );
    }

    const setting = settings[0];

    // Format the number with leading zeros (5 digits)
    const formattedNumber = String(setting.nextNumber).padStart(5, '0');

    // Build the full invoice number with prefix and suffix if provided
    const fullNumber = [
      setting.prefix || '',
      formattedNumber,
      setting.suffix || ''
    ].join('');

    // Update the last and next numbers atomically
    const [updatedSetting] = await this.drizzle.query((db) => db.update(invoiceNumberingSettings)
      .set({
        lastNumber: setting.nextNumber,
        nextNumber: setting.nextNumber + 1,
        updatedAt: new Date()
      })
      .where(eq(invoiceNumberingSettings.id, setting.id))
      .returning()
    );

    return {
      number: setting.nextNumber,
      formattedNumber: fullNumber,
      series: setting.series
    };
  }
}