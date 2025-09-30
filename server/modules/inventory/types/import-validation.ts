/**
 * Tipuri pentru validarea datelor de import
 * 
 * Aceste tipuri sunt folosite pentru a valida datele de import
 * pentru produse și categorii în etapa de pre-procesare.
 */

import { z } from 'zod';

/**
 * Schema de validare pentru datele minime obligatorii la importul de produse
 */
export const ProductImportRowSchema = z.object({
  name: z.string()
    .min(2, { message: 'Numele produsului trebuie să aibă cel puțin 2 caractere' })
    .max(100, { message: 'Numele produsului nu poate depăși 100 de caractere' }),
  
  sku: z.string()
    .min(2, { message: 'Stock Keeping Unit (SKU) trebuie să aibă cel puțin 2 caractere' })
    .max(50, { message: 'Stock Keeping Unit (SKU) nu poate depăși 50 de caractere' }),
  
  price: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val,
    z.number().positive({ message: 'Prețul trebuie să fie un număr pozitiv' })
  ),
  
  // Câmpuri opționale
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  vatRate: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val,
    z.number().min(0).max(100).optional()
  ),
  purchasePrice: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val,
    z.number().positive().optional()
  ),
  // Adăugăm câmpul barcode pentru codurile EAN13
  barcode: z.string()
    .regex(/^[0-9]{13}$/, { message: 'Codul de bare trebuie să fie un cod EAN13 valid (13 cifre)' })
    .optional(),
  stockAlert: z.preprocess(
    (val) => typeof val === 'string' ? parseInt(val.toString()) : val,
    z.number().min(0).optional()
  ),
  isActive: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const normalizedVal = val.toLowerCase();
        if (['true', 'da', '1', 'yes', 'activ'].includes(normalizedVal)) return true;
        if (['false', 'nu', '0', 'no', 'inactiv'].includes(normalizedVal)) return false;
      }
      return val;
    },
    z.boolean().optional().default(true)
  ),
});

export type ProductImportRow = z.infer<typeof ProductImportRowSchema>;

/**
 * Rezultatul validării unei linii de import
 */
export interface ValidationResult {
  isValid: boolean;
  row: number;
  data?: any;
  errors?: string[];
}

/**
 * Raport de validare pentru un fișier de import
 */
export interface ImportValidationReport {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number; 
    errors: string[];
  }>;
  validData: ProductImportRow[];
}

/**
 * Opțiuni pentru procesarea importului
 */
export interface ImportOptions {
  mode: 'create' | 'update';
  matchField?: 'sku' | 'name';
  format: 'excel' | 'csv' | 'json';
  generateBarcodes: boolean;
  companyId: string;
}

/**
 * Rezultatul final al procesului de import
 */
export interface ImportResult {
  success: boolean;
  message: string;
  report?: {
    processedRows: number;
    createdRows: number;
    updatedRows: number;
    skippedRows: number;
    errors: Array<{
      row: number;
      errors: string[];
    }>;
  };
}