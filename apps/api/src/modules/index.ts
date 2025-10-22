// Module initialization - imports from NX libs
import type { Express } from 'express';
import session from 'express-session';
import { setupAuthRoutes } from '@geniuserp/auth';

// Import module initializers from libs
// Note: Each lib should export an init function or router

export async function initializeModules(app: Express): Promise<void> {
  console.log('Initializing modules from NX libraries...');
  
  // Setup session store (using MemoryStore for development)
  // TODO: Use Redis in production
  const sessionStore = new session.MemoryStore();
  
  // Register auth routes at /api/auth
  const authRouter = setupAuthRoutes(app, sessionStore);
  app.use('/api/auth', authRouter);
  
  console.log('✅ Auth routes registered at /api/auth');
  console.log('Modules initialized successfully');
}

