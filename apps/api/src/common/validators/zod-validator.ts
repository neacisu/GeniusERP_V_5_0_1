/**
 * Zod Validator
 * 
 * Utility function for validating data using Zod schemas.
 */

import { z } from 'zod';
import { AppError } from '../errors/app-error';
import { fromZodError } from 'zod-validation-error';

/**
 * Validate data against a Zod schema
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated data with correct types
 * @throws AppError if validation fails
 */
export function zodValidate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      const errorDetail = validationError.details.map(detail => {
        return {
          path: detail.path,
          message: detail.message
        };
      });

      // Create user-friendly error with details
      throw new AppError(
        'VALIDATION_ERROR',
        'Datele introduse nu sunt valide',
        400,
        errorDetail
      );
    }

    // Re-throw other errors
    throw error;
  }
}