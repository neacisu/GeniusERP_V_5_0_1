/**
 * HTTP Request Logging Middleware
 * Logs all HTTP requests to Loki via Winston
 */

import { Request, Response, NextFunction } from 'express';
import { logHttpRequest } from '../common/logger/loki-logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Log on response finish event instead of overriding res.end
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log the request
    logHttpRequest(
      req.method,
      req.url,
      res.statusCode,
      duration,
      {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        userId: req.user?.id,
        companyId: req.user?.company_id ?? undefined,
      }
    );
  });
  
  next();
}

