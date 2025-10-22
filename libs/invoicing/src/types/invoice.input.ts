/**
 * Invoice Input Type Definitions
 * 
 * This file contains TypeScript interfaces for invoice inputs.
 * Matches the interface used by CreateInvoiceService but with
 * snake_case field names as used in the API.
 */

/**
 * Interface for creating a new invoice through the API
 */
export interface CreateInvoiceInput {
  /** Company ID that owns the invoice */
  company_id: string;
  
  /** Optional franchise ID */
  franchise_id?: string | null;
  
  /** Currency code (ISO) */
  currency: string;
  
  /** Optional target currency for conversion */
  convert_to?: string;
  
  /** Invoice amount */
  amount: number;
  
  /** Invoice series for numbering */
  series: string;
}