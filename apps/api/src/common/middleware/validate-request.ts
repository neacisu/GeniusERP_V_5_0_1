/**
 * Request Validation Middleware
 * 
 * This middleware validates request data against Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Create a middleware function that validates request data against provided schemas
 * @param schemas The schemas to validate against
 * @returns Express middleware function
 */
export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      
      // Validate query parameters if schema provided
      // NOTE: req.query is a getter-only property in Express, cannot be reassigned
      // We validate but don't modify it - if validation passes, the original query is safe to use
      if (schemas.query) {
        await schemas.query.parseAsync(req.query);
      }

      // Validate URL parameters if schema provided
      // NOTE: req.params is also a getter-only property in Express
      // We validate but don't modify it
      if (schemas.params) {
        await schemas.params.parseAsync(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      
      // Pass other errors to error handler
      next(error);
    }
  };
}