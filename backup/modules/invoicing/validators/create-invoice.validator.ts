/**
 * Create Invoice Validator
 * 
 * Validates the input for creating an invoice with currency conversion.
 * Ensures that all required fields are present and have the correct types.
 */

import { z } from 'zod';

// Define the validation schema for creating an invoice with currency conversion
export const createInvoiceSchema = z.object({
  companyId: z.string().uuid({
    message: "Company ID must be a valid UUID",
  }),
  franchiseId: z.string().uuid({
    message: "Franchise ID must be a valid UUID",
  }).optional(),
  currency: z.string().min(3).max(5).default('RON'),
  convertTo: z.string().min(3).max(5).optional(),
  totalAmount: z.number().positive({
    message: "Total amount must be a positive number",
  }),
  series: z.string().min(1).max(8).optional(),
});

// Type for create invoice input based on the schema
export type CreateInvoiceSchemaType = z.infer<typeof createInvoiceSchema>;

/**
 * Validate the input for creating an invoice
 * @param input The input data to validate
 * @returns A validation result
 */
export function validateCreateInvoiceInput(input: unknown) {
  return createInvoiceSchema.safeParse(input);
}