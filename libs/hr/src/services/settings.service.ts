import { Request, Response } from 'express';
import drizzleDb from "@common/drizzle/db";
import { and, eq } from 'drizzle-orm';
import { hrSettings } from '../schema/settings.schema';
import { companies } from '@geniuserp/shared';

// Obținem instanța de bază de date
const db = drizzleDb.getDrizzleInstance();

// Adăugăm manual tabelele în obiectul query
// Această soluție temporară este necesară pentru că db.query nu are
// automat toate tabelele definite în schemeț
const dbWithTables = {
  ...db,
  query: {
    ...db.query,
    hrSettings: {
      findFirst: async ({ where }: { where: any }) => {
        try {
          const result = await db.select().from(hrSettings).where(where).limit(1);
          return result[0] || null;
        } catch (error: any) {
          console.error("Error querying hrSettings:", error);
          return null;
        }
      }
    },
    companies: {
      findFirst: async ({ where }: { where: any }) => {
        try {
          const result = await db.select().from(companies).where(where).limit(1);
          return result[0] || null;
        } catch (error: any) {
          console.error("Error querying companies:", error);
          return null;
        }
      }
    }
  }
};

/**
 * HR Settings Service
 * 
 * Handles HR module settings management
 */
export class SettingsService {
  /**
   * Get HR settings for a company
   */
  static async getSettings(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          error: 'Company ID is required',
        });
      }
      
      // First try to get from hr_settings table
      let settings = await dbWithTables.query.hrSettings.findFirst({
        where: eq(hrSettings.companyId, companyId),
      });
      
      // If no settings exist, get some defaults from company profile
      if (!settings) {
        const company = await dbWithTables.query.companies.findFirst({
          where: eq(companies.id, companyId),
        });
        
        // Create default settings
        settings = {
          id: '',
          companyId,
          defaultProbationPeriod: 90,
          defaultWorkingHours: 40,
          defaultVacationDays: 21,
          defaultSickDays: 5,
          defaultNoticePeriod: 30,
          enableAutoCalculateVacationDays: false,
          enableAutoCalculateSeniority: true,
          enableContractNotifications: true,
          enableBirthdayNotifications: true,
          anafIntegrationEnabled: false,
          anafApiKey: null,
          anafUsername: null,
          anafPassword: null,
          revisalIntegrationEnabled: false,
          revisalApiKey: null,
          revisalUsername: null,
          sendgridEnabled: false,
          sendgridApiKey: null,
          stripeEnabled: false,
          stripeApiKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          
          // Company basic info
          companyName: company?.name || '',
          companyRegistrationNumber: company?.registrationNumber || '',
          fiscalCode: company?.fiscalCode || '',
          address: company?.address || '',
          city: company?.city || '',
          county: company?.county || '',
          postalCode: (company as any)?.postalCode || null,
          country: company?.country || 'România',
          phone: company?.phone || '',
          email: company?.email || '',
          website: (company as any)?.website || null,
          contactPerson: (company as any)?.contactPerson || null,
          contactEmail: (company as any)?.contactEmail || null,
          contactPhone: (company as any)?.contactPhone || null,
        } as any;
      }
      
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Error getting HR settings:', error);
      return res.status(500).json({
        error: 'Failed to get HR settings',
      });
    }
  }
  
  /**
   * Update HR settings for a company
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { id } = req.params;
      const data = req.body;
      
      if (!companyId) {
        return res.status(400).json({
          error: 'Company ID is required',
        });
      }
      
      // Check if settings exist
      const existingSettings = await dbWithTables.query.hrSettings.findFirst({
        where: eq(hrSettings.companyId, companyId),
      });
      
      let result;
      
      if (existingSettings) {
        // Update settings
        result = await db
          .update(hrSettings)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(hrSettings.companyId, companyId))
          .returning();
      } else {
        // Create settings
        result = await db
          .insert(hrSettings)
          .values({
            companyId,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
      }
      
      return res.status(200).json({
        success: true,
        data: result[0],
      });
    } catch (error: any) {
      console.error('Error updating HR settings:', error);
      return res.status(500).json({
        error: 'Failed to update HR settings',
      });
    }
  }
}

export default {
  getSettings: SettingsService.getSettings,
  updateSettings: SettingsService.updateSettings,
};