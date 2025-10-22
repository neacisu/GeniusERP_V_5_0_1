import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Setează envDir pentru a citi .env din directorul root al proiectului
  envDir: __dirname,
  
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    // Permit accesul de la geniuserp.app și alte domenii
    host: '0.0.0.0',
    allowedHosts: [
      'geniuserp.app',
      'www.geniuserp.app',
      'localhost',
      '.repl.co',
    ],
    // Setări pentru watch (important pentru Docker)
    watch: {
      usePolling: true, // Necesar pentru Docker volumes
      interval: 100,    // Check interval pentru modificări
    },
    // Setări HMR pentru Docker
    hmr: {
      // Portul pentru HMR websocket
      port: 5000,
      // Permite toate host-urile (necesar pentru Docker)
      host: '0.0.0.0',
      // Protocol pentru HMR
      protocol: 'ws',
      // Clientul se va conecta la localhost:5000 (sau VITE_HMR_CLIENT_URL)
      clientPort: 5000,
    },
  },
});
