import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import runtimeErrorModal from '@replit/vite-plugin-runtime-error-modal';

// ES Module: definim __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // NX Monorepo: root este directorul curent (apps/web)
  root: __dirname,
  
  // Setează envDir pentru a citi .env din directorul root al workspace-ului
  envDir: path.resolve(__dirname, '../..'),
  
  plugins: [
    react(),
    themePlugin(),
    runtimeErrorModal(),
    // Replit Cartographer (doar în development)
    ...(process.env['NODE_ENV'] !== "production" && process.env['REPL_ID'] !== undefined
      ? [
          // Dynamic import pentru Cartographer
          (async () => {
            const cartographer = await import("@replit/vite-plugin-cartographer");
            return cartographer.cartographer();
          })()
        ]
      : []),
  ],
  
  server: {
    // Toate valorile OBLIGATORIU din .env - FĂRĂ fallback!
    port: parseInt(process.env['APP_PORT_FRONTEND']!),
    host: '0.0.0.0',  // TREBUIE să fie 0.0.0.0 pentru Docker (nu VITE_HMR_HOST care e domeniu public!)
    strictPort: true,
    
    // allowedHosts DOAR din .env (VITE_ALLOWED_HOSTS)
    allowedHosts: process.env['VITE_ALLOWED_HOSTS']!.split(',').map(h => h.trim()).filter(Boolean),
    
    // Setări watch DOAR din .env
    watch: {
      usePolling: process.env['CHOKIDAR_USEPOLLING'] === 'true',
      interval: parseInt(process.env['CHOKIDAR_INTERVAL']!),
    },
    
    // Setări HMR DOAR din .env
    hmr: {
      port: parseInt(process.env['VITE_HMR_PORT']!),
      host: '0.0.0.0',  // Server bind la 0.0.0.0
      protocol: process.env['VITE_HMR_PROTOCOL'] as 'ws' | 'wss',
      clientPort: parseInt(process.env['VITE_HMR_CLIENT_PORT']!),
      overlay: true,
    },
    
    // Proxy pentru API - port DOAR din .env
    proxy: {
      '/api': {
        target: `http://localhost:${process.env['APP_PORT_BACKEND']}`,
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    reportCompressedSize: process.env['NODE_ENV'] === 'production',
    sourcemap: process.env['NODE_ENV'] !== 'production',
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../libs/shared/src'),
    }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-hook-form', '@tanstack/react-query']
  }
});

