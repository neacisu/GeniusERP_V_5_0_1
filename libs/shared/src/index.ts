// Shared library exports - NX Monorepo
// Export all schemas
export * from './schema';

// Ensure legacy accounting tables remain available for modules still relying on
// the deprecated names. These explicit re-exports prevent tree-shaking issues
// during ESM bundling when only specific named exports are consumed.
export {
  ledgerEntries,
  ledgerEntriesRelations,
  ledgerLines,
  ledgerLinesRelations,
} from './schema/accounting.schema';
export type {
  LedgerEntry,
  InsertLedgerEntry,
  LedgerLine,
  InsertLedgerLine,
} from './schema/accounting.schema';

// Export types selectively to avoid conflicts
export { UserRole, Service } from './types';
export type { JwtPayload, JwtUserData, AuthUser } from './types';

// Re-export common entity types
// Note: User type is exported from ./schema.ts, not admin.schema.ts

// Re-export schema as namespace for compatibility with drizzle
export * as schema from './schema';

// Export module type
export * from './types/module';

