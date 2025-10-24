/**
 * e-Factura Integration Service
 * 
 * This service provides integration with Romania's e-Factura electronic invoicing system.
 * It handles the submission of invoices to ANAF (Romanian Tax Authority) in the required format.
 * 
 * Reference: https://mfinante.gov.ro/ro/web/efactura/
 */

import { createHttpClient, HttpClient } from '@geniuserp/shared/libs/http-client';
import { log } from "@api/vite";

// Types for e-Factura requests and responses
export interface EFacturaConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  environment?: 'production' | 'test';
  certificateFilePath?: string;
  certificatePassword?: string;
}

export interface EFacturaSubmissionResult {
  success: boolean;
  message: string;
  referenceId?: string;
  timestamp?: string;
  errors?: string[];
}

export interface EFacturaInvoiceStatus {
  referenceId: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  timestamp?: string;
  details?: Record<string, any>;
}

export class EFacturaService {
  private httpClient: HttpClient;
  private environment: 'production' | 'test';
  
  constructor(config: EFacturaConfig = {}) {
    this.environment = config.environment || 'test';
    
    // Base URL differs between environments
    const baseURL = config.apiBaseUrl || 
      (this.environment === 'production' 
        ? 'https://api.anaf.ro/prod/CUIIO/rest/efactura' 
        : 'https://api.anaf.ro/test/CUIIO/rest/efactura');
    
    this.httpClient = createHttpClient({
      baseURL,
      timeout: 30000, // Longer timeout for government services
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/json',
        ...(config.apiKey ? { 'X-API-KEY': config.apiKey } : {})
      }
    });
    
    log(`🧾 e-Factura service initialized in ${this.environment} environment`, 'e-factura');
  }

  /**
   * Submit an invoice to e-Factura system in UBL format
   * @param invoiceXml - The invoice in UBL XML format
   * @param metadata - Additional metadata required by e-Factura
   */
  async submitInvoice(invoiceXml: string, metadata: Record<string, any> = {}): Promise<EFacturaSubmissionResult> {
    try {
      log(`📤 Submitting invoice to e-Factura (${this.environment})`, 'e-factura');
      
      // In a real implementation, you would:
      // 1. Convert your invoice to the UBL XML format
      // 2. Digitally sign the XML with your certificate
      // 3. Submit to ANAF's API
      
      // This is a placeholder for the actual API call
      const response = await this.httpClient.post<any>('/upload', invoiceXml, {
        headers: {
          'X-Transaction-ID': metadata['transactionId'] || new Date().getTime().toString(),
          'X-Company-CUI': metadata['companyCui'],
          'X-Company-Name': metadata['companyName']
        }
      });
      
      log(`✅ Successfully submitted invoice to e-Factura`, 'e-factura');
      
      return {
        success: true,
        message: 'Invoice submitted successfully',
        referenceId: response.referenceId,
        timestamp: response.timestamp
      };
    } catch (error: any) {
      log(`❌ Error submitting invoice to e-Factura: ${error.message}`, 'e-factura');
      
      return {
        success: false,
        message: `Failed to submit invoice: ${error.message}`,
        errors: error.response?.data?.errors || [error.message]
      };
    }
  }

  /**
   * Check the status of a submitted invoice
   * @param referenceId - The reference ID returned from submitInvoice
   */
  async checkInvoiceStatus(referenceId: string): Promise<EFacturaInvoiceStatus> {
    try {
      log(`🔍 Checking e-Factura invoice status for reference: ${referenceId}`, 'e-factura');
      
      const response = await this.httpClient.get<any>(`/status/${referenceId}`);
      
      return {
        referenceId,
        status: response.status,
        message: response.message,
        timestamp: response.timestamp,
        details: response.details
      };
    } catch (error: any) {
      log(`❌ Error checking e-Factura invoice status: ${error.message}`, 'e-factura');
      
      throw new Error(`Failed to check invoice status: ${error.message}`);
    }
  }
  
  /**
   * Generate UBL XML format for an invoice
   * @param invoiceData - The invoice data to convert to UBL XML
   */
  generateUblXml(invoiceData: Record<string, any>): string {
    // In a real implementation, this would generate proper UBL XML
    // For now, we return a placeholder
    
    log(`📝 Generating UBL XML for invoice ${invoiceData['invoiceNumber']}`, 'e-factura');
    
    // This is just a simplified example - real UBL XML is much more complex
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${invoiceData['invoiceNumber']}</cbc:ID>
  <cbc:IssueDate>${invoiceData['issueDate']}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoiceData['currency']}</cbc:DocumentCurrencyCode>
  <!-- Additional invoice data would go here -->
</Invoice>`;
  }

  /**
   * Download an invoice from e-Factura system
   * @param referenceId - The reference ID of the invoice to download
   */
  async downloadInvoice(referenceId: string): Promise<Buffer | null> {
    try {
      log(`📥 Downloading invoice from e-Factura for reference: ${referenceId}`, 'e-factura');
      
      const response = await this.httpClient.get<any>(`/download/${referenceId}`, {
        responseType: 'arraybuffer'
      });
      
      log(`✅ Successfully downloaded invoice from e-Factura`, 'e-factura');
      
      return Buffer.from(response);
    } catch (error: any) {
      log(`❌ Error downloading invoice from e-Factura: ${error.message}`, 'e-factura');
      
      throw new Error(`Failed to download invoice: ${error.message}`);
    }
  }

  /**
   * Send invoice (alias for submitInvoice)
   */
  async sendInvoice(invoiceXml: string, metadata: Record<string, any> = {}): Promise<EFacturaSubmissionResult> {
    return this.submitInvoice(invoiceXml, metadata);
  }

  /**
   * Generate invoice XML (alias for generateUblXml)
   */
  generateInvoiceXml(invoiceData: Record<string, any>): string {
    return this.generateUblXml(invoiceData);
  }

  /**
   * Validate invoice XML format
   */
  async validateInvoiceXml(invoiceXml: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      // Basic XML validation
      if (!invoiceXml || invoiceXml.trim().length === 0) {
        return { valid: false, errors: ['XML content is empty'] };
      }
      
      if (!invoiceXml.includes('<?xml')) {
        return { valid: false, errors: ['Invalid XML format - missing XML declaration'] };
      }
      
      return { valid: true };
    } catch (error: any) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Download invoice metadata (alias for downloadInvoice)
   */
  async downloadInvoiceMetadata(referenceId: string): Promise<any> {
    const data = await this.downloadInvoice(referenceId);
    return {
      referenceId,
      data: data?.toString('base64')
    };
  }
}

// Create a default instance for common use
export const eFacturaService = new EFacturaService();