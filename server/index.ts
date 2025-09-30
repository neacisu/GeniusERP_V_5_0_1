// Import monkey patch first before any other imports
import './monkey-patch';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Set BullMQ to ignore eviction policy before importing any other modules
process.env.BULLMQ_IGNORE_EVICTION_POLICY = "true";

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

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use('/templates', express.static('public/templates'));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
    console.log('Starting server with minimal services for debugging');
    
    // Initialize essential modules
    console.log('Initializing modules...');
    await initializeModules(app);
    
    // No direct permissions API needed, using modular approach
    
    // Initialize service registry
    console.log('Initializing service registry...');
    initializeServiceRegistry();
    
    console.log('Essential services initialized successfully');

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Error handler:', status, message, err.stack);
      res.status(status).json({ message });
    });

    // Vite setup for frontend - DUPĂ ce am înregistrat toate rutele API
    if (app.get("env") === "development") {
      console.log('Setting up Vite development server...');
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    // Start HTTP server
    const port = 5000;
    httpServer.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server is running on port ${port}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();