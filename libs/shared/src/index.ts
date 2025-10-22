// Shared library exports - NX Monorepo
// Export all schemas
export * from './schema';

// Export types selectively to avoid conflicts
export { UserRole, Service } from './types';
export type { User, JwtUserData, SessionData } from './types';

// Re-export schema as namespace for compatibility with drizzle
export * as schema from './schema';

