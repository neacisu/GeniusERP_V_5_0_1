/**
 * This file suppresses duplicate Redis policy warnings
 */

// Suppress duplicate eviction policy warnings from BullMQ
const originalConsoleWarn = console.warn;
console.warn = function(...args: unknown[]) {
  // If it's an eviction policy warning, suppress it (already handled in redis.service.ts)
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Eviction policy')) {
    return; // Silently ignore - main warning is in redis.service.ts
  }
  originalConsoleWarn.apply(console, args);
};

// This will help silence eviction policy warnings from BullMQ
process.env['BULLMQ_IGNORE_EVICTION_POLICY'] = "true";