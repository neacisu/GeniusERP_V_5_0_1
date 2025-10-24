// Shared library exports - NX Monorepo
// Export all schemas
export * from './schema';

// Export types selectively to avoid conflicts
export { UserRole, Service } from './types';
export type { JwtPayload, JwtUserData, AuthUser } from './types';

// Re-export common entity types
export type { User } from './schema/admin.schema';

// Re-export schema as namespace for compatibility with drizzle
export * as schema from './schema';

