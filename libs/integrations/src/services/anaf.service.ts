/**
 * ANAF (Romanian Tax Authority) Integration Service
 * 
 * This service provides integration with ANAF APIs for:
 * - VAT number validation
 * - Company information retrieval
 * - Tax status verification
 * 
 * Reference: https://www.anaf.ro/anaf/internet/ANAF/servicii_online/servicii_web_anaf
 */

import { createHttpClient, HttpClient } from '@geniuserp/shared/libs/http-client';

export interface AnafConfig {
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface VatValidationResult {
  valid: boolean;
  name?: string;
  address?: string;
  fiscalCode: string;
  vatNumber?: string;
  registrationDate?: string;
  active?: boolean;
  message?: string;
}

export interface CompanyInfo {
  name: string;
  fiscalCode: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  phone?: string;
  email?: string;
  active: boolean;
  vatPayer: boolean;
  lastUpdated?: string;
}

export class AnafService {
  private httpClient: HttpClient;
  
  constructor(config: AnafConfig = {}) {
    const baseURL = config.apiBaseUrl || 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8';
    
    this.httpClient = createHttpClient({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.apiKey ? { 'X-API-KEY': config.apiKey } : {})
      }
    });
    
    console.log('🏛️ ANAF service initialized', 'anaf');
  }

  /**
   * Validate a Romanian VAT number (CUI)
   * @param vatNumber - The VAT number to validate (without RO prefix)
   */
  async validateVat(vatNumber: string): Promise<VatValidationResult> {
    try {
      // Clean up VAT number - remove 'RO' prefix if present
      const cleanVat = vatNumber.replace(/^RO/i, '').trim();
      
      console.log(`🔍 Validating VAT number: ${cleanVat}`, 'anaf');
      
      // Format for ANAF API
      const payload = [{
        cui: cleanVat,
        data: new Date().toISOString().split('T')[0]
      }];
      
      const response = await this.httpClient.post<any>('/ws/tva', payload);
      
      if (!response || !response.length || !response[0]) {
        return {
          valid: false,
          fiscalCode: cleanVat,
          message: 'No data returned from ANAF'
        };
      }
      
      const result = response[0];
      
      return {
        valid: result.valid === true || result.valid === 1,
        name: result.denumire,
        address: result.adresa,
        fiscalCode: cleanVat,
        vatNumber: result.scpTVA ? `RO${cleanVat}` : cleanVat,
        registrationDate: result.data_inregistrare,
        active: result.statusInactivi !== 'INACTIV',
        message: result.mesaj
      };
    } catch (error: any) {
      console.log(`❌ Error validating VAT number: ${error.message}`, 'anaf');
      
      return {
        valid: false,
        fiscalCode: vatNumber,
        message: `Failed to validate VAT number: ${error.message}`
      };
    }
  }

  /**
   * Get detailed information about a company by fiscal code (CUI)
   * @param fiscalCode - The fiscal code (CUI) of the company
   */
  async getCompanyInfo(fiscalCode: string): Promise<CompanyInfo | null> {
    try {
      // Clean up fiscal code - remove 'RO' prefix if present
      const cleanFiscalCode = fiscalCode.replace(/^RO/i, '').trim();
      
      console.log(`🔍 Retrieving company info for fiscal code: ${cleanFiscalCode}`, 'anaf');
      
      // First validate the VAT number to get basic info
      const vatValidation = await this.validateVat(cleanFiscalCode);
      
      if (!vatValidation.valid) {
        console.log(`❌ Invalid fiscal code: ${cleanFiscalCode}`, 'anaf');
        return null;
      }
      
      // For more detailed information, we need another API call
      // This is a placeholder for a real implementation
      
      return {
        name: vatValidation.name || '',
        fiscalCode: cleanFiscalCode,
        address: vatValidation.address,
        active: vatValidation.active || false,
        vatPayer: !!vatValidation.vatNumber?.startsWith('RO'),
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      console.log(`❌ Error retrieving company info: ${error.message}`, 'anaf');
      return null;
    }
  }

  /**
   * Check if a company is registered for e-Factura
   * @param fiscalCode - The fiscal code (CUI) of the company
   */
  async checkEFacturaRegistration(fiscalCode: string): Promise<boolean> {
    try {
      // This is a placeholder - ANAF doesn't currently have a public API for this check
      console.log(`🔍 Checking e-Factura registration for: ${fiscalCode}`, 'anaf');
      
      // In a real implementation, this would make an API call to ANAF
      // For now we assume larger companies are registered (just as an example)
      const companyInfo = await this.getCompanyInfo(fiscalCode);
      
      if (!companyInfo) {
        return false;
      }
      
      // This is completely made up for demonstration - not real logic
      const isRegistered = companyInfo.active && companyInfo.vatPayer;
      
      console.log(`ℹ️ e-Factura registration status for ${fiscalCode}: ${isRegistered ? 'Registered' : 'Not registered'}`, 'anaf');
      
      return isRegistered;
    } catch (error: any) {
      console.log(`❌ Error checking e-Factura registration: ${error.message}`, 'anaf');
      return false;
    }
  }

  /**
   * Validates that a fiscal code is properly formatted according to Romanian rules
   * This is a client-side validation, doesn't make an API call
   */
  validateFiscalCodeFormat(fiscalCode: string): boolean {
    // Remove 'RO' prefix if present
    const cleanFiscalCode = fiscalCode.replace(/^RO/i, '').trim();
    
    // CUI should be 2-10 digits
    if (!/^\d{2,10}$/.test(cleanFiscalCode)) {
      return false;
    }
    
    // For proper validation, implement the Romanian CUI validation algorithm
    // This is a simplified check
    if (cleanFiscalCode.length < 2) {
      return false;
    }
    
    return true;
  }
}

// Create a default instance for common use
export const anafService = new AnafService();