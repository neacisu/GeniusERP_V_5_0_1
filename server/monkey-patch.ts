/**
 * This file suppresses Redis policy warnings and makes BullMQ work with Redis Cloud
 */

// Make the eviction policy warning much less verbose
const originalConsoleWarn = console.warn;
console.warn = function(...args: any[]) {
  // If it's an eviction policy warning, just print it once
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Eviction policy')) {
    if (!(global as any).__evictionPolicyWarned) {
      originalConsoleWarn('Redis Cloud note: Using volatile-lru policy instead of noeviction. Some features may be affected.');
      (global as any).__evictionPolicyWarned = true;
    }
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// This will help silence eviction policy warnings
process.env.BULLMQ_IGNORE_EVICTION_POLICY = "true";

console.log('Applied Redis eviction policy warning suppression');