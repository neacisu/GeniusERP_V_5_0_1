import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Creează un registry pentru metrici
export const register = new client.Registry();

// Adaugă metrici default (CPU, memorie, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'geniuserp_',
});

// Metrici custom pentru HTTP requests
const httpRequestDuration = new client.Histogram({
  name: 'geniuserp_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'geniuserp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestErrors = new client.Counter({
  name: 'geniuserp_http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Middleware pentru colectarea metricilor HTTP
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Interceptează finalizarea response-ului
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // Înregistrează durata request-ului
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    
    // Înregistrează totalul de requests
    httpRequestTotal.inc({ method, route, status_code: statusCode });
    
    // Înregistrează erorile (5xx și 4xx)
    if (res.statusCode >= 400) {
      httpRequestErrors.inc({ method, route, status_code: statusCode });
    }
  });
  
  next();
}

// Handler pentru endpoint-ul /metrics
export async function metricsHandler(req: Request, res: Response) {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
}

