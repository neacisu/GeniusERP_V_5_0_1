import { Express, Request, Response, NextFunction } from 'express';
import AuditService from './services/audit.service';
import { storage } from '../../storage';
import { initAuditRoutes } from './routes/audit.routes';

/**
 * Initialize the Audit module
 * 
 * @param app Express application
 */
export function initAuditModule(app: Express) {
  // Register API request logging middleware
  app.use('/api', createApiAuditMiddleware());
  
  // Register audit API routes
  const auditRouter = initAuditRoutes();
  app.use('/api/audit', auditRouter);
  
  console.log('📝 Audit module initialized');
  // Create an instance and return it so other modules can use it
  const auditService = AuditService; 
  return { auditService };
}

/**
 * Create middleware to log API requests for auditing
 */
function createApiAuditMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for GET requests (read-only operations)
    if (req.method === 'GET') {
      return next();
    }
    
    // Store original response data
    const originalSend = res.send;
    
    // Override send method
    res.send = function(body?: any): Response {
      // Execute original send to continue normal flow
      const result = originalSend.call(res, body);
      
      // Skip certain endpoints to avoid excessive logging
      if (req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/token')) {
        return result;
      }
      
      // Process and log successful responses
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 300;
      
      if (isSuccess) {
        // Extract entity and action from the URL path
        const pathParts = req.path.split('/').filter(Boolean);
        const entity = pathParts[1] || 'unknown';
        let action = '';
        
        switch (req.method) {
          case 'POST':
            action = 'CREATE';
            break;
          case 'PUT':
          case 'PATCH':
            action = 'UPDATE';
            break;
          case 'DELETE':
            action = 'DELETE';
            break;
          default:
            action = req.method;
        }
        
        // Log the API request asynchronously (don't block response)
        setTimeout(() => {
          AuditService.logFromRequest(req, {
            action: `${action}_${entity.toUpperCase()}`,
            entity,
            entityId: pathParts[2] || 'batch',
            details: {
              method: req.method,
              path: req.path,
              body: req.body ? JSON.stringify(req.body).substring(0, 1000) : null,
              statusCode,
            }
          }).catch(err => {
            console.error('[AuditMiddleware] Failed to log API request:', err);
          });
        }, 0);
      }
      
      return result;
    };
    
    next();
  };
}

// Export the audit service for use in other modules
export { AuditService };