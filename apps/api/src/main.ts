// Import Sentry instrumentation FIRST - for proper ESM instrumentation
import './instrument';

// Import monkey patch before other imports
import './monkey-patch';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Validate environment variables FIRST (Security critical)
import { validateEnv } from './config/env-validation';
validateEnv();

// Set BullMQ to ignore eviction policy before importing any other modules
process.env['BULLMQ_IGNORE_EVICTION_POLICY'] = "true";

// Backend API server (Express) - No frontend serving
console.log('Starting Backend API server...');

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { initializeModules } from './modules';
// Import the services registry to ensure it's available globally
import './common/services';
// Import the service registry initialization
import { initializeServiceRegistry } from './common/services/registry.init';

// Import Loki Logger
import { createModuleLogger } from './common/logger/loki-logger';
const appLogger = createModuleLogger('app');

// Import Sentry for Express error handling
import * as Sentry from '@sentry/node';
// Import metrics middleware
import { metricsMiddleware, metricsHandler } from './middlewares/metrics.middleware';
// Import logging middleware
import { loggingMiddleware } from './middlewares/logging.middleware';
// Import Sentry test routes (DOAR pentru development)
import testSentryRoutes from './routes/test-sentry.route';
// Security Headers (Helmet & CORS) - imports at top level
import helmet from 'helmet';
import cors from 'cors';

// Create Express app
const app = express();

// Note: Sentry is initialized via instrument.ts (loaded with --import flag)
// This ensures proper instrumentation in ESM context

// Helmet configuration for security headers (API-only, no CSP for HTML serving)
app.use(helmet({
  contentSecurityPolicy: false, // Not serving HTML anymore, frontend handles this
  hsts: process.env['NODE_ENV'] === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration - Folosește CORS_ORIGINS din .ENV
// Construiește default origins dinamic din ENV (ZERO hardcoding)
const FRONTEND_PORT = process.env['VITE_FRONTEND_PORT'] || process.env['APP_PORT_FRONTEND'];
const LEGACY_PORT = process.env['LEGACY_FRONTEND_PORT']; // Pentru backwards compatibility

if (!FRONTEND_PORT && process.env['NODE_ENV'] !== 'production') {
  appLogger.warn('VITE_FRONTEND_PORT nu este configurat - CORS poate să nu funcționeze corect!');
}

const DEFAULT_ORIGINS = [
  FRONTEND_PORT ? `http://localhost:${FRONTEND_PORT}` : null,
  FRONTEND_PORT ? `http://0.0.0.0:${FRONTEND_PORT}` : null,
  FRONTEND_PORT ? `http://frontend:${FRONTEND_PORT}` : null,
  LEGACY_PORT ? `http://localhost:${LEGACY_PORT}` : null,
].filter(Boolean) as string[];

const allowedOrigins = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map(origin => origin.trim())
  : (() => {
      appLogger.warn('CORS_ORIGINS nu este configurat în .ENV - folosesc default-uri construite din VITE_FRONTEND_PORT');
      appLogger.warn(`Default origins: ${DEFAULT_ORIGINS.join(', ')}`);
      appLogger.warn('În producție, setează CORS_ORIGINS explicit pentru securitate!');
      return DEFAULT_ORIGINS;
    })();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      appLogger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

appLogger.info('✓ Security headers (Helmet) and CORS configured');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply metrics middleware early to capture all requests
app.use(metricsMiddleware);

// Apply Loki logging middleware
app.use(loggingMiddleware);

// Serve static files from public directory
app.use('/templates', express.static('public/templates'));

// TypeScript Errors Monitor - serve static files
app.use('/tserrors', express.static('/var/www/html/TypeScriptErrors'));

// Basic health check endpoint - MUST be under /api/ prefix to avoid Vite interference
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SENTRY TEST - Simple error route - MUST be under /api/ to avoid Vite interference
app.get('/api/test-error', () => {
  throw new Error('🧪 TEST: This is a test error for Sentry!');
});

// Prometheus metrics endpoint - MUST be under /api/ to avoid Vite interference
app.get('/api/metrics', metricsHandler);

// Sentry test routes (DOAR în development!)
if (process.env['NODE_ENV'] === 'development') {
  app.use('/api/test-sentry', testSentryRoutes);
  appLogger.info('✅ Sentry test routes enabled at /api/test-sentry/*');
}

// Request logging middleware (API routes only)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      appLogger.info(logLine);
    }
  });

  next();
});

// Create HTTP server
const httpServer = createServer(app);

// Graceful shutdown handler for tsx watch hot reload
let isShuttingDown = false;
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  appLogger.info(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(() => {
    appLogger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    appLogger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

(async () => {
  try {
    // Backend API server startup
    appLogger.info('Starting Backend API server');
    
    // Initialize essential modules
    appLogger.info('Initializing modules...');
    await initializeModules(app);
    
    // No direct permissions API needed, using modular approach
    
    // Initialize service registry
    appLogger.info('Initializing service registry...');
    initializeServiceRegistry();
    
    appLogger.info('Essential services initialized successfully');

    // Sentry error handler - MUST be before the default error handler
    // Only setup if Sentry is configured
    if (process.env['SENTRY_DSN']) {
      Sentry.setupExpressErrorHandler(app);
    }
    
    // General error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      appLogger.error('Error handler', err, { status, message });
      res.status(status).json({ message });
    });

    // Start HTTP server on configured port (from .env)
    // Backend API server - PORT trebuie să fie în .ENV!
    const envPort = process.env['APP_PORT_BACKEND'] || process.env['PORT'] || process.env['VITE_BACKEND_PORT'];
    
    if (!envPort) {
      const fallbackPort = process.env['NODE_ENV'] === 'production' 
        ? null  // În producție NU permitem fallback
        : process.env['APP_PORT_FRONTEND'] || '5001'; // Development fallback din ENV
      
      if (!fallbackPort) {
        appLogger.error('CRITICAL: PORT nu este configurat în .ENV și NODE_ENV=production!');
        appLogger.error('Setează APP_PORT_BACKEND sau PORT în .env!');
        process.exit(1);
      }
      
      appLogger.warn(`PORT nu este configurat în .ENV - folosesc fallback din APP_PORT_FRONTEND: ${fallbackPort}`);
      appLogger.warn('Setează APP_PORT_BACKEND în .env pentru control explicit!');
    }
    
    // Niciun port hardcodat - totul din ENV!
    const finalPort = envPort || (process.env['NODE_ENV'] !== 'production' ? process.env['APP_PORT_FRONTEND'] : null);
    
    if (!finalPort) {
      appLogger.error('CRITICAL: Niciun port configurat în .ENV!');
      process.exit(1);
    }
    
    const port = parseInt(finalPort);
    
    // Handle EADDRINUSE error gracefully (happens with tsx watch hot reload)
    httpServer.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        appLogger.warn(`Port ${port} is already in use. This is normal with tsx watch hot reload. Skipping server start.`);
        // Don't exit, just skip - the old server is still running
        return;
      }
      // For other errors, log and exit
      appLogger.error('Server error', error);
      process.exit(1);
    });
    
    httpServer.listen(port, "0.0.0.0", () => {
      appLogger.info(`✅ Backend API server is running on port ${port}`);
      console.log(`✅ Backend API server is running on port ${port}`);
    });
    
  } catch (error) {
    appLogger.error('Failed to start server', error as Error);
    process.exit(1);
  }
})();