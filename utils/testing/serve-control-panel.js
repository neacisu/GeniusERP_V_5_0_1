#!/usr/bin/env node

/**
 * Simple HTTP server pentru Control Panel
 * Serve-ește fișierul HTML și face proxy către Control API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9092;
const CONTROL_PANEL_PATH = path.join(__dirname, 'dashboard', 'control-panel.html');

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve control panel
  if (req.url === '/' || req.url === '/control-panel.html') {
    if (!fs.existsSync(CONTROL_PANEL_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Control Panel not found');
      return;
    }

    const html = fs.readFileSync(CONTROL_PANEL_PATH, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'control-panel-server' }));
    return;
  }

  // 404 pentru alte rute
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('='.repeat(80));
  console.log(`🌐 Control Panel Server pornit pe portul ${PORT}`);
  console.log('='.repeat(80));
  console.log('');
  console.log(`   Control Panel: http://localhost:${PORT}/control-panel.html`);
  console.log(`   Health Check:  http://localhost:${PORT}/health`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️  Oprire server...');
  server.close(() => {
    console.log('✅ Server oprit');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⏹️  Oprire server...');
  server.close(() => {
    console.log('✅ Server oprit');
    process.exit(0);
  });
});

