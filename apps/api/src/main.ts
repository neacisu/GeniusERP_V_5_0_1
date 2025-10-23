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

// We are using Express as our standardized framework
console.log('Starting Express application...');

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
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

// Helmet configuration for security headers
app.use(helmet({
  contentSecurityPolicy: process.env['NODE_ENV'] === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for React dev
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://webservicesp.anaf.ro", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false, // Disable CSP in development for HMR
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

// CORS configuration
const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://0.0.0.0:5000'
];

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

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SENTRY TEST - Simple error route
app.get('/test-error', () => {
  throw new Error('🧪 TEST: This is a test error for Sentry!');
});

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// Sentry test routes (DOAR în development!)
if (process.env['NODE_ENV'] === 'development') {
  app.use('/api/test-sentry', testSentryRoutes);
  appLogger.info('✅ Sentry test routes enabled at /api/test-sentry/*');
}

// Request logging middleware
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

      log(logLine);
    }
  });

  next();
});

// Create HTTP server
const httpServer = createServer(app);

(async () => {
  try {
    // Simplified startup for debugging purposes
    appLogger.info('Starting server with minimal services for debugging');
    
    // Initialize essential modules FIRST - BEFORE Vite middleware
    // This ensures API routes are registered before the catch-all SPA handler
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

    // Error handling middleware for API routes
    // This catches API errors BEFORE Vite's catch-all handler
    app.use('/api/*', (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      appLogger.error('API Error handler', err, { status, message });
      res.status(status).json({ message });
    });

    // Setup Vite for frontend serving (dev & prod)
    // This MUST come AFTER API routes registration
    if (app.get("env") === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }
    
    // General error handling middleware for non-API routes
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      appLogger.error('Error handler', err, { status, message });
      res.status(status).json({ message });
    });

    // Start HTTP server on port 5000 (un singur port pentru tot)
    const port = 5000;
    httpServer.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      appLogger.info(`Server is running on port ${port}`);
      log(`Server is running on port ${port}`); // Keep vite log too
    });
    
  } catch (error) {
    appLogger.error('Failed to start server', error as Error);
    process.exit(1);
  }
})();