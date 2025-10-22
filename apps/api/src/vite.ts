import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
// NX: vite.config este la rădăcină workspace-ului
import viteConfig from "../../../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      // HMR settings pentru Docker - CRITIC pentru a evita eroarea ws://localhost:5173
      port: 5000,
      host: '0.0.0.0',
      protocol: 'ws' as const,
      clientPort: 5000,
      overlay: true,
    },
    allowedHosts: true as true,
    // Setări watch pentru Docker (override dacă nu sunt în config)
    watch: {
      usePolling: true,
      interval: 100,
    },
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Catch-all route for SPA - ONLY serve HTML if Vite didn't handle the request
  // This ensures Vite processes .tsx, .ts, .css files FIRST
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    // Skip for API routes
    if (url.startsWith('/api/')) {
      return next();
    }

    // Skip if response already sent by Vite middleware
    if (res.headersSent) {
      return;
    }

    // Skip for asset files that Vite should handle
    if (url.match(/\.(js|ts|tsx|jsx|css|json|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Date.now()}`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist, but exclude API routes
  // Use middleware without path parameter to avoid path-to-regexp issues
  app.use((req, res) => {
    // Don't serve index.html for API routes
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
