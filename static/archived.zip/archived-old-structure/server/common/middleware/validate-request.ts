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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body if schema provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      
      // Validate query parameters if schema provided
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as any;
      }

      // Validate URL parameters if schema provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as any;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        return res.status(400).json({
          message: 'Validation error',
          errors: error.issues.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Pass other errors to error handler
      next(error);
    }
  };
}